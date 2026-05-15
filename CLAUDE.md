# Memory — bondíaCT / Control Tower

> Última actualización: 2026-04-20 (Sprint 28 ✅ cerrado)

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
