// ── S18-SEC-04 · API Route Server-Side para Lead Form ─────────────────────
// Proxy seguro: el webhook URL de Make.com vive en env var de Vercel,
// NO en el HTML público. Valida campos antes de reenviar.
//
// Vercel env var requerida:
//   MAKE_WEBHOOK_URL = https://hook.us2.make.com/xxxxxxxxxxxxxxxxxxxx
//
// Rod: configura la env var en Vercel Dashboard → bondiact-rltn → Settings → Environment Variables
// ──────────────────────────────────────────────────────────────────────────

// Rate limiting simple en memoria (se resetea por cold start, ~5 min)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 5; // máximo 5 requests por IP por minuto

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

// IP blocklist — actores hostiles conocidos (Incidente Gopak 22-May-2026).
// NOTA: 170.85.22.82 es exit node de Zscaler enterprise proxy en Rio de Janeiro, BR.
// Bloquearla añade fricción al BPA (Brazil Persistent Actor) pero puede impactar
// a usuarios legítimos que salen por el mismo nodo Zscaler. Trade-off aceptado
// dado el historial 2021-2026. Para agregar más IPs: añadir al Set y commitear.
const IP_BLOCKLIST = new Set([
  '170.85.22.82', // BPA — Incidente Gopak 22-May-2026 (Rio de Janeiro / Zscaler)
]);

function isBlockedIp(ip) {
  if (!ip || ip === 'unknown') return false;
  if (IP_BLOCKLIST.has(ip)) return true;
  for (const blocked of IP_BLOCKLIST) {
    if (ip.startsWith(blocked)) return true;
  }
  return false;
}

// Dominios bloqueados (anti-coyotes) — misma lista que el frontend
const BLOCKED_DOMAINS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com',
  'yahoo.com', 'ymail.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'tutanota.com', 'tutamail.com', 'tuta.io',
  'zoho.com', 'zohomail.com', 'mail.com', 'email.com', 'gmx.com', 'gmx.net',
  'yandex.com', 'yandex.ru', 'fastmail.com', 'hushmail.com', 'mailfence.com',
  'runbox.com', 'posteo.de', 'disroot.org', 'riseup.net', 'autistici.org',
  'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'mailinator.com',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'temp-mail.org',
  'fake-email.net', '10minutemail.com', 'trashmail.com', 'maildrop.cc',
  'dispostable.com', 'mailnesia.com', 'inbox.lv',
];

function isBlockedEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return BLOCKED_DOMAINS.includes(domain);
}

function sanitize(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 200);
}

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — solo bondiact.io
  const origin = req.headers.origin || '';
  const allowedOrigins = ['https://bondiact.io', 'https://www.bondiact.io'];
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // IP blocklist + Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  // Block IPs hostiles conocidas — respuesta 200 fake para no dar señal al atacante
  if (isBlockedIp(ip)) {
    console.warn(`[submit-lead] BLOCKED hostile IP: ${ip}`);
    return res.status(200).json({ success: true, message: 'Lead submitted' });
  }

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in 1 minute.' });
  }

  // Validar webhook URL
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('[submit-lead] MAKE_WEBHOOK_URL env var not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Parsear body
  const { nombre, empresa, correo, telefono, whatsapp } = req.body || {};

  // Validaciones
  if (!nombre || !empresa || !correo || !telefono) {
    return res.status(400).json({ error: 'Missing required fields: nombre, empresa, correo, telefono' });
  }

  if (isBlockedEmail(correo)) {
    return res.status(400).json({ error: 'Corporate email required' });
  }

  // Sanitizar
  const payload = {
    nombre: sanitize(nombre),
    empresa: sanitize(empresa),
    correo: sanitize(correo),
    telefono: sanitize(telefono),
    whatsapp: sanitize(whatsapp || ''),
    timestamp: new Date().toISOString(),
    source: 'bondiact.io/controltower',
    ip: ip.substring(0, 45), // limitar longitud IP
  };

  // Reenviar a Make.com
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[submit-lead] Make.com responded:', response.status);
      return res.status(502).json({ error: 'Upstream error' });
    }

    return res.status(200).json({ success: true, message: 'Lead submitted' });
  } catch (err) {
    console.error('[submit-lead] Fetch error:', err.message);
    return res.status(502).json({ error: 'Failed to reach webhook' });
  }
}
