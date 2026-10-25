/* ===== 04-variations: deterministic "Make It Yours" design transformation engine =====
   Maps presets / free-text to *validated design tokens only*. Never touches content.
   AI-ready: an LLM could return the same `Recipe` shape as structured JSON; validateDesign() would gate it. */
const hsl = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
function paletteFrom(h, mode, vivid = 60) {
  const h2 = (h + 150) % 360, h3 = (h + 30) % 360;
  if (mode === 'dark') return { primary: hsl(h, 30, 92), secondary: hsl(h2, 85, 68), accent: hsl(h3, vivid + 25, 62), bg: hsl(h, 45, 8), text: hsl(h, 25, 92), card: hsl(h, 40, 13), border: hsl(h, 35, 26) };
  if (mode === 'pop') return { primary: hsl(h, vivid + 20, 48), secondary: hsl(h2, 90, 60), accent: hsl(h3, 100, 62), bg: hsl(h, 80, 90), text: hsl(h, 70, 12), card: '#ffffff', border: hsl(h, 70, 12) };
  return { primary: hsl(h, 40, 16), secondary: hsl(h, 14, 42), accent: hsl(h3, vivid, 44), bg: hsl(h, 20, 97), text: hsl(h, 35, 12), card: '#ffffff', border: hsl(h, 16, 86) };
}
const R = (tpl, pal, o = {}) => ({ tpl, pal, ...o });
/* Each preset has several recipes -> several distinct previews */
const PRESETS = {
  professional: { label: 'More Professional', desc: 'Calm palette, structured layout, quiet motion', recipes: [
    R('professional', ['light', 215, 45], { fonts: ['Plus Jakarta Sans', 'Inter'], v: { hero: 'split', nav: 'top', cards: 'grid', head: 'inline' }, a: { entrance: 'fade', duration: 500, intensity: 25 }, decor: [], bg: 'flat', sp: 92 }),
    R('editorial', ['light', 200, 30], { fonts: ['Source Serif 4', 'Inter'], v: { hero: 'index', nav: 'top', cards: 'list', head: 'side' }, a: { entrance: 'fade', duration: 500, intensity: 20 }, decor: [], bg: 'flat', sp: 104 }),
    R('professional', ['light', 160, 40], { fonts: ['Manrope', 'DM Sans'], v: { hero: 'stack', nav: 'top', cards: 'grid', head: 'inline' }, a: { entrance: 'fade', duration: 450, intensity: 20 }, decor: [], bg: 'gradient', sp: 88 })] },
  creative: { label: 'More Creative', desc: 'Offset layouts, expressive type, playful accents', recipes: [
    R('creative-minimal', ['light', 330, 80], { fonts: ['Syne', 'DM Sans'], v: { hero: 'stack', nav: 'minimal', cards: 'offset', head: 'inline' }, a: { entrance: 'slide', duration: 800, intensity: 55, parallax: true }, decor: [], bg: 'gradient', sp: 130 }),
    R('neo-experimental', ['dark', 285, 80], { fonts: ['Unbounded', 'Sora'], v: { hero: 'overlap', nav: 'floating', cards: 'overlay', head: 'huge' }, a: { entrance: 'scale', duration: 800, intensity: 60 }, decor: ['blobs', 'grain'], bg: 'mesh', sp: 110 }),
    R('digital-playground', ['pop', 18, 80], { fonts: ['Fredoka', 'Outfit'], v: { hero: 'sticker', nav: 'dock', cards: 'sticker', head: 'inline' }, a: { entrance: 'scale', duration: 600, intensity: 60 }, decor: ['shapes'], bg: 'dots', sp: 100 })] },
  minimal: { label: 'More Minimal', desc: 'Fewer effects, more whitespace, restrained colour', recipes: [
    R('editorial', ['light', 220, 8], { fonts: ['Newsreader', 'Inter'], v: { hero: 'index', nav: 'top', cards: 'list', head: 'side' }, a: { entrance: 'fade', duration: 600, intensity: 15, marquee: false, typewriter: false, parallax: false }, decor: [], bg: 'flat', sp: 140 }),
    R('creative-minimal', ['light', 30, 6], { fonts: ['DM Sans', 'DM Sans'], v: { hero: 'stack', nav: 'minimal', cards: 'grid', head: 'inline' }, a: { entrance: 'fade', duration: 700, intensity: 10, marquee: false, typewriter: false, parallax: false }, decor: [], bg: 'flat', sp: 150 }),
    R('professional', ['light', 0, 0], { fonts: ['Inter', 'Inter'], v: { hero: 'split', nav: 'top', cards: 'list', head: 'inline' }, a: { entrance: 'none', marquee: false, typewriter: false, parallax: false }, decor: [], bg: 'flat', sp: 120 })] },
  experimental: { label: 'More Experimental', desc: 'Unusual navigation, overlap, texture and glow', recipes: [
    R('neo-experimental', ['dark', 170, 85], { fonts: ['Unbounded', 'Space Grotesk'], v: { hero: 'overlap', nav: 'floating', cards: 'offset', head: 'huge' }, a: { entrance: 'reveal', duration: 900, intensity: 70, parallax: true }, decor: ['blobs', 'grain', 'cursor-glow'], bg: 'mesh', sp: 120 }),
    R('retro-futuristic', ['dark', 320, 90], { fonts: ['Syne', 'Chakra Petch'], v: { hero: 'big', nav: 'side', cards: 'overlay', head: 'code' }, a: { entrance: 'slide', duration: 700, intensity: 65, marquee: true }, decor: ['grain', 'scanlines'], bg: 'grid', sp: 100 }),
    R('brutalist', ['pop', 60, 90], { fonts: ['Rubik Mono One', 'Space Mono'], v: { hero: 'overlap', nav: 'minimal', cards: 'brutal', head: 'huge' }, a: { entrance: 'scale', duration: 500, intensity: 80, marquee: true }, decor: ['stripes'], bg: 'dots', sp: 90 })] },
  colorful: { label: 'More Colorful', desc: 'Saturated palettes and tinted backgrounds', recipes: [
    R(null, ['pop', 340, 90], { fonts: null, v: {}, a: {}, decor: null, bg: 'gradient', sp: null, keepLayout: true }),
    R(null, ['pop', 160, 80], { fonts: null, v: {}, a: {}, decor: null, bg: 'dots', sp: null, keepLayout: true }),
    R(null, ['dark', 260, 95], { fonts: null, v: {}, a: {}, decor: ['blobs'], bg: 'mesh', sp: null, keepLayout: true })] },
  elegant: { label: 'More Elegant', desc: 'Serif display type, soft contrast, slow reveals', recipes: [
    R('editorial', ['light', 40, 25], { fonts: ['Playfair Display', 'Newsreader'], v: { hero: 'stack', nav: 'minimal', cards: 'offset', head: 'inline' }, a: { entrance: 'reveal', duration: 1000, intensity: 25 }, decor: [], bg: 'flat', sp: 130 }),
    R('professional', ['light', 350, 20], { fonts: ['Fraunces', 'Source Serif 4'], v: { hero: 'split', nav: 'top', cards: 'grid', head: 'inline' }, a: { entrance: 'fade', duration: 900, intensity: 20 }, decor: [], bg: 'gradient', sp: 110 }),
    R('creative-minimal', ['dark', 40, 30], { fonts: ['Instrument Serif', 'DM Sans'], v: { hero: 'index', nav: 'top', cards: 'list', head: 'side' }, a: { entrance: 'fade', duration: 900, intensity: 20 }, decor: ['grain'], bg: 'flat', sp: 120 })] },
  futuristic: { label: 'More Futuristic', desc: 'Neon accents, HUD details, grid floors', recipes: [
    R('retro-futuristic', ['dark', 190, 95], { fonts: ['Orbitron', 'Chakra Petch'], v: { hero: 'big', nav: 'side', cards: 'grid', head: 'inline' }, a: { entrance: 'fade', duration: 700, intensity: 45, typewriter: true }, decor: ['grid-floor', 'scanlines'], bg: 'flat', sp: 100 }),
    R('neo-experimental', ['dark', 250, 95], { fonts: ['Sora', 'Sora'], v: { hero: 'overlap', nav: 'floating', cards: 'overlay', head: 'huge' }, a: { entrance: 'scale', duration: 800, intensity: 55, parallax: true }, decor: ['blobs', 'cursor-glow'], bg: 'mesh', sp: 110 }),
    R('developer', ['dark', 150, 90], { fonts: ['Space Mono', 'Space Grotesk'], v: { hero: 'terminal', nav: 'top', cards: 'grid', head: 'code' }, a: { entrance: 'slide', duration: 500, intensity: 30, typewriter: true }, decor: ['scanlines'], bg: 'grid', sp: 90 })] },
  editorial: { label: 'More Editorial', desc: 'Type-led index layout with rules and columns', recipes: [
    R('editorial', ['light', 15, 20], { fonts: ['Fraunces', 'Newsreader'], v: { hero: 'index', nav: 'top', cards: 'list', head: 'side' }, a: { entrance: 'reveal', duration: 800, intensity: 30 }, decor: [], bg: 'flat', sp: 112 }),
    R('editorial', ['dark', 210, 15], { fonts: ['Playfair Display', 'Source Serif 4'], v: { hero: 'index', nav: 'top', cards: 'list', head: 'side' }, a: { entrance: 'fade', duration: 700, intensity: 25 }, decor: [], bg: 'flat', sp: 108 }),
    R('creative-minimal', ['light', 90, 15], { fonts: ['Instrument Serif', 'Inter'], v: { hero: 'big', nav: 'minimal', cards: 'list', head: 'huge' }, a: { entrance: 'reveal', duration: 900, intensity: 35 }, decor: [], bg: 'flat', sp: 110 })] },
  playful: { label: 'More Playful', desc: 'Stickers, bounce, rotation and shapes', recipes: [
    R('digital-playground', ['pop', 280, 85], { fonts: ['Bungee', 'Outfit'], v: { hero: 'sticker', nav: 'dock', cards: 'sticker', head: 'inline' }, a: { entrance: 'scale', duration: 600, intensity: 70, hover: 'tilt', marquee: true }, decor: ['shapes'], bg: 'dots', sp: 100 }),
    R('digital-playground', ['pop', 40, 90], { fonts: ['Fredoka', 'Fredoka'], v: { hero: 'sticker', nav: 'floating', cards: 'brutal', head: 'inline' }, a: { entrance: 'slide', duration: 500, intensity: 65, hover: 'tilt' }, decor: ['shapes', 'cursor-glow'], bg: 'gradient', sp: 96 }),
    R('creative-minimal', ['pop', 150, 80], { fonts: ['Righteous', 'Outfit'], v: { hero: 'stack', nav: 'dock', cards: 'offset', head: 'inline' }, a: { entrance: 'scale', duration: 600, intensity: 55, hover: 'zoom' }, decor: ['shapes'], bg: 'flat', sp: 110 })] },
  bold: { label: 'More Bold', desc: 'Huge type, thick borders, high contrast', recipes: [
    R('brutalist', ['pop', 50, 95], { fonts: ['Archivo Black', 'Space Mono'], v: { hero: 'big', nav: 'top', cards: 'brutal', head: 'huge' }, a: { entrance: 'slide', duration: 350, intensity: 75, marquee: true, hover: 'shift' }, decor: ['stripes'], bg: 'flat', sp: 84 }),
    R('brutalist', ['dark', 350, 100], { fonts: ['Bebas Neue', 'Space Grotesk'], v: { hero: 'big', nav: 'side', cards: 'overlay', head: 'huge' }, a: { entrance: 'scale', duration: 400, intensity: 70, marquee: true }, decor: ['grain'], bg: 'flat', sp: 90 }),
    R('retro-futuristic', ['pop', 8, 100], { fonts: ['Rubik Mono One', 'Chakra Petch'], v: { hero: 'overlap', nav: 'dock', cards: 'brutal', head: 'huge' }, a: { entrance: 'slide', duration: 450, intensity: 70, marquee: true }, decor: ['stripes'], bg: 'flat', sp: 88 })] },
};

