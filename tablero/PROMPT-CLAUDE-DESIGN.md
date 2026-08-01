# Prompt para Claude Design — Pantalla de Tableros (BondiaCT)

Copia TODO lo que está debajo de la línea y pégalo en Claude Design.

---

Diseña la interfaz de una aplicación de tableros de trabajo tipo hoja de cálculo colaborativa. Es una herramienta interna de una empresa de logística y comercio exterior. Entrega **un solo archivo HTML plano**, autocontenido.

## Qué es la aplicación

Un tablero es una tabla donde cada renglón es una tarea o un registro (un embarque, un prospecto, un documento pendiente) y cada columna es un dato. Las columnas son dinámicas: el usuario las crea. Hay 3 pantallas:

1. **Puerta de acceso.** Tarjeta centrada con correo, contraseña, botón Entrar. Segundo paso: código de 6 dígitos de app autenticadora, con espacio para un código QR de 168x168 px cuando el usuario se da de alta por primera vez. Fondo oscurecido. En esta pantalla NO se muestra el selector de temas.
2. **Lista de tableros.** Tarjetas en rejilla, cada una con nombre del tablero, descripción, fecha del último cambio y una etiqueta pequeña con el modo de dependencia (Flexible / Estricta / Ninguna). Arriba, una fila para crear tablero nuevo: campo de nombre, selector de modo de dependencia, botón Crear.
3. **El tablero abierto.** Es la pantalla principal y la más importante:
   - Encabezado con el nombre del tablero, y una **barra de avance segmentada** horizontal (tipo batería) que muestra la proporción de renglones por estado, con leyenda de conteos debajo y el texto destacado "N de N listos".
   - La tabla. Filas de grupo con un cuadrito de color y el nombre del grupo más el conteo entre paréntesis. Debajo, los renglones del grupo.
   - Cada renglón: número consecutivo, nombre editable, y una celda por columna.
   - Al final del renglón, un botón discreto para borrarlo.
   - Debajo de la tabla: fila para agregar renglón (selector de grupo + nombre + botón) y otra tarjeta para agregar columna (nombre + tipo + casilla "Visible solo para mí" + botón).
4. **Control de cambios.** Tabla simple: acción, quién, cuándo, detalle.

## Tipos de celda que hay que diseñar

- **Estado / Prioridad / Etiqueta**: se ven como una pastilla de color rellena, con el texto centrado en negritas, tipografía monoespaciada, ancho mínimo homogéneo. Es un desplegable disfrazado de pastilla.
- **Persona**: círculo de avatar con dos iniciales, junto a un campo de texto con el nombre.
- **Fecha, Número, Semana del año (1 a 53), Enlace, Texto, Texto largo, Casilla de verificación**: controles discretos que se ven como texto plano hasta que el usuario pasa el mouse o hace clic (borde apenas visible al pasar, borde de color y fondo al enfocar). La tabla NO debe verse como un formulario lleno de cajas.
- **Columnas de control** (Creado por / Actualizado por): muestran nombre y fecha en dos líneas, tipografía monoespaciada pequeña, color secundario. El encabezado de estas columnas va en color de acento con un punto para distinguirlas.

## Reglas de color NO NEGOCIABLES

### 5 temas, con estas variables CSS exactas (no las cambies, no agregues temas)

