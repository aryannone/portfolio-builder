/* ===== 02-templates: fonts, design tokens, 8 templates ===== */
const W4 = '400;500;600;700';
const FONTS = {
  'Fraunces': { s: "'Fraunces',Georgia,serif", w: W4, k: 'serif' }, 'Newsreader': { s: "'Newsreader',Georgia,serif", w: W4, k: 'serif' },
  'Playfair Display': { s: "'Playfair Display',Georgia,serif", w: W4, k: 'serif' }, 'Source Serif 4': { s: "'Source Serif 4',Georgia,serif", w: W4, k: 'serif' },
  'Instrument Serif': { s: "'Instrument Serif',Georgia,serif", w: '', k: 'serif' },
  'Inter': { s: "'Inter',system-ui,sans-serif", w: W4, k: 'sans' }, 'Manrope': { s: "'Manrope',system-ui,sans-serif", w: W4, k: 'sans' },
  'DM Sans': { s: "'DM Sans',system-ui,sans-serif", w: W4, k: 'sans' }, 'Space Grotesk': { s: "'Space Grotesk',system-ui,sans-serif", w: W4, k: 'sans' },
  'Plus Jakarta Sans': { s: "'Plus Jakarta Sans',system-ui,sans-serif", w: W4, k: 'sans' }, 'Syne': { s: "'Syne',system-ui,sans-serif", w: W4, k: 'sans' },
  'Outfit': { s: "'Outfit',system-ui,sans-serif", w: W4, k: 'sans' }, 'Sora': { s: "'Sora',system-ui,sans-serif", w: W4, k: 'sans' },
  'JetBrains Mono': { s: "'JetBrains Mono',ui-monospace,Menlo,monospace", w: W4, k: 'mono' }, 'IBM Plex Mono': { s: "'IBM Plex Mono',ui-monospace,Menlo,monospace", w: W4, k: 'mono' },
  'Space Mono': { s: "'Space Mono',ui-monospace,Menlo,monospace", w: '400;700', k: 'mono' }, 'DM Mono': { s: "'DM Mono',ui-monospace,Menlo,monospace", w: '400;500', k: 'mono' },
  'Archivo Black': { s: "'Archivo Black',Impact,sans-serif", w: '', k: 'display' }, 'Bebas Neue': { s: "'Bebas Neue',Impact,sans-serif", w: '', k: 'display' },
  'Unbounded': { s: "'Unbounded',system-ui,sans-serif", w: W4, k: 'display' }, 'Bungee': { s: "'Bungee',Impact,sans-serif", w: '', k: 'display' },
  'Rubik Mono One': { s: "'Rubik Mono One',Impact,sans-serif", w: '', k: 'display' }, 'Orbitron': { s: "'Orbitron',system-ui,sans-serif", w: W4, k: 'display' },
  'Chakra Petch': { s: "'Chakra Petch',system-ui,sans-serif", w: W4, k: 'sans' }, 'Fredoka': { s: "'Fredoka',system-ui,sans-serif", w: W4, k: 'display' },
  'Righteous': { s: "'Righteous',system-ui,sans-serif", w: '', k: 'display' }, 'Press Start 2P': { s: "'Press Start 2P',monospace", w: '', k: 'display' },
  'VT323': { s: "'VT323',monospace", w: '', k: 'mono' },
  'System UI': { s: "system-ui,-apple-system,'Segoe UI',sans-serif", w: '', k: 'sans', local: true }, 'Georgia': { s: "Georgia,'Times New Roman',serif", w: '', k: 'serif', local: true },
};
function googleFontsUrl(names) {
  const fam = [...new Set(names)].filter(n => FONTS[n] && !FONTS[n].local).map(n => 'family=' + n.replace(/ /g, '+') + (FONTS[n].w ? ':wght@' + FONTS[n].w : ''));
  return fam.length ? 'https://fonts.googleapis.com/css2?' + fam.join('&') + '&display=swap' : '';
}

