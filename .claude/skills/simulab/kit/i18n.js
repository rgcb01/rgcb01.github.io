// Idiomas del simulador: ?lang=es|en|pt|ja|zh|ko|ru (es por defecto).
// Los textos del canvas se escriben en español en el código; aquí se traducen en un solo lugar:
// fillText/strokeText/measureText pasan por tr(), que busca la plantilla en I18N (kit/i18n.dict.js).
// Plantilla = el texto con cada número cambiado por "#" ("BAY 3 · ECO" -> "BAY # · ECO"); los números se
// devuelven en orden a los "#" de la traducción (o por posición con #1, #2 si el orden cambia).
const LANG = (() => { const l = (new URLSearchParams(location.search).get('lang') || 'es').toLowerCase(); return ['es', 'en', 'pt', 'ja', 'zh', 'ko', 'ru'].includes(l) ? l : 'es'; })();
const LANG_TAG = { es: 'es-MX', en: 'en', pt: 'pt-BR', ja: 'ja', zh: 'zh-CN', ko: 'ko', ru: 'ru' }[LANG];
const I18N = {};
const defineText = (map) => { Object.assign(I18N, map); };
const NUM_RE = /-?\d+(?:[.,]\d+)?/g;
const CJK_RE = /[぀-ヿ㐀-鿿가-힯＀-￯]/;
const _trMemo = new Map();
function tr(s) {
  if (LANG === 'es' || typeof s !== 'string' || !s) return s;
  const hit = _trMemo.get(s);
  if (hit !== undefined) return hit;
  const nums = [];
  const key = s.replace(NUM_RE, (m) => { nums.push(m); return '#'; });
  // un texto con espacios al borde se traduce sin ellos y se devuelven
  const lead = key.match(/^\s*/)[0], trail = key.match(/\s*$/)[0], core = key.slice(lead.length, key.length - trail.length);
  const ent = I18N[key] || I18N[core];
  let out = s;
  if (ent) {
    const t = ent[LANG];
    if (typeof t === 'string') {
      let i = 0;
      const body = t.replace(/#(\d)?/g, (_, d) => (d ? nums[Number(d) - 1] : nums[i++]) ?? '');
      out = (I18N[key] ? '' : lead) + body + (I18N[key] ? '' : trail);
    }
  }
  _trMemo.set(s, out);
  return out;
}
// Fuente por idioma para el canvas (JetBrains Mono solo trae latino; el resto cae a la fuente del sistema)
if (LANG !== 'es' && typeof CanvasRenderingContext2D !== 'undefined') {
  const P = CanvasRenderingContext2D.prototype;
  const withLS = (ctx, t, fn) => {
    if (CJK_RE.test(t) && ctx.letterSpacing && ctx.letterSpacing !== '0px') { const ls = ctx.letterSpacing; ctx.letterSpacing = '0px'; try { return fn(); } finally { ctx.letterSpacing = ls; } }
    return fn();
  };
  for (const n of ['fillText', 'strokeText']) {
    const o = P[n];
    P[n] = function (t, ...a) { const s = tr(String(t)); if ('lang' in this && this.lang !== LANG_TAG) this.lang = LANG_TAG; return withLS(this, s, () => o.call(this, s, ...a)); };
  }
  const om = P.measureText;
  P.measureText = function (t) { const s = tr(String(t)); return withLS(this, s, () => om.call(this, s)); };
}
