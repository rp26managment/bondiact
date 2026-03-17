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
| **Carpeta local Mac** | `~/Documents/GitHub/bondiact` |

---

## Archivos críticos — ⛔ NO BORRAR

| Archivo | Qué es | ⚠️ |
|---|---|---|
| `index.html` | Landing page principal de bondiact.io | **NO TOCAR SIN CLAUDE** |
| `og-image.png` | Imagen preview para LinkedIn/WhatsApp (1200×630px) | No borrar |
| `CNAME` | Le dice a GitHub Pages que el dominio es bondiact.io | **NUNCA BORRAR** — si lo borras el sitio deja de funcionar |
| `ligie/index.html` | Buscador LIGIE V2.13 (~7.7MB) | **NO TOCAR SIN CLAUDE** |
| `images/` | Imágenes del sitio (Control Tower concept + ecosystem) | No borrar |
| `assets/` | CSS y JS del sitio (generados automáticamente) | No editar manualmente |
| `.gitignore` | Evita subir archivos basura (.DS_Store) | No borrar |

---

## Historial de cambios (más reciente arriba)

### 2026-03-17 (sesión 2) — CookieBanner + fix form salthub
- ✅ **CookieBanner vanilla JS**: Inyectado en `index.html` (no requiere rebuild React). Cumple LFPDPPP/GDPR. Opciones: Aceptar todas, Solo esenciales, Rechazar. Guarda preferencia en `localStorage` key `bondiact_cookie_consent`. Aparece 1.5s después de carga, animación suave.

### 2026-03-17 — Correcciones UX, Seguridad y Diseño (Observaciones Comet)
- ✅ **Navbar simplificado**: 9 enlaces → 5 (Inicio, Servicios, Control Tower, Cobertura, Contacto)
- ✅ **Footer limpio**: Eliminados "Blog" y "Carreras" (no existen aún)
- ✅ **Social links**: Eliminados Facebook, X/Twitter, Instagram — solo LinkedIn (B2B)
- ✅ **Links legales**: Redirigidos a #contacto (antes apuntaban a # roto)
- ✅ **Kanban colores corregidos**: Rojo (Por Hacer) → Amarillo (En Progreso/Revisión) → Verde (Completado)
- ✅ **Control Tower imágenes**: Agregada carpeta `images/` con concept + ecosystem PNG
- ✅ **ScrumDashboard oculto**: Botón Dashboard removido (sin funcionalidad aún)
- ✅ **Logo transparente**: Creadas 2 versiones en Desktop (oscuro + blanco) para PDF/firma email
- ⏳ **Pendiente commit + push** (Rod en GitHub Desktop)
- ⚠️ **Código fuente** editado también en: `~/Desktop/BondiaCT respaldo/Kimi_Agent_Bondia Control Tower website/app/src/`
  - Para rebuild limpio futuro: `cd app && npm install && npm run build`
  - Copiar `dist/` → repo bondiact

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

### 2026-03-17 (sesión 3) — Rescate del sitio caído · por Comet (Perplexity)
- 🔴 **Problema:** bondiact.io cayó con 404 — el repo se había vuelto privado, desactivando GitHub Pages automáticamente
- ⚠️ **Causa raíz:** En una sesión anterior se recomendó hacer el repo privado (error de diagnóstico)
- ✅ **Solución:** Repo regresado a **público** + GitHub Pages reactivado en rama `main`
- ✅ Sitio restaurado en menos de 5 minutos sin tocar código
- ⚠️ **REGLA CRÍTICA PARA TODOS LOS IAs (Claude, Comet, Gemini, KIMI):**
  - **NUNCA sugerir hacer este repo privado** — GitHub Pages requiere repo público en plan gratuito
  - Si el repo se vuelve privado → GitHub Pages se desactiva → bondiact.io cae inmediatamente
  - El código fuente de bondiact.io es HTML estático, no contiene datos sensibles

## Tareas pendientes

- [x] ~~**Hacer commit + push** de TODOS los cambios del 2026-03-17~~ → Commits hechos directo en GitHub (equivale a push) ✅
- [x] ~~Conectar Google Analytics 4 real~~ → **HECHO** ID: `G-1VYF2B45CJ` con `anonymize_ip` y `SameSite=None;Secure` ✅
- [ ] Agregar reCAPTCHA al formulario de contacto (requiere rebuild desde código fuente)
- [x] ~~Crear Aviso de Privacidad real~~ → **HECHO** `privacidad.html` publicado en bondiact.io/privacidad.html (LFPDPPP 9 secciones) ✅
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
> *"Monta ~/Documents/GitHub/bondiact"*

---

*Última actualización: 2026-03-17 (sesión 4) por Comet (Perplexity)*


---

### 2026-03-17 (sesión 4) — Aviso de Privacidad + GA4 · por Comet (Perplexity)

#### ✅ Archivos nuevos
- `privacidad.html` — Aviso de Privacidad completo (LFPDPPP, 9 secciones)
  - Responsable: Shekhina Management S.A. de C.V.
  - Contacto: `contacto@bondiact.io`
  - Vigencia: 1 de enero de 2026
  - URL: https://bondiact.io/privacidad.html

#### ✅ Cambios en `index.html`
- **Cookie banner:** link "Aviso de Privacidad" actualizado de `#contacto` → `privacidad.html`
- **Footer estático:** agregado `<footer>` con link a `privacidad.html` antes de `</body>`
- **Google Analytics 4:** ID real `G-1VYF2B45CJ` activado
  - Parámetros: `anonymize_ip: true`, `cookie_flags: SameSite=None;Secure`
  - Script async cargado desde googletagmanager.com

#### ✅ Cambios en `privacidad.html`
- Email `rodrigo@bondiact.io` reemplazado por `contacto@bondiact.io` en **4 lugares**:
  - Sección I (Identidad del Responsable)
  - Sección III (Opt-out marketing)
  - Sección VII (Derechos ARCO)
  - Footer de la página

#### 📝 Nota importante — GA4
- Para verificar: analytics.google.com → propiedad G-1VYF2B45CJ → Informes → Tiempo real
- El script ya está en el `<head>` de index.html pero GA4 solo dispara si el visitante acepta cookies en el banner

#### ⚠️ Commits de esta sesión (directo en GitHub = commit + push)
1. `Create privacidad.html` — archivo nuevo con aviso completo
2. `Update cookie banner: link Aviso de Privacidad -> privacidad.html`
3. `Add static privacy footer with Aviso de Privacidad link`
4. `Replace rodrigo@bondiact.io with contacto@bondiact.io in all sections`
5. `Activate GA4: G-1VYF2B45CJ with anonymize_ip and SameSite cookie flags`
6. Este commit (LEEME.md actualizado)