const BASE_DESIGN = {
  system: 'minimal', template: 'editorial',
  palette: { primary: '#111111', secondary: '#666666', accent: '#2D4BDB', bg: '#ffffff', text: '#111111', card: '#ffffff', border: '#dddddd' },
  type: { heading: 'Inter', body: 'Inter', size: 17, weight: 700, line: 1.6, spacing: 0, headSpacing: -1, headCase: 'none' },
  layout: { spacing: 96, width: 1080, cols: 3, hero: 'split', nav: 'top', image: 'right', head: 'inline', cards: 'grid', secBg: 'none' },
  components: { btn: { style: 'solid', radius: 8, size: 'md' }, card: { radius: 12, shadow: 'soft', border: 1, hover: 'lift' }, navLink: 'plain', divider: 'line', imageBorder: 'none' },
  anim: { entrance: 'fade', stagger: true, duration: 600, intensity: 40, hover: 'lift', marquee: false, typewriter: false, parallax: false, progress: false },
  bg: 'flat', decor: [], elementStyles: {},
};
const TEMPLATES = {};
function T(id, system, name, blurb, tags, d) { TEMPLATES[id] = { id, system, name, blurb, tags, design: deepMerge(deepMerge(BASE_DESIGN, { system, template: id }), d) }; }

T('editorial', 'minimal', 'Editorial', 'Magazine-style index. Big serif name, ruled columns, project list as a table of contents.', ['serif', 'writers', 'researchers'], {
  palette: { primary: '#191A1F', secondary: '#5B5F6B', accent: '#2D4BDB', bg: '#F5F5F2', text: '#191A1F', card: '#FFFFFF', border: '#D6D6CF' },
  type: { heading: 'Fraunces', body: 'Newsreader', size: 18, weight: 600, line: 1.65, headSpacing: -2 },
  layout: { spacing: 110, width: 1120, hero: 'index', nav: 'top', head: 'side', cards: 'list' },
  components: { btn: { style: 'outline', radius: 0 }, card: { radius: 0, shadow: 'none', hover: 'none' }, navLink: 'underline' }, anim: { entrance: 'reveal', duration: 800, intensity: 30 } });
T('developer', 'minimal', 'Developer', 'Terminal-flavoured dark theme with monospace details, typed intro and code-comment headings.', ['dark', 'engineers', 'monospace'], {
  palette: { primary: '#58A6FF', secondary: '#8B949E', accent: '#FFA657', bg: '#0D1117', text: '#D5DCE4', card: '#161B22', border: '#30363D' },
  type: { heading: 'JetBrains Mono', body: 'Inter', size: 16, weight: 600, line: 1.65, headSpacing: -1 },
  layout: { spacing: 88, width: 1040, hero: 'terminal', nav: 'top', head: 'code', cards: 'grid' },
  components: { btn: { style: 'outline', radius: 6 }, card: { radius: 8, shadow: 'none', hover: 'lift' }, navLink: 'bracket' }, anim: { entrance: 'fade', duration: 500, intensity: 25, typewriter: true }, bg: 'dots' });
T('professional', 'minimal', 'Professional', 'Confident corporate layout: split hero, soft cards, tinted bands and a clear experience timeline.', ['corporate', 'job seekers', 'light'], {
  palette: { primary: '#17305F', secondary: '#5C6B85', accent: '#0F8B8D', bg: '#FFFFFF', text: '#1B2437', card: '#FFFFFF', border: '#DCE3EE' },
  type: { heading: 'Plus Jakarta Sans', body: 'Inter', size: 17, weight: 700, line: 1.65, headSpacing: -1 },
  layout: { spacing: 92, width: 1100, hero: 'split', nav: 'top', head: 'inline', cards: 'grid', secBg: 'alt' },
  components: { btn: { style: 'solid', radius: 10 }, card: { radius: 14, shadow: 'soft', hover: 'lift' }, navLink: 'pill' }, anim: { entrance: 'fade', duration: 600, intensity: 35 } });