```css
:root, [data-theme="claro"]{
  --primary:#00897B; --bg:#F5F7F7; --surface:#FFFFFF; --surface2:#EDF1F1;
  --text:#1A2327; --text2:#5B6B70; --border:#DCE3E3; --glow:rgba(0,137,123,.28);
  --teal-soft:rgba(0,137,123,.10); --teal-line:rgba(0,137,123,.32);
  --shadow:0 24px 60px rgba(38,50,56,.14);
  --dlg-shadow:2px 2px 16px rgba(0,137,123,.20);
  --diamond-line:rgba(0,137,123,.07);
}
[data-theme="oscuro"]{
  --primary:#2BB3A3; --bg:#121212; --surface:#1C1E1E; --surface2:#242727;
  --text:#ECF1F0; --text2:#98A6A4; --border:#2E3434; --glow:rgba(43,179,163,.40);
  --teal-soft:rgba(43,179,163,.16); --teal-line:rgba(43,179,163,.45);
  --shadow:0 24px 60px rgba(0,0,0,.5);
  --dlg-shadow:2px 2px 18px rgba(43,179,163,.30);
  --diamond-line:rgba(43,179,163,.09);
}
[data-theme="azul"]{
  --primary:#4FA9E0; --bg:#0C1926; --surface:#122536; --surface2:#183048;
  --text:#DCE8F2; --text2:#8AA3B8; --border:#20405A; --glow:rgba(79,169,224,.40);
  --teal-soft:rgba(79,169,224,.16); --teal-line:rgba(79,169,224,.45);
  --shadow:0 24px 60px rgba(0,0,0,.5);
  --dlg-shadow:2px 2px 18px rgba(79,169,224,.30);
  --diamond-line:rgba(79,169,224,.09);
}
[data-theme="verde"]{
  --primary:#3FBFA1; --bg:#0E1917; --surface:#142420; --surface2:#1B302A;
  --text:#DFF0EA; --text2:#8FAFA4; --border:#25473D; --glow:rgba(63,191,161,.40);
  --teal-soft:rgba(63,191,161,.16); --teal-line:rgba(63,191,161,.45);
  --shadow:0 24px 60px rgba(0,0,0,.5);
  --dlg-shadow:2px 2px 18px rgba(63,191,161,.30);
  --diamond-line:rgba(63,191,161,.09);
}
[data-theme="arena"]{
  --primary:#B4762F; --bg:#F5EFE3; --surface:#FFFAF0; --surface2:#F0E7D4;
  --text:#3B2F1F; --text2:#7C6B52; --border:#E1D4B8; --glow:rgba(180,118,47,.28);
  --teal-soft:rgba(180,118,47,.12); --teal-line:rgba(180,118,47,.38);
  --shadow:0 24px 60px rgba(78,66,52,.18);
  --dlg-shadow:2px 2px 16px rgba(180,118,47,.22);
  --diamond-line:rgba(180,118,47,.08);
}
```

### Paleta de estatus: IDÉNTICA en los 5 temas

Estos colores NO cambian al cambiar de tema, a propósito: el significado de un color no debe depender del tema. Cada color trae su propia tinta para que el texto siempre contraste.

```css
:root{
  --st-gris:#7A8A8F;      --st-gris-ink:#FFFFFF;
  --st-amarillo:#E8B10A;  --st-amarillo-ink:#2A2200;
  --st-verde:#17A673;     --st-verde-ink:#FFFFFF;
  --st-naranja:#E4771F;   --st-naranja-ink:#FFFFFF;
  --st-rojo:#D3453B;      --st-rojo-ink:#FFFFFF;
  --st-azul:#3E8FC4;      --st-azul-ink:#FFFFFF;
  --st-morado:#7C5BC4;    --st-morado-ink:#FFFFFF;
}
```

Los 3 estados base son: gris = Sin empezar, amarillo = En curso, verde = Listo. No inventes otros colores para estados.

### Selector de temas

Grupo de 5 botones tipo pastilla en la esquina superior derecha, fijo. Cada botón: un punto de color más la etiqueta. El activo se rellena con `--primary` y letra blanca. En pantallas menores a 760 px se oculta la etiqueta y quedan solo los puntos. **Solo aparece cuando hay sesión abierta** (usa `body.sesion .themes{display:flex}` y `.themes{display:none}`). No pongas un selector de idioma: no hay bilingüe en esta pantalla.

### Tipografía

- Títulos: Hanken Grotesk
- Cuerpo: Inter
- Etiquetas, códigos, números y pastillas: JetBrains Mono
- Cárgalas solo desde Google Fonts con `<link>`.

### Fondo

Textura de rombos por código, sin imágenes:

```css
background-image:
  repeating-linear-gradient(45deg, var(--diamond-line) 0 1px, transparent 1px 32px),
  repeating-linear-gradient(-45deg, var(--diamond-line) 0 1px, transparent 1px 32px);
background-attachment:fixed;
```

Todas las tarjetas y cuadros de diálogo llevan `box-shadow: var(--dlg-shadow)` (sombra difusa de 2 pt en el color del tema).

