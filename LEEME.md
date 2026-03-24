# bondíaCT · LEEME — Bitácora del Proyecto
> **Para Claude:** Lee este archivo primero en cada sesión nueva antes de tocar cualquier cosa.
> **Para Rod:** No borres nada de este repo sin consultarme. Si algo se rompe, dime "revisa el LEEME de bondiact".

---

## ⚠️ REGLA CRÍTICA — LEER ANTES DE CUALQUIER COSA

**NUNCA sugerir hacer este repo privado** — GitHub Pages requiere repo público en plan gratuito de GitHub.
Si el repo se vuelve privado → GitHub Pages se desactiva → **bondiact.io cae inmediatamente**.
El código fuente de bondiact.io es HTML estático, no contiene datos críticos sensibles.
Esta regla aplica para: Claude, Comet, Gemini, Kimi, o cualquier otro asistente IA.

---

## ¿Qué es este proyecto?
**bondíaCT** (`bondiact.io`) — Sitio web de Lightman Freight Forwarding & Customs Brokerage, Guadalajara, Jalisco, México.
Servicios: Freight Forwarding, Agencia Aduanal, Depósito Fiscal, Sk3pl In-Bond.
Contacto interno: Rod (Rodrigo Pardo) — `rodrigo@bondiact.io` · `contacto@bondiact.io`

---

## Dónde vive el sitio
| Canal | URL |
|---|---|
| **Producción** | https://bondiact.io (vía **GitHub Pages** — repo debe ser **PÚBLICO**) |
| **LIGIE Buscador** | https://bondiact.io/ligie/ |
| **Aviso de Privacidad** | https://bondiact.io/privacidad.html |
| **Repo GitHub** | `rp26managment/bondiact` (público) |
| **Carpeta local Mac** | `~/Desktop/BondiaCT respaldo` (iCloud Desktop — carpeta roja) |

---

## Archivos críticos — ⛔ NO BORRAR

| Archivo | Qué es | ⚠️ |
|---|---|---|
| `index.html` | Landing page principal · SEO · CookieBanner · GA4 | **NO TOCAR SIN CLAUDE/COMET** |
| `CNAME` | Apunta dominio bondiact.io a GitHub Pages | **NUNCA BORRAR** — si lo borras el sitio cae |
| `privacidad.html` | Aviso de Privacidad LFPDPPP (9 secciones) | No borrar |
| `og-image.png` | Imagen preview LinkedIn/WhatsApp (1200×630px) | No borrar |
| `ligie/index.html` | Buscador LIGIE V2.13 (~7.7MB · 11,493 registros) | **NO TOCAR SIN CLAUDE** |
| `images/` | Imágenes Control Tower (concept + ecosystem PNG) | No borrar |
| `assets/` | CSS y JS compilados del sitio React | No editar manualmente |
| `.gitignore` | Evita subir archivos basura (.DS_Store) | No borrar |

---

## Historial de cambios (más reciente arriba)

### 2026-03-19 — Security Hardening · por Claude (Cowork)
- ✅ **CSP (Content Security Policy)**: Meta tag agregado a `ligie/index.html` — bloquea scripts externos no autorizados
- ✅ **Anti-clickjacking**: `X-Frame-Options: DENY` — previene que el sitio sea embebido en iframes maliciosos
- ✅ **MIME Sniffing**: `X-Content-Type-Options: nosniff` agregado
- ✅ **Referrer Policy**: `strict-origin-when-cross-origin` — no revela la URL a sitios externos
- ✅ **XSS sanitización**: `escHtml()` aplicado a `fc`, `l.code`, `l.note`, `sec`, `r.c`, `r.f`, `r.n` en todos los `innerHTML`
- ✅ **Error messages**: Mensajes de auth ya no revelan el email del usuario ni detalles técnicos del error
- ⚠️ **Limitación estructural conocida**: `ALLOWED_EMAILS` vive en el JS del cliente — un atacante con DevTools puede bypassear el login. Los datos LIGIE están en el HTML público. Solución real requiere backend (Firebase Security Rules + API) — pendiente para versión futura.