/* Free-text interpretation: keyword -> design intent. Reports what it understood AND what it didn't. */
const KEYWORDS = [
  ['vibe', /futuristic|sci-?fi|cyber|synthwave|neon|hud|space/, 'futuristic'], ['vibe', /playground|playful|fun|toy|sticker|kid|bouncy|quirky|whimsical/, 'playful'], ['vibe', /brutal|raw|harsh|punk/, 'bold'],
  ['vibe', /experiment|avant|weird|unconventional|glitch|artsy/, 'experimental'], ['vibe', /elegant|luxur|refined|classy|sophisticated|graceful/, 'elegant'], ['vibe', /editorial|magazine|newspaper|journal|print/, 'editorial'],
  ['vibe', /professional|corporate|business|clean|trustworthy|formal/, 'professional'], ['vibe', /minimal|simple|quiet|whitespace|plain|calm/, 'minimal'], ['vibe', /bold|loud|striking|heavy|oversized|big type/, 'bold'], ['vibe', /creative|artistic|designer|expressive/, 'creative'], ['vibe', /colou?rful|vibrant|rainbow|bright/, 'colorful'],
  ['dark', /dark|night|black|moody/, 1], ['light', /\blight\b|white|airy|bright background/, 1], ['neon', /neon|glow|fluorescent/, 1], ['pastel', /pastel|soft colou?rs?|candy/, 1],
  ['hue', /\bred\b/, 5], ['hue', /orange|amber/, 28], ['hue', /yellow|gold/, 48], ['hue', /\bgreen\b|lime|emerald|mint/, 145], ['hue', /teal|cyan|turquoise|aqua/, 180], ['hue', /\bblue\b|navy|cobalt/, 220], ['hue', /purple|violet|indigo|lilac/, 270], ['hue', /pink|magenta|rose|fuchsia/, 325],
  ['font', /serif/, 'serif'], ['font', /mono|terminal|code/, 'mono'], ['font', /sans/, 'sans'], ['typebold', /bold typo|oversized|huge type|big type|large type|heavy type|loud type/, 1],
  ['layout', /asymmetr|offset|staggered|uneven|collage/, 'offset'], ['layout', /grid/, 'grid'], ['layout', /list|index|table of contents/, 'list'], ['layout', /overlay|full-?bleed|image-?heavy|photo/, 'overlay'], ['layout', /center(ed)?|stacked/, 'stack'], ['layout', /split|two column/, 'split'],
  ['nav', /floating nav|pill nav|floating menu/, 'floating'], ['nav', /side ?(bar|nav|menu)|vertical nav/, 'side'], ['nav', /dock|bottom nav|bottom bar/, 'dock'], ['nav', /hidden menu|hamburger|fullscreen menu|overlay menu/, 'minimal'],
  ['anim', /smooth scroll|scroll anim|reveal|fade/, 'reveal'], ['anim', /no anim|static|still|without anim/, 'none'], ['parallax', /parallax|depth/, 1], ['marquee', /marquee|ticker|scrolling text/, 1], ['typewriter', /typewriter|typing|typed/, 1],
  ['decor', /grain|noise|texture|film/, 'grain'], ['decor', /blob|gradient shapes|aurora|mesh/, 'blobs'], ['decor', /scanline|crt|retro screen/, 'scanlines'], ['decor', /floating shapes|shapes|confetti/, 'shapes'], ['decor', /grid floor|perspective grid|tron/, 'grid-floor'], ['decor', /sun|sunset/, 'sun'], ['decor', /cursor glow|spotlight/, 'cursor-glow'],
  ['dense', /spacious|breathing|roomy|generous/, 1], ['tight', /compact|dense|tight/, 1],
];
function interpretText(text) {
  const t = String(text || '').toLowerCase(), found = { vibes: [], flags: {}, decor: [], hue: null }, notes = [];
  KEYWORDS.forEach(([k, re, v]) => { const m = t.match(re); if (!m) return; notes.push(m[0].trim());
    if (k === 'vibe') found.vibes.push(v); else if (k === 'decor') found.decor.push(v); else if (k === 'hue') found.hue = v; else found.flags[k] = v; });
  return { found, notes: [...new Set(notes)], empty: !notes.length };
}
const pick = (arr, i) => arr[i % arr.length];
const FONT_BY_KIND = { serif: ['Fraunces', 'Newsreader'], mono: ['JetBrains Mono', 'Inter'], sans: ['Space Grotesk', 'Inter'] };