## Restricciones técnicas OBLIGATORIAS

El sitio corre bajo una política de seguridad estricta que NO se puede debilitar. Si tu entrega no cumple esto, no se puede montar:

1. **Un archivo HTML plano**, sin empaquetador, sin pasos de compilación. Nada de React, Vue, JSX, Babel, ni `type="module"` con importaciones externas.
2. **Cero `blob:`, cero `eval`, cero `new Function`, cero `import()` dinámico.**
3. **Cero scripts externos** salvo Google Fonts vía `<link>`. Nada de CDN de librerías.
4. Todo el CSS y el JavaScript **en línea**, dentro de `<style>` y `<script>` en el mismo archivo.
5. **Sin imágenes externas.** Iconos en SVG en línea, o texto.
6. Las peticiones al servidor solo a rutas propias que empiezan con `/api/`. No pongas ninguna otra dirección de internet.

## Reglas de contenido OBLIGATORIAS

1. **PROHIBIDO el guion largo (—) y el guion medio (–) en cualquier texto visible.** Usa coma, punto y seguido, o paréntesis. Tampoco uses el punto medio (·) como separador.
2. **PROHIBIDO nombrar herramientas, proveedores o servicios** en texto visible, en comentarios del HTML, o en cualquier parte del archivo. Nada de nombres de bases de datos, proveedores de hospedaje, plataformas de automatización, ni servicios en la nube. Si necesitas referirte a eso, di "el servicio" o "el servidor".
3. **Sin datos personales.** No inventes nombres de personas reales, correos, teléfonos, direcciones ni razones sociales. Para datos de ejemplo usa nombres genéricos de tarea.
4. La marca se escribe **BondiaCT** (B mayúscula, sin acento en la i, sin cursiva). Nunca "bondiaCT" ni "bondíaCT".
5. Todo el texto en español de México, sin acentos en las etiquetas de código monoespaciado.

## Contrato que NO puedes cambiar

Diseña **solo la apariencia y el acomodo**. Los siguientes identificadores y nombres son la conexión con el servidor que ya existe. Consérvalos tal cual, en los mismos elementos:

**Identificadores de la puerta:** `gate-root`, `gate-card` (clase), `gate-email`, `gate-pass`, `gate-btn`, `gate-totp-step`, `gate-enroll`, `gate-totp-qr`, `gate-totp`, `gate-totp-btn`, `gate-msg`

**Cascarón:** `app-root`, `themes`, `hdr-title`, `btn-volver`, `btn-bitacora`, `btn-salir`, `vista-lista`, `vista-tablero`, `vista-bitacora`

**Lista de tableros:** `nb-nombre`, `nb-dep`, `nb-crear`, `nb-msg`, `boards`, y la clase `.board-card` con atributo `data-id`

**Tablero:** `brd-nombre`, `brd-bateria`, `brd-legend`, `brd-head`, `brd-body`, `it-grupo`, `it-nombre`, `it-crear`, `it-msg`, `col-nombre`, `col-tipo`, `col-solo-mio`, `col-crear`, `col-msg`

**Clases de celda:** `.cell-in`, `.cell-val`, `.cell-chip`, `.cell-check`, `.it-nombre`, `.it-borrar`, `.persona-cell`, `.avatar`, `.battery`, `.bat-legend`, `.grp-row`, `.grp-dot`, `.num-auto`, `.sello`

**Control de cambios:** `log-body`

Los renglones de la tabla llevan `data-item` con el identificador, y las celdas llevan `data-col`. No cambies estos nombres de atributo.

Puedes agregar clases nuevas para estilo, envolver cosas en contenedores, y reacomodar todo lo que quieras, siempre que estos identificadores sigan existiendo y sigan siendo del mismo tipo de elemento (un `select` sigue siendo `select`, un `input` sigue siendo `input`).

## Qué quiero que priorices

Que la tabla se sienta ligera y rápida de leer, no un formulario. Que la barra de avance se entienda de un vistazo. Que las pastillas de color sean el ancla visual. Que en tema oscuro no se pierda la lectura de las celdas. Que en celular la tabla se desplace horizontal sin romper el resto de la página.