### 2026-03-18 — CookieBanner + Favicon + LIGIE Access Control + Fix Ver Guía · por Claude (Cowork)
- ✅ **Fix botón "Ver Guía"** en LIGIE: La sección `#guia` vive dentro de `#dashboardView` (oculto por defecto). El botón ahora ejecuta `switchView('dashboard')` antes de hacer scroll, para que el contenedor sea visible primero.
- ✅ **CookieBanner vanilla JS**: Inyectado en `index.html` (no requiere rebuild React). Cumple LFPDPPP/GDPR. Opciones: Aceptar todas, Solo esenciales, Rechazar. Guarda preferencia en `localStorage` key `bondiact_cookie_consent`. Aparece 1.5s después de carga, animación suave.
- ✅ **Favicon bondiact**: `favicon.svg` agregado con logo "B" estilizado. Referencia actualizada en `index.html` → `href="/favicon.svg"`
- ✅ **Documento changelog**: `bondiact-changelog-v0.6.docx` — historial completo de desarrollo, arquitectura, tareas y seguridad
- ✅ **LIGIE Access Control**: Antonio (`antonio@nama.com.mx`) agregado a whitelist en `ligie/index.html` (const ALLOWED_EMAILS)
  - Sistema: Firebase Authentication + Google Sign-in (cuenta de Gmail)
  - Nota: Antonio verá aviso de "App no verificada" la primera vez → debe hacer clic en "Configuración avanzada" → "Ir a bondiact.io (no seguro)"
- ✅ **LEEME.md**: Conflicto de merge resuelto, datos corregidos (producción = GitHub Pages)

### 2026-03-17 (sesión 4) — Aviso de Privacidad + GA4 · por Comet (Perplexity)
- ✅ **`privacidad.html`** — Aviso de Privacidad completo (LFPDPPP, 9 secciones)
  - Responsable: Shekhina Management S.A. de C.V. · Contacto: `contacto@bondiact.io`
  - Vigencia: 1 de enero de 2026 · URL: https://bondiact.io/privacidad.html
- ✅ **Cookie banner**: link "Aviso de Privacidad" actualizado de `#contacto` → `privacidad.html`
- ✅ **Footer estático**: agregado `<footer>` con link a `privacidad.html` antes de `</body>`
- ✅ **Google Analytics 4**: ID real `G-1VYF2B45CJ` activado con `anonymize_ip: true` y `cookie_flags: SameSite=None;Secure`
  - Para verificar: analytics.google.com → propiedad G-1VYF2B45CJ → Informes → Tiempo real
  - GA4 solo dispara si el visitante acepta cookies en el banner
- ✅ **Email**: `rodrigo@bondiact.io` → `contacto@bondiact.io` en 4 secciones de privacidad.html

### 2026-03-17 (sesión 3) — Rescate del sitio caído · por Comet (Perplexity)
- 🔴 **Problema:** bondiact.io cayó con 404 — el repo se había vuelto privado, desactivando GitHub Pages
- ⚠️ **Causa raíz:** Claude recomendó hacer el repo privado por seguridad (diagnóstico incorrecto en ese contexto)
- ✅ **Solución:** Repo regresado a **público** + GitHub Pages reactivado en rama `main`
- ✅ Sitio restaurado en menos de 5 minutos sin tocar código

### 2026-03-17 (sesión 1+2) — Correcciones UX, Seguridad y Diseño · por Claude (Cowork)
- ✅ **Navbar simplificado**: 9 enlaces → 5 (Inicio, Servicios, Control Tower, Cobertura, Contacto)
- ✅ **Footer limpio**: Eliminados "Blog" y "Carreras" (no existen aún)
- ✅ **Social links**: Eliminados Facebook, X/Twitter, Instagram — solo LinkedIn (B2B)
- ✅ **Links legales**: Redirigidos a #contacto (antes apuntaban a # roto)
- ✅ **Kanban colores corregidos**: Rojo (Por Hacer) → Amarillo (En Progreso/Revisión) → Verde (Completado)
- ✅ **Control Tower imágenes**: Agregada carpeta `images/` con concept + ecosystem PNG
- ✅ **ScrumDashboard oculto**: Botón Dashboard removido (sin funcionalidad aún)
- ✅ **Logo transparente**: Creadas 2 versiones en Desktop (oscuro + blanco) para PDF/firma email
- ⚠️ **Código fuente** editado también en: `~/Desktop/BondiaCT respaldo/Kimi_Agent_Bondia Control Tower website/app/src/`