T('creative-minimal', 'minimal', 'Creative Minimal', 'Airy and quiet with one playful gesture: centred hero, offset project cards and a hidden-menu navigation.', ['designers', 'freelancers', 'airy'], {
  palette: { primary: '#1F1B33', secondary: '#6A6584', accent: '#D6336C', bg: '#F3F1FA', text: '#1F1B33', card: '#FFFFFF', border: '#E0DCF0' },
  type: { heading: 'Syne', body: 'DM Sans', size: 17, weight: 600, line: 1.65, headSpacing: -2 },
  layout: { spacing: 130, width: 980, hero: 'stack', nav: 'minimal', head: 'inline', cards: 'offset' },
  components: { btn: { style: 'ghost', radius: 999 }, card: { radius: 22, shadow: 'none', hover: 'lift' }, navLink: 'plain' }, anim: { entrance: 'slide', duration: 800, intensity: 50, parallax: true } });
T('brutalist', 'maximal', 'Brutalist', 'Raw and loud: thick black borders, hard shadows, shouting type and a hazard-stripe edge.', ['bold', 'raw', 'light'], {
  palette: { primary: '#000000', secondary: '#1A3CFF', accent: '#FFE600', bg: '#E9E9E4', text: '#000000', card: '#FFFFFF', border: '#000000' },
  type: { heading: 'Archivo Black', body: 'Space Mono', size: 16, weight: 400, line: 1.55, headSpacing: -2, headCase: 'upper' },
  layout: { spacing: 84, width: 1200, cols: 2, hero: 'big', nav: 'top', head: 'huge', cards: 'brutal' },
  components: { btn: { style: 'brutal', radius: 0 }, card: { radius: 0, shadow: 'hard', border: 4, hover: 'shift' }, navLink: 'bracket', divider: 'thick', imageBorder: 'thick' },
  anim: { entrance: 'slide', duration: 350, intensity: 70, marquee: true, hover: 'shift' }, decor: ['stripes'] });
T('neo-experimental', 'maximal', 'Neo-Experimental', 'Glassy night-gradient with overlapping oversized type, floating pill navigation and grain.', ['gradient', 'glass', 'dark'], {
  palette: { primary: '#F1E9FF', secondary: '#6CF2FF', accent: '#FF7AF5', bg: '#140A26', text: '#F1E9FF', card: '#231240', border: '#3C2766' },
  type: { heading: 'Unbounded', body: 'Sora', size: 16, weight: 600, line: 1.65, headSpacing: -3 },
  layout: { spacing: 120, width: 1160, cols: 2, hero: 'overlap', nav: 'floating', head: 'huge', cards: 'overlay' },
  components: { btn: { style: 'solid', radius: 999 }, card: { radius: 28, shadow: 'glow', hover: 'lift' }, navLink: 'pill', imageBorder: 'none' },
  anim: { entrance: 'scale', duration: 900, intensity: 60, parallax: true }, bg: 'mesh', decor: ['blobs', 'grain'] });
T('retro-futuristic', 'maximal', 'Retro-Futuristic', 'Synthwave HUD: a sun on the horizon, perspective grid floor, scanlines and a vertical side rail.', ['synthwave', 'neon', 'dark'], {
  palette: { primary: '#FF2E97', secondary: '#00E5FF', accent: '#FFD319', bg: '#0A0124', text: '#F4E9FF', card: '#14052F', border: '#FF2E97' },
  type: { heading: 'Orbitron', body: 'Chakra Petch', size: 17, weight: 700, line: 1.6, headSpacing: 0, headCase: 'upper' },
  layout: { spacing: 100, width: 1100, hero: 'big', nav: 'side', head: 'inline', cards: 'grid' },
  components: { btn: { style: 'outline', radius: 0 }, card: { radius: 0, shadow: 'glow', border: 1, hover: 'glow' }, navLink: 'bracket', divider: 'line' },
  anim: { entrance: 'fade', duration: 700, intensity: 40, typewriter: true, hover: 'glow' }, decor: ['grid-floor', 'sun', 'scanlines'] });