/* Apply a recipe onto a *copy* of the current design. Returns a validated design. */
function applyRecipe(cur, rec, over = {}) {
  const d = clone(cur), tpl = rec.tpl && TEMPLATES[rec.tpl] ? TEMPLATES[rec.tpl] : TEMPLATES[cur.template];
  if (!rec.keepLayout) { d.template = tpl.id; d.system = tpl.system; }
  const [mode, hue, vivid] = rec.pal || ['light', 220, 40];
  d.palette = { ...d.palette, ...paletteFrom(over.hue != null ? over.hue : hue, over.mode || mode, over.vivid != null ? over.vivid : vivid) };
  if (!rec.keepLayout) { const base = tpl.design; d.components = clone(base.components); d.layout = { ...d.layout, ...clone(base.layout) }; d.type = { ...d.type, ...clone(base.type) }; d.anim = { ...d.anim, ...clone(base.anim) }; }
  const fonts = over.fonts || rec.fonts; if (fonts) { d.type.heading = fonts[0]; d.type.body = fonts[1]; }
  Object.assign(d.layout, rec.v || {}, over.v || {}); Object.assign(d.anim, rec.a || {}, over.a || {});
  if (rec.decor) d.decor = [...rec.decor]; if (over.decor) d.decor = [...new Set([...(d.decor || []), ...over.decor])];
  if (rec.bg) d.bg = rec.bg; if (over.bg) d.bg = over.bg;
  const sp = over.sp || rec.sp; if (sp) d.layout.spacing = sp;
  if (rec.tpl === 'professional' || rec.tpl === 'editorial' || rec.tpl === 'creative-minimal') { /* keep tpl-driven component styles */ }
  return validateDesign(d);
}
/* Validation: clamp & whitelist every token. This is the gate any future AI output must pass. */
const WEIGHTS = ['400', '500', '600', '700', '800', '900'], ALIGNS = ['left', 'center', 'right'];
function cleanElementStyles(raw) {
  const out = {}; if (!isObj(raw)) return out;
  Object.entries(raw).slice(0, 400).forEach(([path, st]) => {
    if (!/^[\w\/-]{1,120}$/.test(path) || BAD_KEYS.includes(path) || !isObj(st)) return; const o = {};
    ['color', 'bg', 'btnColor'].forEach(k => { if (hexOk(st[k])) o[k] = st[k]; });
    if (FONTS[st.font]) o.font = st.font;
    if (st.size !== '' && st.size != null && isFinite(+st.size)) o.size = snum(st.size, 24, 8, 200);
    if (WEIGHTS.includes(String(st.weight))) o.weight = String(st.weight);
    if (ALIGNS.includes(st.align)) o.align = st.align;
    if (st.ls !== '' && st.ls != null && isFinite(+st.ls)) o.ls = snum(st.ls, 0, -0.2, 1);
    if (st.lh !== '' && st.lh != null && isFinite(+st.lh)) o.lh = snum(st.lh, 1.2, 0.6, 3);
    if (st.radius !== '' && st.radius != null && isFinite(+st.radius)) o.radius = snum(st.radius, 8, 0, 200);
    if ([...VARIANTS.hover, 'grow', 'invert'].includes(st.hover)) o.hover = st.hover;
    if (['horizontal', 'featured'].includes(st.layout)) o.layout = st.layout;
    if (['sm', 'lg'].includes(st.bsize)) o.bsize = st.bsize;
    if (Object.keys(o).length) out[path] = o;
  });
  return out;
}
function cleanSectionStyle(st) {
  const o = {}; if (!isObj(st)) return o;
  if (['none', 'alt', 'accent', 'custom'].includes(st.bg)) o.bg = st.bg; if (hexOk(st.bgColor)) o.bgColor = st.bgColor;
  if (['default', 'xs', 's', 'l', 'xl'].includes(st.pad)) o.pad = st.pad; if (['default', 'wide', 'narrow', 'cols'].includes(st.layout)) o.layout = st.layout;
  if (['inherit', ...VARIANTS.entrance].includes(st.anim)) o.anim = st.anim; return o;
}
/* The single gate for every design object that did not come from our own UI: imports, storage, Make It Yours output.
   Builds the result from the template defaults and copies over only values that pass a whitelist or a clamp. */
