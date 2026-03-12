# bondíaCT · LEEME — Bitácora del Proyecto
> **Para Claude:** Lee este archivo primero en cada sesión nueva antes de tocar cualquier cosa.
> **Para Rod:** No borres nada de este repo sin consultarme. Si algo se rompe, dime "revisa el LEEME de bondiact".

---

## ¿Qué es este proyecto?
**bondíaCT** (`bondiact.io`) — Sitio web de Lightman Freight Forwarding & Customs Brokerage, Guadalajara, Jalisco, México.
Servicios: Freight Forwarding, Agencia Aduanal, Depósito Fiscal, Sk3pl In-Bond.
Contacto interno: Rod (Rodrigo Pardo) — `rodrigo@bondiact.io`

---

## Dónde vive el sitio
| Canal | URL |
|---|---|
| **Producción** | https://bondiact.io (via Vercel) |
| **GitHub Pages** | https://rp26managment.github.io/bondiact/ligie/ |
| **Repo GitHub** | `rp26managment/bondiact` |
| **Carpeta local Mac** | `~/Desktop/bondiact` (o donde esté el repo clonado) |

---

## Archivos críticos — ⛔ NO BORRAR

| Archivo | Qué es | ⚠️ |
|---|---|---|
| `index.html` | Landing page principal de bondiact.io | **NO TOCAR SIN CLAUDE** |
| `og-image.png` | Imagen preview para LinkedIn/WhatsApp (1200×630px) | No borrar |
| `CNAME` | Le dice a GitHub Pages que el dominio es bondiact.io | **NUNCA BORRAR** — si lo borras el sitio deja de funcionar |
| `ligie/index.html` | Buscador LIGIE V2.13 (~7.7MB) | **NO TOCAR SIN CLAUDE** |
| `assets/` | CSS y JS del sitio (generados automáticamente) | No editar manualmente |
| `.gitignore` | Evita subir archivos basura (.DS_Store) | No borrar |

---

## Historial de cambios (más reciente arriba)

### 2026-03-12 — SEO completo bondiact.io
- ✅ Agregados a `index.html`: Canonical URL, Open Graph (og:title/description/image/url/type/site_name/locale), Twitter Card, JSON-LD Schema.org (Organization)
- ✅ Creado `og-image.png` (1200×630px) desde logos PDF de bondíaCT
- ⏳ **Pendiente commit + push a GitHub** (Rod hace esto en GitHub Desktop)

### 2026-01-XX — LIGIE V2.13 · Buscador completo
- ✅ Extracción completa de PDF LIGIE V2.13 (19 dic 2024, 1315 págs)
- ✅ 11,493 registros embedidos en `ligie/index.html`
- ✅ Versión: LIGIE V2.13 · v2.0 · © 2026
- ✅ Corregidos: 2308.00.02 faltante, 32 IGI vacíos (capítulos 9/95), 2 descripciones vacías
- ✅ Deployado en Vercel (bondiact.io/ligie/) y GitHub Pages

---

## Tareas pendientes

- [ ] **Hacer commit + push** de los cambios SEO (index.html + og-image.png) en GitHub Desktop
- [ ] Conectar Google Analytics 4 real (el ID actual es placeholder: `G-XXXXXXXXXX`)
- [ ] Crear og-image.png de mejor calidad cuando tengas el logo en SVG/AI
- [ ] Arreglar botón "Ver Guía" (abre modal de versión en lugar de guía)
- [ ] Cambiar "Datos actualizados 2024" → 2025/2026 en trust badge del hero

---

## Cómo hacer deploy
1. Editar archivos en la carpeta local del repo
2. Abrir **GitHub Desktop** → seleccionar repo `bondiact`
3. Escribir nombre del commit → **Commit to main**
4. **Push origin**
5. Vercel detecta el push y redeploya automáticamente (~1-2 min)

---

## Cómo montar esta carpeta en Cowork (sesión nueva)
Decirle a Claude:
> *"Monta la carpeta ~/Desktop/bondiact (o donde esté el repo)"*

---

*Última actualización: 2026-03-12 por Claude (Cowork)*
