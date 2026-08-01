# Memory — bondíaCT / Control Tower

> Última actualización: 2026-08-01 (landing /oversize montada + skill de auditoría creado)

---

## Hilo [2026-08-01]

### Contexto
Rod trajo un export de Claude Design para una landing nueva, `/oversize` (carga sobredimensionada,
sobrepeso y breakbulk), que calificó de "nivel no mames". Pidió: adaptarla cross-browser/cross-device
(Mac, PC, Android, iOS), verificar que no se haya expuesto ningún token/endpoint/dato personal en el
código fuente, montarla, actualizar CLAUDE.md/reglas de oro, y crear un skill de auditoría de
ciberseguridad que corra cada vez que se monte una landing.

### Ejecutado
- **Auditoría de seguridad** sobre el `index.html` entregado (490 KB, 6 imágenes en base64 incrustadas):
  cero guion largo/medio, cero PII (Shekhina/WhatsApp/Rodrigo/correo personal/teléfono), cero riesgo
  CSP (blob/eval/CDNs/localStorage), único externo Google Fonts, formulario correctamente cableado a
  `/api/submit-lead` con honeypot y `source="bondiact.io/oversize"`. **7 falsos positivos** de
  patrón de API key/JWT (`AIza...`, `eyJ...`) — verificados uno por uno, los 7 caen dentro de las
  imágenes base64 (ruido del alfabeto), no son credenciales reales.
- **Hallazgo real corregido:** 29 usos de `&middot;` (punto medio como entidad HTML, invisible a un
  grep de bytes Unicode) — violaba la regla dura "sin punto medio". Corregido por contexto (coma o
  paréntesis). Reporte completo en `security-audits/landings/oversize-2026-08-01.md`.
- **Cross-browser/device:** agregado `-webkit-backdrop-filter`, inputs a 16px (evita zoom iOS),
  `-webkit-appearance:none`, `-webkit-tap-highlight-color:transparent`, `-webkit-text-size-adjust`,
  `env(safe-area-inset-*)` en header/footer sticky, `prefers-reduced-motion`, meta `theme-color`. Diseño
  visual de Claude Design intacto, solo hardening técnico.
- **Montada** en `oversize/index.html` (sin tocar git — Rod pushea por GitHub Desktop).
- **Skill nuevo:** `audita-landing-bondiact` — corre siempre antes de montar/pushear cualquier landing,
  incluye el manejo de falsos positivos de base64 y el reporte estándar en `security-audits/landings/`.
- **`.gitignore`:** se agregó `security-audits/` — cierra el hallazgo carry-over que llevaba 3+ semanas
  abierto en las auditorías semanales (esa carpeta se veía en el repo público). Los 5 archivos ya
  commiteados antes siguen trackeados hasta que Rod los quite a mano en GitHub Desktop.

### Pendiente / decisión de Rod
- [ ] `/oversize` no trae toggle ES/EN ni toggle claro/oscuro, y usa paleta y tipografía distintas al
      sistema documentado (Newsreader + Hanken Grotesk + IBM Plex Mono, tema oscuro fijo). Es el diseño
      que Rod aprobó — queda como excepción deliberada o Rod pide agregar los toggles.
- [ ] Untrackear a mano en GitHub Desktop los 5 archivos de `security-audits/` ya commiteados
      (2026-04-06 a 2026-07-06) — el `.gitignore` nuevo solo evita que se sumen más.

---

## Hilo [2026-07-17 18:09]

### Contexto
Rod está reviviendo Shekhina Management (régimen general de ley) para comercio exterior/aduanas.
Necesitaba (1) claridad fiscal sobre IVA en fletes de agente de carga y (2) un cotizador de
exportación (limón persa MX→USA) funcional para uso de su contador.

### Solicitudes
- Analizar el PDF "IVA para Agentes de Carga versión 2014" (AMACARGA) y hacer un briefing forense
  de qué sigue vigente en 2026, con logo Bondia CT, en PDF (solo texto, sin diseño).
- Tomar el archivo `Cotizador_Exportacion_Limon_Contador.numbers`, meterle las fórmulas faltantes
  y documentar qué impuestos aplican en cada línea y por qué.
- Aclarar dudas puntuales: si el Bill of Lading sostiene la tasa 0%, si está obligado a emitir
  Carta Porte como agente de carga sin flota propia, por qué desapareció el dropdown de Incoterm,
  y dos bugs de fórmula que él mismo detectó (ISR mal leído; suma de columna D no cuadraba con la
  utilidad oficial por $288 del arancel).

### Ejecutado
- `briefing_iva_agentes_carga_2026.pdf` + `.md`: vigente vs. derogado (Art. 16/29-V/15-VI LIVA,
  retención 4%, Carta Porte 3.1, CFDI 4.0, materialidad 69-B), matriz de 10 escenarios de tráfico,
  checklist contable para Shekhina. Presentado, no subido al repo público (contiene lineamientos
  de negocio).