### 2026-03-12 — SEO completo bondiact.io · por Claude (Cowork)
- ✅ Agregados a `index.html`: Canonical URL, Open Graph completo, Twitter Card, JSON-LD Schema.org Organization
- ✅ Creado `og-image.png` (1200×630px) desde logos PDF de bondíaCT

### 2026-01-XX — LIGIE V2.13 · Buscador completo · por Kimi Agent
- ✅ Extracción completa de PDF LIGIE V2.13 (19 dic 2024, 1315 págs)
- ✅ 11,493 registros embedidos en `ligie/index.html`
- ✅ Versión: LIGIE V2.13 · v2.0 · © 2026
- ✅ Corregidos: 2308.00.02 faltante, 32 IGI vacíos (capítulos 9/95), 2 descripciones vacías

---

## Tareas pendientes

- [x] ~~Resolver 404 bondiact.io~~ → ✅ Comet restauró GitHub Pages (repo público)
- [x] ~~Hacer commit + push cambios 2026-03-17~~ → ✅ Commits hechos directo en GitHub
- [x] ~~Conectar Google Analytics 4~~ → ✅ ID: `G-1VYF2B45CJ` activo con anonymize_ip
- [x] ~~Crear Aviso de Privacidad~~ → ✅ `privacidad.html` publicado (LFPDPPP 9 secciones)
- [x] ~~Agregar favicon~~ → ✅ `favicon.svg` en producción (logo "B")
- [x] ~~Agregar CookieBanner~~ → ✅ Vanilla JS en `index.html` (LFPDPPP/GDPR)
- [x] ~~Documento changelog~~ → ✅ `bondiact-changelog-v0.6.docx` completado
- [x] ~~Agregar cliente a LIGIE~~ → ✅ Antonio (NAMA) en whitelist Firebase
- [ ] **Hacer commit + push de cambios 2026-03-18** (favicon + LIGIE whitelist + LEEME update)
- [ ] Agregar reCAPTCHA al formulario de contacto (requiere rebuild desde código fuente)
- [x] ~~Arreglar botón "Ver Guía" en LIGIE~~ → ✅ Fix: switchView('dashboard') antes de scrollIntoView
- [ ] Cambiar "Datos actualizados 2024" → 2025/2026 en trust badge del hero
- [x] ~~Security hardening LIGIE~~ → ✅ CSP, anti-clickjacking, MIME sniffing, XSS sanitización (2026-03-19)
- [ ] **FUTURO — Auth real**: Mover ALLOWED_EMAILS a Firebase Security Rules + backend para eliminar bypass client-side

---

## 🔐 ADMINISTRACIÓN DE ACCESOS - LIGIE (VÍA CÓDIGO)

### Ubicación del Portero:
- Archivo: `ligie/index.html`
- Variable: `const ALLOWED_EMAILS`

### Procedimiento de Alta:
1. Abrir `ligie/index.html` en el editor.
2. Agregar el correo entre comillas: `"antonio@nama.com.mx",`
3. Guardar, hacer Commit y Push en GitHub Desktop.
4. GitHub Pages desplegará el cambio en ~1-2 minutos.

### Limitaciones de Producción:
- Capacidad: Hasta 100 usuarios externos (vía Google Auth).
- Estatus: "In Production" (No requiere registro en Google Cloud Console).

---

## Cómo hacer deploy

1. Editar archivos en `~/Desktop/BondiaCT respaldo/` (iCloud Desktop)
2. Abrir **GitHub Desktop** → seleccionar repo `bondiact`
3. Escribir nombre del commit → **Commit to main**
4. **Push origin**
5. GitHub Pages publica automáticamente (~1-2 min)

---

## Cómo montar esta carpeta en Cowork (sesión nueva)
Decirle a Claude:
> *"Monta ~/Desktop/BondiaCT respaldo"*

---

*Última actualización: 2026-03-19 — Claude (Cowork) · security hardening: CSP, XSS, anti-clickjacking, error messages*
