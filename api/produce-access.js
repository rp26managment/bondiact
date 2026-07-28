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

// Checklist estandar de documentos para exportacion/importacion MX (mismo
// listado del "Requisitos 2026" que se usa para tramitar despachos aduanales).
// Se siembra completo al dar de alta a un agricultor, con estatus 'pendiente'.
const CHECKLIST_ESTANDAR = [
  'Constancia de situacion fiscal (del mes en curso)',
  'Comprobante de domicilio fiscal (no mayor a 2 meses)',
  'Acta constitutiva con Registro Publico de la Propiedad',
  'Poder del representante legal (actos de administracion, pleitos y cobranza)',
  'Identificacion oficial del representante legal (pasaporte, INE o FM2-FM3)',
  'Constancia de Situacion Fiscal del representante legal (SAT, del mes en curso)',
  'Opinion del Cumplimiento de Obligaciones Fiscales (SAT, del mes en curso)',
  'IMMEX, PROSEC, Certificacion IVA/IEPS, ECEX, etc. (cuando aplique)',
  'Cartas encomienda (en original)',
  'Encargo conferido al Agente Aduanal ante el SAT',
  'Sello digital para ventanilla unica: COVE/VUCEM (.CER, .KEY, contrasena y clave web)',
  'Verificacion de domicilio fiscal (acta SAT o estatus en el portal SAT)',
  'Fotografias del domicilio fiscal (fachada, maquinaria, oficina, personal, transporte)',
  'Documento que acredite la legal propiedad o posesion del inmueble y activos',
];

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
  if (!URLB || !ANON || !SRK) {
    // Diagnostico SOLO en logs de Vercel: nombres de las que faltan, nunca valores.
    const faltan = [];
    if (!URLB) faltan.push('SUPABASE_URL');
    if (!ANON) faltan.push('SUPABASE_ANON_KEY');
    if (!SRK) faltan.push('SUPABASE_SERVICE_ROLE_KEY');
    console.error('[produce-access] env faltantes:', faltan.join(','), '| node', process.version);
    return res.status(500).json({ ok: false, code: 'ENV' });
  }
  if (typeof fetch !== 'function') {
    console.error('[produce-access] fetch no disponible | node', process.version);
    return res.status(500).json({ ok: false, code: 'FETCH' });
  }

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

      // Limpieza: cada intento fallido deja un factor TOTP a medias.
      // Supabase topa en 10 por usuario, asi que se borran los pendientes
      // antes de crear el nuevo. Los ya verificados NO se tocan.
      try {
        const uR = await fetch(`${URLB}/auth/v1/user`, {
          headers: { apikey: ANON, Authorization: `Bearer ${token}` },
        });
        if (uR.ok) {
          const u = await uR.json();
          const pendientes = ((u && u.factors) || []).filter(
            (f) => f.factor_type === 'totp' && f.status !== 'verified'
          );
          for (const f of pendientes) {
            await fetch(`${URLB}/auth/v1/factors/${f.id}`, {
              method: 'DELETE',
              headers: { apikey: ANON, Authorization: `Bearer ${token}` },
            });
          }
        }
      } catch {
        // Si la limpieza falla, se continua: no debe bloquear el alta.
      }

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

      // Registro del acceso (server-side, el cliente no lo puede brincar).
      // Si algo falla aqui NO se bloquea el login (el usuario ya entro bien),
      // pero se deja rastro en los logs de Vercel para poder diagnosticar.
      try {
        const uRes = await fetch(`${URLB}/auth/v1/user`, {
          headers: { apikey: ANON, Authorization: `Bearer ${vj.access_token}` },
        });
        if (!uRes.ok) {
          console.error('[produce-access] access-log: /auth/v1/user fallo, status', uRes.status);
        } else {
          const user = await uRes.json();
          const logRes = await fetch(`${URLB}/rest/v1/produce_access_log`, {
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
          if (!logRes.ok) {
            const errBody = await logRes.text().catch(() => '');
            console.error(
              '[produce-access] access-log: insert fallo, status', logRes.status,
              '| body:', errBody.slice(0, 300)
            );
          }
        }
      } catch (logErr) {
        console.error('[produce-access] access-log: excepcion', logErr && logErr.message);
      }
      return res.status(200).json({ ok: true, token: vj.access_token });
    }

    if (action === 'profile') {
      const { token } = body;
      if (!token) return res.status(401).json({ ok: false });
      // Se pide primero con las columnas nuevas (razon_social, operacion). Si la
      // migracion todavia no se corrio, esas columnas no existen y se reintenta
      // con el juego de columnas viejo, para no tumbar el panel mientras tanto.
      const BASE = 'id,commodity,aduana,agri_code,contenido,created_at,updated_at';
      const h = { apikey: ANON, Authorization: `Bearer ${token}` };
      let r = await fetch(
        `${URLB}/rest/v1/produce_profiles?select=${BASE},razon_social,operacion&order=created_at.asc`,
        { headers: h }
      );
      if (!r.ok) {
        r = await fetch(
          `${URLB}/rest/v1/produce_profiles?select=${BASE}&order=created_at.asc`,
          { headers: h }
        );
      }
      if (!r.ok) return res.status(401).json({ ok: false });
      const rows = await r.json();
      // Nota: si el token es de admin, RLS regresa TODOS los perfiles (no solo
      // el propio). Es el mismo candado de siempre (app_metadata.role), no
      // logica extra aqui. El front decide si pinta panel admin con esto.
      return res.status(200).json({ ok: true, rows });
    }

    if (action === 'profiles-create') {
      // Alta de expediente de exportador: SOLO admin (la RLS de escritura lo
      // exige de todos modos). NO se crea cuenta de acceso aqui: el expediente
      // nace sin usuario ligado y se vincula despues, cuando se invita a la
      // persona. Por eso user_id va nulo (requiere la migracion de folio).
      //
      // El FOLIO no se calcula aqui: lo pone la base con un trigger, para que
      // sea unico e irrepetible aunque se creen dos al mismo tiempo. Sufijo por
      // tipo de operacion: exporta = X, importa = M, ambas = 2.
      const { token, razonSocial, operacion, commodity, aduana, seedChecklist } = body;
      const OPS = ['exporta', 'importa', 'ambas'];
      if (!token || !razonSocial || !commodity || !aduana || !OPS.includes(operacion))
        return res.status(400).json({ ok: false });
      const r = await fetch(`${URLB}/rest/v1/produce_profiles`, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          razon_social: String(razonSocial).slice(0, 200),
          operacion,
          commodity,
          aduana,
        }),
      });
      if (!r.ok) {
        // 400 con columna/constraint desconocida = falta correr la migracion.
        // Se distingue para que el panel pueda decirlo en cristiano.
        const err = await r.text().catch(() => '');
        const faltaMigracion = /razon_social|operacion|null value in column "user_id"|violates not-null/i.test(err);
        console.error('[produce-access] profiles-create fallo, status', r.status, '| body:', err.slice(0, 300));
        return res
          .status(400)
          .json({ ok: false, code: faltaMigracion ? 'SCHEMA' : 'BAD' });
      }
      const rows = await r.json();
      const profile = rows && rows[0];
      if (seedChecklist && profile && profile.id) {
        const docs = CHECKLIST_ESTANDAR.map((tipo) => ({
          profile_id: profile.id,
          tipo_documento: tipo,
        }));
        await fetch(`${URLB}/rest/v1/produce_documents`, {
          method: 'POST',
          headers: {
            apikey: ANON,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(docs),
        }).catch(() => {});
      }
      return res.status(200).json({ ok: true, profile });
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

    if (action === 'documents-list') {
      // Sin profileId: RLS decide. Admin ve TODOS los documentos (Kanban
      // general); un agricultor normal solo ve los suyos.
      const { token, profileId } = body;
      if (!token) return res.status(401).json({ ok: false });
      let url = `${URLB}/rest/v1/produce_documents?select=id,profile_id,tipo_documento,estatus,subido_por,nota,created_at,updated_at&order=created_at.desc`;
      if (profileId) url += `&profile_id=eq.${encodeURIComponent(profileId)}`;
      const r = await fetch(url, {
        headers: { apikey: ANON, Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return res.status(401).json({ ok: false });
      const rows = await r.json();
      return res.status(200).json({ ok: true, rows });
    }

    if (action === 'documents-add') {
      // Solo admin puede escribir (RLS lo hace cumplir de todos modos).
      const { token, profileId, tipoDocumento } = body;
      if (!token || !profileId || !tipoDocumento)
        return res.status(400).json({ ok: false });
      const r = await fetch(`${URLB}/rest/v1/produce_documents`, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          profile_id: profileId,
          tipo_documento: String(tipoDocumento).slice(0, 120),
        }),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      const rows = await r.json();
      return res.status(200).json({ ok: true, rows });
    }

    if (action === 'documents-status') {
      const { token, docId, estatus, subidoPor } = body;
      const validos = ['pendiente', 'proceso', 'revision', 'listo'];
      if (!token || !docId || !validos.includes(estatus))
        return res.status(400).json({ ok: false });
      const patch = { estatus };
      if (typeof subidoPor === 'string') patch.subido_por = subidoPor.slice(0, 120);
      const r = await fetch(`${URLB}/rest/v1/produce_documents?id=eq.${encodeURIComponent(docId)}`, {
        method: 'PATCH',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(patch),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      return res.status(200).json({ ok: true });
    }

    if (action === 'documents-delete') {
      const { token, docId } = body;
      if (!token || !docId) return res.status(400).json({ ok: false });
      const r = await fetch(`${URLB}/rest/v1/produce_documents?id=eq.${encodeURIComponent(docId)}`, {
        method: 'DELETE',
        headers: { apikey: ANON, Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      return res.status(200).json({ ok: true });
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
  } catch (e) {
    // Al cliente: error generico, sin detalles que sirvan de huella digital.
    // A los logs de Vercel (privados): el mensaje, para poder diagnosticar.
    // Solo el HOST (dato publico, va en cualquier frontend) y longitudes.
    // NUNCA el valor de las llaves.
    let host = 'ilegible';
    try { host = new URL(URLB).host; } catch { host = 'URL invalida: ' + JSON.stringify(String(URLB).slice(0, 60)); }
    console.error(
      '[produce-access] excepcion en accion', action, ':', e && e.message,
      '| host:', host,
      '| largos anon/srk:', String(ANON).length, '/', String(SRK).length
    );
    return res.status(500).json({ ok: false, code: 'EX' });
  }
}
