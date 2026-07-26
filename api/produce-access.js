// ── /api/produce-access · Proxy de auth + registro de accesos de /produce ──
// TODO el trafico a Supabase pasa por aqui (server-side). El navegador solo
// habla con este endpoint: cero claves, cero dominios de terceros en el HTML
// y la CSP del sitio queda intacta (connect-src 'self').
//
// Acciones: login (email+password), enroll (alta TOTP, devuelve QR),
// verify (codigo 6 digitos, sube a aal2 y REGISTRA el acceso con IP),
// profile (lee el perfil del usuario via RLS), logout.
//
// Vercel env vars requeridas (Dashboard → bondiact → Settings → Env Vars):
//   SUPABASE_URL              = https://<proyecto>.supabase.co
//   SUPABASE_ANON_KEY         = (anon/publishable)
//   SUPABASE_SERVICE_ROLE_KEY = (service_role, SOLO aqui, jamas en frontend)
//
// Seguridad: errores genericos a proposito (sin stack, sin rutas, sin nombres
// de tablas). Regla de higiene anti-reconocimiento. Rate limit por IP.
// ──────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 12;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ ok: false });

  const URLB = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URLB || !ANON || !SRK) return res.status(500).json({ ok: false });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false });
    }
  }
  const action = body && body.action;

  try {
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) return res.status(400).json({ ok: false });
      const r = await fetch(`${URLB}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return res.status(401).json({ ok: false });
      const j = await r.json();
      const factors = (j.user && j.user.factors) || [];
      const f = factors.find(
        (x) => x.factor_type === 'totp' && x.status === 'verified'
      );
      return res
        .status(200)
        .json({ ok: true, token: j.access_token, factorId: f ? f.id : null });
    }

    if (action === 'enroll') {
      const { token } = body;
      if (!token) return res.status(401).json({ ok: false });
      const r = await fetch(`${URLB}/auth/v1/factors`, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          factor_type: 'totp',
          friendly_name: 'produce-' + Date.now(),
        }),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      const j = await r.json();
      return res.status(200).json({
        ok: true,
        factorId: j.id,
        qr: (j.totp && j.totp.qr_code) || '',
      });
    }

    if (action === 'verify') {
      const { token, factorId, code } = body;
      if (!token || !factorId || !code)
        return res.status(400).json({ ok: false });
      const ch = await fetch(`${URLB}/auth/v1/factors/${factorId}/challenge`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${token}` },
      });
      if (!ch.ok) return res.status(401).json({ ok: false });
      const cj = await ch.json();
      const v = await fetch(`${URLB}/auth/v1/factors/${factorId}/verify`, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challenge_id: cj.id, code }),
      });
      if (!v.ok) return res.status(401).json({ ok: false });
      const vj = await v.json();

      // Registro del acceso (server-side, el cliente no lo puede brincar)
      const uRes = await fetch(`${URLB}/auth/v1/user`, {
        headers: { apikey: ANON, Authorization: `Bearer ${vj.access_token}` },
      });
      if (uRes.ok) {
        const user = await uRes.json();
        await fetch(`${URLB}/rest/v1/produce_access_log`, {
          method: 'POST',
          headers: {
            apikey: SRK,
            Authorization: `Bearer ${SRK}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email || null,
            ip: ip === 'unknown' ? null : ip,
            user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
          }),
        });
      }
      return res.status(200).json({ ok: true, token: vj.access_token });
    }

    if (action === 'profile') {
      const { token } = body;
      if (!token) return res.status(401).json({ ok: false });
      const r = await fetch(
        `${URLB}/rest/v1/produce_profiles?select=commodity,aduana,agri_code,contenido`,
        { headers: { apikey: ANON, Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) return res.status(401).json({ ok: false });
      const rows = await r.json();
      // Nota: si el token es de admin, RLS regresa TODOS los perfiles (no solo
      // el propio). Es el mismo candado de siempre (app_metadata.role), no
      // logica extra aqui. El front decide si pinta panel admin con esto.
      return res.status(200).json({ ok: true, rows });
    }

    if (action === 'access-log') {
      // Panel admin: quien entro, cuando, desde que IP. RLS (produce_access_log
      // _admin_read) solo deja pasar filas si el token trae role=admin en
      // app_metadata; para cualquier otro usuario esto regresa arreglo vacio.
      const { token } = body;
      if (!token) return res.status(401).json({ ok: false });
      const r = await fetch(
        `${URLB}/rest/v1/produce_access_log?select=email,ip,user_agent,created_at&order=created_at.desc&limit=200`,
        { headers: { apikey: ANON, Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) return res.status(401).json({ ok: false });
      const rows = await r.json();
      return res.status(200).json({ ok: true, rows });
    }

    if (action === 'logout') {
      const { token } = body;
      if (token) {
        await fetch(`${URLB}/auth/v1/logout`, {
          method: 'POST',
          headers: { apikey: ANON, Authorization: `Bearer ${token}` },
        });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false });
  } catch {
    // Error generico: sin detalles que sirvan de huella digital
    return res.status(500).json({ ok: false });
  }
}