function validateDesign(d) {
  d = isObj(d) ? d : {}; const tpl = TEMPLATES[d.template] ? d.template : 'editorial', b = makeDesign(tpl), o = clone(b), sub = k => isObj(d[k]) ? d[k] : {};
  const inList = (v, l, f) => l.includes(v) ? v : f, pal = sub('palette'), ty = sub('type'), la = sub('layout'), co = sub('components'), an = sub('anim'), btn = isObj(co.btn) ? co.btn : {}, card = isObj(co.card) ? co.card : {};
  PALETTE_KEYS.forEach(k => { if (hexOk(pal[k])) o.palette[k] = pal[k]; });
  o.type.heading = FONTS[ty.heading] ? ty.heading : b.type.heading; o.type.body = FONTS[ty.body] ? ty.body : b.type.body; o.type.size = snum(ty.size, b.type.size, 13, 24);
  o.type.weight = +inList(String(ty.weight), WEIGHTS, String(b.type.weight)); o.type.line = snum(ty.line, b.type.line, 1.2, 2); o.type.spacing = snum(ty.spacing, b.type.spacing, -0.05, 0.2);
  o.type.headSpacing = snum(ty.headSpacing, b.type.headSpacing, -6, 10); o.type.headCase = inList(ty.headCase, ['none', 'upper'], b.type.headCase);
  o.layout.hero = inList(la.hero, VARIANTS.hero, b.layout.hero); o.layout.nav = inList(la.nav, VARIANTS.nav, b.layout.nav); o.layout.cards = inList(la.cards, VARIANTS.cards, b.layout.cards); o.layout.head = inList(la.head, VARIANTS.head, b.layout.head);
  o.layout.image = inList(la.image, ['left', 'right'], b.layout.image); o.layout.secBg = inList(la.secBg, ['none', 'alt', 'stripe'], b.layout.secBg);
  o.layout.spacing = snum(la.spacing, b.layout.spacing, 32, 220); o.layout.width = snum(la.width, b.layout.width, 720, 1400); o.layout.cols = Math.round(snum(la.cols, b.layout.cols, 1, 4));
  o.components.btn = { style: inList(btn.style, ['solid', 'outline', 'ghost', 'brutal'], b.components.btn.style), radius: snum(btn.radius, b.components.btn.radius, 0, 40), size: inList(btn.size, ['sm', 'md', 'lg'], b.components.btn.size || 'md') };
  o.components.card = { radius: snum(card.radius, b.components.card.radius, 0, 40), shadow: inList(card.shadow, ['none', 'soft', 'hard', 'glow'], b.components.card.shadow), border: snum(card.border, b.components.card.border, 0, 6), hover: inList(card.hover, VARIANTS.hover, b.components.card.hover) };
  o.components.navLink = inList(co.navLink, ['plain', 'underline', 'pill', 'bracket'], b.components.navLink); o.components.divider = inList(co.divider, ['line', 'thick', 'none'], b.components.divider); o.components.imageBorder = inList(co.imageBorder, ['none', 'thin', 'thick', 'frame'], b.components.imageBorder);
  o.anim.entrance = inList(an.entrance, VARIANTS.entrance, b.anim.entrance); o.anim.hover = inList(an.hover, VARIANTS.hover, b.anim.hover); o.anim.duration = snum(an.duration, b.anim.duration, 100, 2500); o.anim.intensity = snum(an.intensity, b.anim.intensity, 0, 100);
  ['stagger', 'marquee', 'typewriter', 'parallax', 'progress'].forEach(k => o.anim[k] = an[k] === undefined ? b.anim[k] : !!an[k]);
  o.bg = inList(d.bg, VARIANTS.bg, b.bg); o.decor = [...new Set(Array.isArray(d.decor) ? d.decor : [])].filter(x => VARIANTS.decor.includes(x)); o.elementStyles = cleanElementStyles(d.elementStyles);
  o.template = tpl; o.system = TEMPLATES[tpl].system; return o;
}
function describeDiff(a, b) {
  const ch = []; if (a.template !== b.template) ch.push('Template: ' + TEMPLATES[b.template].name);
  if (a.layout.hero !== b.layout.hero) ch.push('Hero: ' + b.layout.hero); if (a.layout.nav !== b.layout.nav) ch.push('Navigation: ' + b.layout.nav); if (a.layout.cards !== b.layout.cards) ch.push('Cards: ' + b.layout.cards);
  if (a.type.heading !== b.type.heading) ch.push('Type: ' + b.type.heading); if (a.palette.accent !== b.palette.accent || a.palette.bg !== b.palette.bg) ch.push('New palette');
  if (a.anim.entrance !== b.anim.entrance) ch.push('Motion: ' + b.anim.entrance); if ((a.decor || []).join() !== (b.decor || []).join()) ch.push('Decor: ' + ((b.decor || []).join(', ') || 'none')); return ch;
}
/* Public API. Returns {ok, variations:[{id,label,design,changes}], interpreted, message, suggestions} */
function generateVariations(cur, request, seed = 0) {
  if (request.preset) {
    const pr = PRESETS[request.preset]; if (!pr) return { ok: false, message: 'Unknown preset.', suggestions: Object.keys(PRESETS) };
    return { ok: true, interpreted: [pr.label], variations: pr.recipes.map((r, i) => { const rr = pick(pr.recipes, i + seed); const design = applyRecipe(cur, rr, seed ? { hue: (r.pal[1] + seed * 47) % 360 } : {}); return { id: uid('v'), label: pr.label + ' · option ' + (i + 1), design, changes: describeDiff(cur, design) }; }) };
  }
  const { found, notes, empty } = interpretText(request.text);
  if (empty) return { ok: false, message: "I couldn't map that description to any design settings I support (colour, typography, layout, navigation, animation, decoration). Try describing a mood (e.g. “elegant”, “futuristic”), a colour, or a layout (e.g. “asymmetric cards”) — or pick one of these presets:", suggestions: ['professional', 'creative', 'elegant', 'futuristic', 'playful', 'bold'] };
  const vibes = found.vibes.length ? found.vibes : ['creative'], over = { v: {}, a: {}, decor: found.decor.slice() };
  const f = found.flags; if (f.dark) over.mode = 'dark'; if (f.light) over.mode = 'light'; if (f.neon) { over.mode = 'dark'; over.vivid = 100; } if (f.pastel) { over.mode = 'pop'; over.vivid = 40; }
  if (found.hue != null) over.hue = found.hue; if (f.font && FONT_BY_KIND[f.font]) over.fonts = FONT_BY_KIND[f.font];
  if (f.typebold) { over.fonts = over.fonts || ['Archivo Black', 'Inter']; }
  if (f.layout === 'offset' || f.layout === 'grid' || f.layout === 'list' || f.layout === 'overlay') over.v.cards = f.layout; if (f.layout === 'stack' || f.layout === 'split') over.v.hero = f.layout;
  if (f.nav) over.v.nav = f.nav; if (f.anim) over.a.entrance = f.anim; if (f.parallax) over.a.parallax = true; if (f.marquee) over.a.marquee = true; if (f.typewriter) over.a.typewriter = true;
  if (f.dense) over.sp = 140; if (f.tight) over.sp = 72;
  const sources = [vibes[0], vibes[1] || vibes[0], vibes[2] || vibes[0]];
  const variations = sources.map((v, i) => { const pr = PRESETS[v], rec = pr.recipes[(i + seed) % pr.recipes.length];
    const o = { ...over, v: { ...over.v }, a: { ...over.a }, decor: [...over.decor], hue: over.hue != null ? (over.hue + i * 18) % 360 : undefined };
    if (i === 2 && vibes.length < 2) { const alt = PRESETS[pick(Object.keys(PRESETS), seed + 3)].recipes[0]; return mk(alt, o, 'Blend'); }
    return mk(rec, o, pr.label.replace('More ', '')); });
  function mk(rec, o, label) { const design = applyRecipe(cur, rec, o); return { id: uid('v'), label: label + ' take', design, changes: describeDiff(cur, design) }; }
  return { ok: true, interpreted: notes, variations };
}
