/*
 * Las fuentes de la salida las sirve server.js desde /assets/fonts (fuera del
 * build de React), así que el @font-face se inyecta como texto plano en vez
 * de un url() en un archivo .css: así css-loader no intenta empaquetarlas.
 */
const FONT_FACE_CSS = `
@font-face{font-family:'Anton';src:url(/assets/fonts/anton-latin-400-normal.woff2) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Michroma';src:url(/assets/fonts/michroma-latin-400-normal.woff2) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Barlow Condensed';src:url(/assets/fonts/barlow-condensed-latin-500-normal.woff2) format('woff2');font-weight:500;font-display:block}
@font-face{font-family:'Barlow Condensed';src:url(/assets/fonts/barlow-condensed-latin-600-normal.woff2) format('woff2');font-weight:600;font-display:block}
@font-face{font-family:'Barlow Condensed';src:url(/assets/fonts/barlow-condensed-latin-700-normal.woff2) format('woff2');font-weight:700;font-display:block}
@font-face{font-family:'Barlow';src:url(/assets/fonts/barlow-latin-400-normal.woff2) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Barlow';src:url(/assets/fonts/barlow-latin-600-normal.woff2) format('woff2');font-weight:600;font-display:block}
`;

let injected = false;

export function ensureSalidaFonts() {
  if (injected) return;
  injected = true;
  const style = document.createElement('style');
  style.setAttribute('data-salida-fonts', '');
  style.textContent = FONT_FACE_CSS;
  document.head.appendChild(style);
}