- `Cotizador_Exportacion_Limon_Contador_v2.xlsx` (convertido de .numbers vía LibreOffice, editado
  con openpyxl): fórmulas D19/E19 y D20/E20 corregidas (esta última traía un bug real — cotizaba
  el despacho EUA sin margen), B21/D21 arreglado (arancel USA es pass-through 1:1, no ganancia),
  hoja nueva "Notas_Fiscales" con tratamiento IVA/ISR/arancel por línea + matriz Incoterm×costo
  (EXW/FCA/CPT-CIP/DAP/DDP), dropdowns de Incoterm y Origen T-MEC restaurados (se habían perdido
  en la conversión .numbers→.xlsx, no en la edición de fórmulas), fila de verificación (E23/F23)
  que suma D15:D21 y confirma que cuadra con la utilidad oficial (E27).
- Respondidas en el hilo: BL/HBL sí sostiene tasa 0% si se factura como un solo servicio
  internacional; NO está obligado a emitir Carta Porte (regla 2.7.1.9 RMF — solo el porteador
  real la emite, agente de carga sin flota propia no); versión vigente es 3.1, no existe 3.5.

### Pendiente
- [ ] Rod preguntó por una "contraseña en el HTML" — no se ha creado ningún HTML en este hilo;
      quedó pendiente que aclare a qué archivo/sesión se refiere.
- [ ] Rod puede pedir automatizar la columna "A cargo de" (F15:F21) del cotizador según el
      Incoterm elegido — se dejó manual a propósito (los tratos reales se desvían del Incoterm
      de libro) pero quedó ofrecido como siguiente paso si lo pide.

### Inputs requeridos
- Aclaración de Rod sobre el archivo HTML con contraseña que mencionó.

---

## Yo
**Rod** (Rodrigo Pardo) — Scrum Master / PM · Lightman Freight Forwarding & Customs Brokerage, Guadalajara, Jalisco, México.  
Email: rodrigo@bondiact.io / rodrigopardo6537@gmail.com  
WhatsApp Business: +52 33 2200 0539

---

## El Proyecto Principal: bondíaCT / Control Tower

**Producto**: CT (Control Tower) — SaaS de auditoría de pedimentos de importación.  
**Stack**: React + TypeScript + Supabase + Vercel (staging: ct.bondiact.io)  
**Modelo de negocio (Fase I)**: Venta directa Rod-operado. $2,500/pedimento individual, $20k paquete 10. Cliente NO usa la app — Rod audita y entrega PDF por WhatsApp/email en 24-48h.  
**Objetivo Fase I**: 10+ clientes pagando → validar Motor Comercial → escalar a self-serve SaaS (Fase II).

---

## Sitio Web: bondiact.io

- **Producción**: https://bondiact.io — desplegado en **Vercel** (no GitHub Pages como decía LEEME anterior)
- **Repo**: `rp26managment/bondiact` (GitHub, rama `main`, debe ser PÚBLICO)
- **Carpeta local**: `~/Desktop/BondiaCT respaldo` (iCloud Desktop, carpeta roja)
- **Deploy**: GitHub Desktop → Commit to main → Push origin → Vercel auto-deploy (~1 min)
- **REGLA CRÍTICA**: NUNCA hacer el repo privado — cae bondiact.io
- **`vercel.json`**: activo — rewrites `/controltower` → CT app, headers CSP, HSTS
- **`controltower/index.html`**: landing page estática de CT (Vanilla JS, i18n ES/EN, DOMPurify)
- **App CT React**: repo separado `Control-Tower`, dominio `ct.bondiact.io`

---

## Términos Clave

| Término | Significado |
|---------|-------------|
| **CT** | Control Tower — la app SaaS de auditoría |
| **Pedimento** | Documento aduanal de importación en México |
| **AA** | Agente Aduanal |
| **DME** | Data Stage — archivo XLSX con datos de la operación |
| **OCR** | Parser de PDF de pedimentos |
| **T-MEC** | Tratado México-EE.UU.-Canadá (=USMCA/CUSMA) |
| **DTA** | Derecho de Trámite Aduanero |
| **IGI** | Impuesto General de Importación (arancel) |
| **IVA** | Impuesto al Valor Agregado |
| **LIGIE** | Lista de Insumos, Grupos, Importaciones y Exportaciones (arancel MX) |
| **F03** | Hallazgo tipo 3 — discrepancia en contribuciones calculadas vs declaradas |
| **I01/I04** | Tipos de incidencias en la auditoría |
| **R1 / 701_R1** | Rectificación de pedimento |
| **Fase I** | Motor Comercial — Rod opera CT manualmente, venta directa |
| **Fase II** | SaaS self-serve, multi-tenant, billing Stripe/Conekta |
| **Motor Comercial** | Épica MC-FASE-I — la maquinaria de venta Fase I |
| **Design Partners** | Clientes beta pagando con acceso especial (Opción 2) |