T('digital-playground', 'maximal', 'Digital Playground', 'Sticker-book energy: bouncy letters, tilted cards, floating shapes that chase the cursor, dock navigation.', ['playful', 'colourful', 'stickers'], {
  palette: { primary: '#6C3DF4', secondary: '#FF4FA3', accent: '#FFD23F', bg: '#BFE9FF', text: '#1B1245', card: '#FFFFFF', border: '#1B1245' },
  type: { heading: 'Bungee', body: 'Outfit', size: 18, weight: 400, line: 1.6, headSpacing: 0 },
  layout: { spacing: 100, width: 1120, hero: 'sticker', nav: 'dock', head: 'inline', cards: 'sticker' },
  components: { btn: { style: 'brutal', radius: 999 }, card: { radius: 28, shadow: 'hard', border: 3, hover: 'tilt' }, navLink: 'pill', imageBorder: 'thick' },
  anim: { entrance: 'scale', duration: 600, intensity: 70, hover: 'tilt', marquee: true }, decor: ['shapes'], bg: 'dots' });

function makeDesign(id) { return clone((TEMPLATES[id] || TEMPLATES.editorial).design); }
const DEFAULT_ELEMENT_FONT_OPTIONS = Object.keys(FONTS);

const PALETTES = {
  light: [['Ink & Blue', '#191A1F', '#5B5F6B', '#2D4BDB', '#F5F5F2', '#191A1F', '#FFFFFF', '#D6D6CF'], ['Harbour', '#17305F', '#5C6B85', '#0F8B8D', '#FFFFFF', '#1B2437', '#F4F7FB', '#DCE3EE'], ['Orchid', '#1F1B33', '#6A6584', '#D6336C', '#F3F1FA', '#1F1B33', '#FFFFFF', '#E0DCF0'], ['Moss', '#1E3A2F', '#5E7A6B', '#C4572B', '#F1F5EF', '#1B2B23', '#FFFFFF', '#D3DDD2'], ['Paper Red', '#1A1A1A', '#6B6B6B', '#E02D2D', '#FAFAFA', '#1A1A1A', '#FFFFFF', '#E3E3E3']],
  dark: [['Terminal', '#58A6FF', '#8B949E', '#FFA657', '#0D1117', '#D5DCE4', '#161B22', '#30363D'], ['Ultraviolet', '#F1E9FF', '#6CF2FF', '#FF7AF5', '#140A26', '#F1E9FF', '#231240', '#3C2766'], ['Synthwave', '#FF2E97', '#00E5FF', '#FFD319', '#0A0124', '#F4E9FF', '#14052F', '#FF2E97'], ['Slate Lime', '#E7ECEF', '#7C8A96', '#B8F200', '#12171C', '#E7ECEF', '#1B2229', '#2B353E'], ['Ember', '#FFE8D6', '#C99A82', '#FF6A3D', '#1A0F0B', '#FFE8D6', '#27160F', '#4A2A1D']],
  bold: [['Sticker', '#6C3DF4', '#FF4FA3', '#FFD23F', '#BFE9FF', '#1B1245', '#FFFFFF', '#1B1245'], ['Hazard', '#000000', '#1A3CFF', '#FFE600', '#E9E9E4', '#000000', '#FFFFFF', '#000000'], ['Candy', '#FF3D81', '#3D7BFF', '#FFE14D', '#FFF0F6', '#2A0B1E', '#FFFFFF', '#2A0B1E'], ['Citrus', '#FF7A00', '#0A7A5A', '#FFE14D', '#FFF7E0', '#2B1600', '#FFFFFF', '#2B1600']],
};
const PALETTE_KEYS = ['primary', 'secondary', 'accent', 'bg', 'text', 'card', 'border'];
