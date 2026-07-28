// ── /api/tablero · Motor de tableros ────────────────────────────────────────
// Todo el trafico pasa por aqui (server-side). El navegador solo habla con este
// endpoint: cero claves, cero dominios de terceros en el HTML, la politica de
// seguridad del sitio queda intacta.
//
// Lo importante que hace este archivo y NO puede hacer el navegador:
//   1. Recorta las columnas marcadas "visible solo para el dueno" antes de
//      mandar la respuesta. Si no eres el dueno, esas columnas no existen para
//      ti: no salen en la pantalla ni en los datos.
//   2. Escribe la bitacora de quien creo, edito o borro. Con el correo del
//      token, no con lo que diga el navegador (no se puede falsificar).
//
// Errores genericos a proposito, sin nombres de tablas ni rutas.
// ──────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;

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

// Lee el correo y el rol del token sin verificar firma (solo para decidir que
// mostrar). La seguridad real la aplica la base con sus propios candados.
function leerToken(token) {
  try {
    const p = JSON.parse(
      Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    return {
      email: p.email || '',
      sub: p.sub || '',
      rol: (p.app_metadata && p.app_metadata.role) || '',
    };
  } catch {
    return { email: '', sub: '', rol: '' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ ok: false });

  const URLB = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  if (!URLB || !ANON) {
    console.error('[tablero] faltan variables de entorno');
    return res.status(500).json({ ok: false, code: 'ENV' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false }); }
  }
  const action = body && body.action;
  const token = body && body.token;
  if (!token) return res.status(401).json({ ok: false });

  const yo = leerToken(token);
  const H = { apikey: ANON, Authorization: `Bearer ${token}` };
  const HJ = { ...H, 'Content-Type': 'application/json' };
  const api = (path) => `${URLB}/rest/v1/${path}`;

  // Deja rastro. Si la bitacora falla NO se tumba la operacion (ya se hizo),
  // pero queda el error en los registros privados del servidor.
  async function bitacora(tableroId, accion, detalle, itemId, columnaId) {
    try {
      const r = await fetch(api('tablero_bitacora'), {
        method: 'POST',
        headers: { ...HJ, Prefer: 'return=minimal' },
        body: JSON.stringify({
          tablero_id: tableroId,
          item_id: itemId || null,
          columna_id: columnaId || null,
          accion,
          detalle: detalle || null,
          actor_email: yo.email || null,
        }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        console.error('[tablero] bitacora fallo', r.status, t.slice(0, 200));
      }
    } catch (e) {
      console.error('[tablero] bitacora excepcion', e && e.message);
    }
  }

  try {
    // ── Lista de tableros del usuario ────────────────────────────────────────
    if (action === 'boards-list') {
      const r = await fetch(
        api('tableros?select=id,nombre,descripcion,modo_dependencia,owner_id,created_at,updated_at,updated_by&archivado=is.false&order=created_at.desc'),
        { headers: H }
      );
      if (!r.ok) return res.status(401).json({ ok: false });
      return res.status(200).json({ ok: true, rows: await r.json() });
    }

    // ── Crear tablero con las columnas esenciales ya puestas ─────────────────
    if (action === 'board-create') {
      const { nombre, descripcion, modoDependencia } = body;
      if (!nombre || !String(nombre).trim()) return res.status(400).json({ ok: false });
      const r = await fetch(`${URLB}/rest/v1/rpc/tablero_nuevo`, {
        method: 'POST',
        headers: HJ,
        body: JSON.stringify({
          p_nombre: String(nombre).slice(0, 120),
          p_descripcion: descripcion ? String(descripcion).slice(0, 400) : null,
          p_modo_dependencia: ['flexible', 'estricta', 'ninguna'].includes(modoDependencia)
            ? modoDependencia : 'flexible',
        }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        const faltaMigracion = /tablero_nuevo|does not exist|schema cache/i.test(t);
        console.error('[tablero] board-create fallo', r.status, t.slice(0, 300));
        return res.status(400).json({ ok: false, code: faltaMigracion ? 'SCHEMA' : 'BAD' });
      }
      return res.status(200).json({ ok: true, id: await r.json() });
    }

    // ── Tablero completo: grupos, columnas, renglones y celdas ───────────────
    // Aqui es donde se recortan las columnas "solo para mi".
    if (action === 'board-get') {
      const { tableroId } = body;
      if (!tableroId) return res.status(400).json({ ok: false });
      const q = encodeURIComponent(tableroId);

      const [rT, rG, rC, rI] = await Promise.all([
        fetch(api(`tableros?select=id,nombre,descripcion,modo_dependencia,owner_id&id=eq.${q}`), { headers: H }),
        fetch(api(`tablero_grupos?select=id,nombre,color,orden&tablero_id=eq.${q}&order=orden.asc`), { headers: H }),
        fetch(api(`tablero_columnas?select=id,nombre,tipo,opciones,orden,visible_solo_owner&tablero_id=eq.${q}&order=orden.asc`), { headers: H }),
        fetch(api(`tablero_items?select=id,grupo_id,nombre,numero_auto,orden,created_at,created_by,updated_at,updated_by&tablero_id=eq.${q}&order=orden.asc,numero_auto.asc`), { headers: H }),
      ]);
      if (!rT.ok || !rG.ok || !rC.ok || !rI.ok) return res.status(401).json({ ok: false });

      const tableros = await rT.json();
      const tablero = tableros && tableros[0];
      if (!tablero) return res.status(404).json({ ok: false });

      const esDueno = tablero.owner_id === yo.sub || yo.rol === 'admin';
      let columnas = await rC.json();
      // El recorte: si no eres el dueno, esas columnas NO viajan al navegador.
      if (!esDueno) columnas = columnas.filter((c) => !c.visible_solo_owner);
      const idsVisibles = new Set(columnas.map((c) => c.id));

      const items = await rI.json();
      let valores = [];
      if (items.length) {
        const ids = items.map((i) => `"${i.id}"`).join(',');
        const rV = await fetch(
          api(`tablero_valores?select=item_id,columna_id,valor,updated_at,updated_by&item_id=in.(${ids})`),
          { headers: H }
        );
        if (rV.ok) {
          valores = (await rV.json()).filter((v) => idsVisibles.has(v.columna_id));
        }
      }

      // Los sellos de creado/actualizado tampoco viajan si no eres el dueno.
      const itemsSalida = esDueno
        ? items
        : items.map(({ created_by, updated_by, ...resto }) => resto);

      return res.status(200).json({
        ok: true,
        tablero: {
          id: tablero.id,
          nombre: tablero.nombre,
          descripcion: tablero.descripcion,
          modo_dependencia: tablero.modo_dependencia,
        },
        esDueno,
        grupos: await rG.json(),
        columnas,
        items: itemsSalida,
        valores,
      });
    }

    // ── Grupo nuevo ──────────────────────────────────────────────────────────
    if (action === 'group-add') {
      const { tableroId, nombre, color, orden } = body;
      if (!tableroId || !nombre) return res.status(400).json({ ok: false });
      const r = await fetch(api('tablero_grupos'), {
        method: 'POST',
        headers: { ...HJ, Prefer: 'return=representation' },
        body: JSON.stringify({
          tablero_id: tableroId,
          nombre: String(nombre).slice(0, 120),
          color: /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#00897B',
          orden: Number.isFinite(orden) ? orden : 0,
        }),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      const rows = await r.json();
      await bitacora(tableroId, 'creo_grupo', { nombre });
      return res.status(200).json({ ok: true, row: rows && rows[0] });
    }

    // ── Columna nueva ────────────────────────────────────────────────────────
    if (action === 'column-add') {
      const TIPOS = ['estado','prioridad','label','persona','texto','texto_largo',
        'numero','fecha','semana','checkbox','enlace','ubicacion','telefono',
        'archivo','dependencia','avance'];
      const { tableroId, nombre, tipo, opciones, orden, visibleSoloOwner } = body;
      if (!tableroId || !nombre || !TIPOS.includes(tipo)) return res.status(400).json({ ok: false });
      const r = await fetch(api('tablero_columnas'), {
        method: 'POST',
        headers: { ...HJ, Prefer: 'return=representation' },
        body: JSON.stringify({
          tablero_id: tableroId,
          nombre: String(nombre).slice(0, 80),
          tipo,
          opciones: opciones || null,
          orden: Number.isFinite(orden) ? orden : 50,
          visible_solo_owner: !!visibleSoloOwner,
        }),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      const rows = await r.json();
      await bitacora(tableroId, 'creo_columna', { nombre, tipo });
      return res.status(200).json({ ok: true, row: rows && rows[0] });
    }

    // ── Renglon nuevo ────────────────────────────────────────────────────────
    if (action === 'item-add') {
      const { tableroId, grupoId, nombre } = body;
      if (!tableroId) return res.status(400).json({ ok: false });
      const r = await fetch(api('tablero_items'), {
        method: 'POST',
        headers: { ...HJ, Prefer: 'return=representation' },
        body: JSON.stringify({
          tablero_id: tableroId,
          grupo_id: grupoId || null,
          nombre: String(nombre || '').slice(0, 240),
        }),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      const rows = await r.json();
      const item = rows && rows[0];
      await bitacora(tableroId, 'creo_renglon', { nombre: nombre || '' }, item && item.id);
      return res.status(200).json({ ok: true, row: item });
    }

    // ── Renombrar renglon ────────────────────────────────────────────────────
    if (action === 'item-rename') {
      const { tableroId, itemId, nombre } = body;
      if (!tableroId || !itemId) return res.status(400).json({ ok: false });
      const r = await fetch(api(`tablero_items?id=eq.${encodeURIComponent(itemId)}`), {
        method: 'PATCH',
        headers: { ...HJ, Prefer: 'return=minimal' },
        body: JSON.stringify({ nombre: String(nombre || '').slice(0, 240) }),
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      await bitacora(tableroId, 'edito_renglon', { nombre }, itemId);
      return res.status(200).json({ ok: true });
    }

    // ── Borrar renglon ───────────────────────────────────────────────────────
    if (action === 'item-delete') {
      const { tableroId, itemId } = body;
      if (!tableroId || !itemId) return res.status(400).json({ ok: false });
      // La bitacora se escribe ANTES: si se borra primero, se pierde el rastro.
      await bitacora(tableroId, 'borro_renglon', null, itemId);
      const r = await fetch(api(`tablero_items?id=eq.${encodeURIComponent(itemId)}`), {
        method: 'DELETE', headers: H,
      });
      if (!r.ok) return res.status(400).json({ ok: false });
      return res.status(200).json({ ok: true });
    }

    // ── Guardar una celda ────────────────────────────────────────────────────
    if (action === 'value-set') {
      const { tableroId, itemId, columnaId, valor } = body;
      if (!tableroId || !itemId || !columnaId) return res.status(400).json({ ok: false });
      const r = await fetch(api('tablero_valores'), {
        method: 'POST',
        headers: { ...HJ, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ item_id: itemId, columna_id: columnaId, valor: valor ?? null }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        console.error('[tablero] value-set fallo', r.status, t.slice(0, 200));
        return res.status(400).json({ ok: false });
      }
      await bitacora(tableroId, 'edito_celda', { valor: valor ?? null }, itemId, columnaId);
      return res.status(200).json({ ok: true });
    }

    // ── Bitacora del tablero (solo el dueno la puede leer) ───────────────────
    if (action === 'log-list') {
      const { tableroId } = body;
      if (!tableroId) return res.status(400).json({ ok: false });
      const r = await fetch(
        api(`tablero_bitacora?select=accion,detalle,actor_email,created_at,item_id&tablero_id=eq.${encodeURIComponent(tableroId)}&order=created_at.desc&limit=200`),
        { headers: H }
      );
      if (!r.ok) return res.status(401).json({ ok: false });
      return res.status(200).json({ ok: true, rows: await r.json() });
    }

    return res.status(400).json({ ok: false });
  } catch (e) {
    console.error('[tablero] excepcion en accion', action, ':', e && e.message);
    return res.status(500).json({ ok: false, code: 'EX' });
  }
}