---

## Personas

| Quién | Rol |
|-------|-----|
| **Verónica Enríquez** | Contacto frecuente (Monday) |
| **Antonio** | Cliente — antonio@nama.com.mx — NAMA — acceso LIGIE whitelist |

---

## Épicas Activas (Monday — CT Sprints Board ID: 18407662134)

| Épica | Nombre | Estado | Puntos |
|-------|--------|--------|--------|
| **MC-FASE-I** | La Caja Registradora 💰 | Sin status | 55 pts |
| **SaaS-01** | La Columna Vertebral (multi-tenant) | Detenido | 34 pts |
| **SaaS-02** | El Pulso (NPS/feedback) | Detenido | 13 pts |
| **SaaS-03** | La Renta (billing Stripe) | Detenido | 21 pts |
| **SaaS-04** | El Clasificador R1 | Detenido | 13 pts |
| **LIGIE-APP** | La Lupa Móvil 🔍 (iOS/Android) | Sin status | 34 pts |
| **S19-ÉPICA** | Dashboard datos reales (Supabase) | Detenido | 34 pts |
| **S18-I18N** | i18n ES/EN/CA/EU/VA | En curso | 13 pts |

---

## Historial de Sprints (más reciente primero)

| Sprint | Tema | Estado |
|--------|------|--------|
| **S43** | El Blindaje Total: seguridad web (CSP/COOP), PII fuera del repo público, Supabase Security Advisor, splash LIGIE en vivo | ✅ Listo (2026-06-11) — carry-over: fix OCR proveedor (probar + Push en Control-Tower) |
| **S28** | Mobile responsive + i18n completo /controltower (DOMPurify integrity fix) | ✅ Listo (2026-04-20) |
| **S27** | Motor Comercial: pricing page, checkout, contrato, email intake, calibración OCR, template reporte | Sin status (creado 2026-04-17) |
| **S26** | DataStage XLSX 13 tablas, crossCheck DME, Dashboard importador, PDF expediente, Kanban charts | ✅ Listo |
| **S25** | PWA manifest, service worker, iconos, vercel.json rewrites | ✅ Listo |
| **S24** | Incoterms real OCR, HF IVA/proveedor/destinoOrigen, cierre pendiente | 🟡 En curso (cierre) |
| **S23** | T-MEC auto-detección, dropdown trato arancelario, fix DTA, F03 inteligente | ✅ Listo |
| **S21-22** | Motor DTA/IGI/IVA, PDF bilingüe 7 idiomas, multi-file upload, CSP fix | ✅ Listo |

---

## Reglas de Trabajo

- Sprints cortos (1-3 días), enfocados por tema
- Archivos críticos: NUNCA tocar sin Claude → `ligie/index.html`, `CNAME`, `index.html`
- Deploy: siempre via GitHub Desktop desde `~/Desktop/BondiaCT respaldo`
- Convención items Monday: `SXX-NN: descripción técnica`
- **Landings nuevas (regla desde 2026-08-01):** SIEMPRE correr el skill `audita-landing-bondiact`
  antes de montar o entregar cualquier `index.html` de landing (venga de Claude Design o escrito
  directo). No es opcional. Reporte queda en `security-audits/landings/<slug>-<fecha>.md`
  (carpeta en `.gitignore`, nunca al repo público).

---

## Sprint 36+ — 12-May-2026 · LIGIE V2.14 sincronizado

**ligie/index.html actualizado al 100% con LIGIE V2.14:**
- 11,493 → **11,494 NICOs** (fracción nueva: 7219.34.01 Acero inoxidable laminado, IGI 25%)
- **1,605 NICOs con IGI actualizado** por Decreto Sheinbaum (DOF 5777376, vigor 1-Ene-2026)
- **7 fracciones de Sprint 35** confirmadas (DOF 5785818, vigor 24-Abr-2026)
- Cero referencias remanentes a V2.13 — todo el UI (splash, nav, footer, KPIs, modal "Acerca de") en V2.14
- Tags `r` mantienen taxonomía canónica V2.13 (CUP, IM_SEN, PS4, EMB, NOM, etc.) — sin tags inventados

**Pre-commit hook instalado** (`.git/hooks/pre-commit`):
- Apunta al Vacunador del repo Control-Tower (`tools/ligie/validar_dataset.py`)
- Cuando hagas commit a `ligie/index.html` desde GitHub Desktop, dispara automático
- Si CT y bondiact se desincronizan, bloquea el commit
- Detalle en `Control Tower interior/LIGIE_CHANGELOG.md` línea 619+

**Sprint anterior pendiente desde Sprint 37 cerrado.**
