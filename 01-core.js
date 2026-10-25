/* ===== 01-core: utilities, schema, data model ===== */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Safe storage: preview panes / sandboxed viewers forbid localStorage & sessionStorage (they throw).
   Wrap every access; fall back to memory so the app always starts. */
const _mem = { l: new Map(), s: new Map() };
const mkStore = (name, kind) => ({
  get(k) { try { return window[name].getItem(k); } catch (e) { return _mem[kind].has(k) ? _mem[kind].get(k) : null; } },
  set(k, v) { try { window[name].setItem(k, v); } catch (e) { _mem[kind].set(k, String(v)); } },
  del(k) { try { window[name].removeItem(k); } catch (e) { _mem[kind].delete(k); } },
  keys() { const o = []; try { for (let i = 0; i < window[name].length; i++) o.push(window[name].key(i)); } catch (e) { /* blocked */ } _mem[kind].forEach((v, k) => o.includes(k) || o.push(k)); return o; },
});
const LS = mkStore('localStorage', 'l'), SS = mkStore('sessionStorage', 's');
const clone = o => JSON.parse(JSON.stringify(o));
const uid = (p = 'x') => p + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => String(s).replace(/[^a-zA-Z0-9]/g, '-');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = () => { clearTimeout(t); }; return d; };
const fmtBytes = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

/* URL validation: returns '' (empty), null (invalid) or a normalised safe URL */
function cleanUrl(u) {
  u = String(u == null ? '' : u).trim();
  if (!u) return '';
  if (/^asset:[\w-]+$/.test(u)) return u;
  if (/^#[\w-]*$/.test(u)) return u;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(u)) return u;
  if (/^tel:[+\d\s().-]{5,}$/i.test(u)) return u;
  if (/^(javascript|data|vbscript|file):/i.test(u)) return null;
  if (/^\.{0,2}\/[^\s]*$/.test(u)) return u;
  try {
    const x = new URL(/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u);
    if ((x.protocol === 'http:' || x.protocol === 'https:') && /\.[a-z]{2,}$|^localhost$/i.test(x.hostname)) return x.href;
  } catch (e) { /* invalid */ }
  return null;
}
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
const hexOk = c => /^#[0-9a-f]{6}$/i.test(c);

/* ---------- Section schema: drives forms, renderer, inspector ---------- */
const F = (k, l, t = 'text', extra = {}) => ({ k, l, t, ...extra });
const SECTION_TYPES = {
  hero: { label: 'Hero', kind: 'single', title: 'Home', icon: '✦', fields: [F('headline', 'Headline statement', 'textarea'), F('sub', 'Intro text', 'textarea'), F('cta', 'Primary button text'), F('ctaUrl', 'Primary button link (blank = scroll to your work)', 'url'), F('cta2', 'Second button text'), F('cta2Url', 'Second button link (blank = scroll to contact)', 'url')] },
  about: { label: 'About', kind: 'single', title: 'About', icon: '☺', fields: [F('bio', 'Biography', 'textarea', { rows: 6 }), F('image', 'Photo', 'image'), F('imageAlt', 'Photo description')] },
  skills: { label: 'Skills & technologies', kind: 'list', title: 'Skills', icon: '⚙', item: 'Skill', main: 'name', fields: [F('name', 'Name'), F('group', 'Group (optional)'), F('level', 'Level 0–100', 'range')] },
  projects: { label: 'Projects & case studies', kind: 'list', title: 'Work', icon: '◧', item: 'Project', main: 'title', fields: [F('title', 'Title'), F('description', 'Description', 'textarea'), F('image', 'Image', 'image'), F('imageAlt', 'Image description'), F('link', 'Project link', 'url'), F('tags', 'Tags (comma separated)', 'tags'), F('role', 'Role'), F('year', 'Year'), F('details', 'Case study details', 'textarea', { rows: 5 })] },
  experience: { label: 'Work experience', kind: 'list', title: 'Experience', icon: '▤', item: 'Position', main: 'role', fields: [F('role', 'Role'), F('company', 'Company'), F('period', 'Period'), F('details', 'Details', 'textarea')] },
  education: { label: 'Education', kind: 'list', title: 'Education', icon: '✎', item: 'Education', main: 'school', fields: [F('school', 'School'), F('degree', 'Degree / programme'), F('period', 'Period'), F('details', 'Details', 'textarea')] },
  achievements: { label: 'Achievements', kind: 'list', title: 'Achievements', icon: '★', item: 'Achievement', main: 'title', fields: [F('title', 'Title'), F('detail', 'Detail', 'textarea'), F('year', 'Year')] },
  certifications: { label: 'Certifications', kind: 'list', title: 'Certifications', icon: '✔', item: 'Certification', main: 'name', fields: [F('name', 'Name'), F('issuer', 'Issuer'), F('year', 'Year'), F('url', 'Credential link', 'url')] },
  testimonials: { label: 'Testimonials', kind: 'list', title: 'Kind words', icon: '❝', item: 'Testimonial', main: 'author', fields: [F('quote', 'Quote', 'textarea'), F('author', 'Author'), F('role', 'Role / company')] },
  publications: { label: 'Publications', kind: 'list', title: 'Publications', icon: '❡', item: 'Publication', main: 'title', fields: [F('title', 'Title'), F('venue', 'Venue'), F('year', 'Year'), F('url', 'Link', 'url')] },
  research: { label: 'Research', kind: 'list', title: 'Research', icon: '⚗', item: 'Research item', main: 'title', fields: [F('title', 'Title'), F('summary', 'Summary', 'textarea'), F('url', 'Link', 'url')] },
  services: { label: 'Services', kind: 'list', title: 'Services', icon: '☰', item: 'Service', main: 'title', fields: [F('title', 'Service'), F('description', 'Description', 'textarea'), F('price', 'Price / note')] },
  blog: { label: 'Blog posts', kind: 'list', title: 'Writing', icon: '✐', item: 'Post', main: 'title', fields: [F('title', 'Title'), F('summary', 'Summary', 'textarea'), F('date', 'Date'), F('url', 'Link', 'url')] },
  hobbies: { label: 'Hobbies', kind: 'list', title: 'Outside work', icon: '♪', item: 'Hobby', main: 'name', fields: [F('name', 'Hobby'), F('note', 'Note')] },
  resume: { label: 'Résumé', kind: 'single', title: 'Résumé', icon: '⎙', fields: [F('text', 'Text', 'textarea'), F('button', 'Button text'), F('url', 'Résumé file or link', 'file')] },
  contact: { label: 'Contact', kind: 'single', title: 'Contact', icon: '✉', fields: [F('text', 'Intro text', 'textarea'), F('formLabel', 'Mail form button text')] },
  custom: { label: 'Custom section', kind: 'list', title: 'Custom section', icon: '＋', item: 'Entry', main: 'title', fields: [F('title', 'Title'), F('text', 'Text', 'textarea'), F('image', 'Image', 'image'), F('imageAlt', 'Image description'), F('link', 'Link', 'url')] },
};
const PERSON_FIELDS = [F('name', 'Full name'), F('title', 'Professional title'), F('location', 'Location'), F('email', 'Email', 'email'), F('phone', 'Phone'), F('avatar', 'Profile image', 'image')];
const SOCIAL_NETWORKS = ['GitHub', 'LinkedIn', 'Twitter / X', 'Instagram', 'Dribbble', 'Behance', 'YouTube', 'Mastodon', 'Website', 'Other'];

/* ---------- Path addressing: every editable element maps to model data ---------- */
function parsePath(path) {
  const a = String(path).split('/');
  if (a[0] === 's') {
    const r = { sid: a[1] };
    if (a[2] === 'i') { r.iid = a[3]; r.field = a[4]; }
    else if (a[2] === 'data') { r.data = true; r.field = a[3]; }
    else if (a[2]) r.field = a[2];
    return r;
  }
  if (a[0] === 'soc') return { soc: a[1], field: a[2] };
  return { obj: a[0], field: a[1] };
}
const findSection = (p, sid) => p.sections.find(s => s.id === sid);
function getVal(p, path) {
  const r = parsePath(path);
  if (r.sid) {
    const s = findSection(p, r.sid); if (!s) return undefined;
    if (r.iid) { const it = s.items.find(i => i.id === r.iid); return it ? (r.field ? it[r.field] : it) : undefined; }
    if (r.data) return s.data[r.field];
    return r.field ? s[r.field] : s;
  }
  if (r.soc) { const o = p.socials.find(x => x.id === r.soc); return o ? o[r.field] : undefined; }
  return p[r.obj] ? p[r.obj][r.field] : undefined;
}
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const BAD_KEYS = ['__proto__', 'constructor', 'prototype'];
/* Only fields that really exist in the model can be written, and never prototype keys. */
function setVal(p, path, v) {
  const r = parsePath(path); if (BAD_KEYS.includes(r.field) || BAD_KEYS.includes(r.obj)) return false;
  if (r.sid) {
    const s = findSection(p, r.sid); if (!s) return false; const t = SECTION_TYPES[s.type] || SECTION_TYPES.custom, known = k => t.fields.some(f => f.k === k);
    if (r.iid) { const it = s.items.find(i => i.id === r.iid); if (!it || !known(r.field)) return false; it[r.field] = v; return true; }
    if (r.data) { if (!known(r.field) && !hasOwn(s.data, r.field)) return false; s.data[r.field] = v; return true; }
    if (r.field === 'title') { s.title = v; return true; }
    return false;
  }
  if (r.soc) { const o = p.socials.find(x => x.id === r.soc); if (!o || !['label', 'url'].includes(r.field)) return false; o[r.field] = v; return true; }
  if ((r.obj === 'person' || r.obj === 'seo') && hasOwn(p[r.obj], r.field)) { p[r.obj][r.field] = v; return true; }
  return false;
}
/* Text a visitor may type directly into the preview (used to vet messages from the preview frame, which can run user code). */
function inlineEditable(p, path) {
  if (typeof path !== 'string' || path.length > 120 || !/^[\w\/-]+$/.test(path)) return false;
  const r = parsePath(path), textual = f => f && (f.t === 'text' || f.t === 'textarea');
  if (r.sid) { const s = findSection(p, r.sid); if (!s) return false; const fd = k => (SECTION_TYPES[s.type] || SECTION_TYPES.custom).fields.find(f => f.k === k);
    if (r.iid) return !!(s.items.some(i => i.id === r.iid) && textual(fd(r.field))); if (r.data) return textual(fd(r.field)); return r.field === 'title'; }
  if (r.soc) return r.field === 'label' && p.socials.some(x => x.id === r.soc);
  if (r.obj === 'person') return ['name', 'title', 'location', 'phone', 'footer'].includes(r.field) && hasOwn(p.person, r.field);
  return false;
}

/* ---------- Sections ---------- */
function newSection(type, opts = {}) {
  const t = SECTION_TYPES[type] || SECTION_TYPES.custom;
  const s = { id: uid('s'), type, title: opts.title || t.title, visible: true, nav: type !== 'hero', data: {}, items: [], style: {} };
  if (type === 'hero') s.data = { headline: '', sub: '', cta: 'See my work', ctaUrl: '#', cta2: 'Get in touch', cta2Url: '#' };
  if (type === 'about') s.data = { bio: '', image: '', imageAlt: '' };
  if (type === 'resume') s.data = { text: 'A one-page summary of my experience.', button: 'Download résumé', url: '' };
  if (type === 'contact') s.data = { text: 'Open to new projects and conversations.', formLabel: 'Send message' };
  return s;
}
function newItem(type) {
  const t = SECTION_TYPES[type] || SECTION_TYPES.custom, it = { id: uid('i') };
  t.fields.forEach(f => it[f.k] = f.t === 'tags' ? [] : f.t === 'range' ? 80 : '');
  return it;
}
const blank = v => v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
function sectionEmpty(s, p) {
  if (s.type === 'hero') return false;
  const t = SECTION_TYPES[s.type]; if (!t) return true;
  if (t.kind === 'list') return !s.items.some(it => t.fields.some(f => f.t !== 'range' && !blank(it[f.k])));
  if (s.type === 'about') return blank(s.data.bio) && blank(s.data.image);
  if (s.type === 'resume') return blank(s.data.url);
  if (s.type === 'contact') return blank(p.person.email) && blank(p.person.phone) && blank(p.person.location) && !p.socials.some(x => !blank(x.url));
  return true;
}
const sectionRenders = (s, p) => s.visible && !sectionEmpty(s, p);
function dupSection(s) {
  const c = clone(s); c.id = uid('s'); c.title = s.title + ' copy';
  c.items.forEach(i => i.id = uid('i')); return c;
}

/* ---------- Sample content & project factory ---------- */
function sampleContent() {
  const S = (type, mod) => { const s = newSection(type); mod && mod(s); return s; };
  const it = (type, o) => ({ ...newItem(type), ...o });
  return {
    person: { name: 'Aryan Singh', title: 'Product designer & front-end engineer', location: 'Bengaluru, India', email: 'aryan.singh@example.com', phone: '', avatar: '', footer: '© ' + new Date().getFullYear() + ' Aryan Singh. Built with PortfolioVerse.' },
    socials: [{ id: uid('o'), label: 'GitHub', url: 'https://github.com' }, { id: uid('o'), label: 'LinkedIn', url: 'https://linkedin.com' }, { id: uid('o'), label: 'Behance', url: 'https://behance.net' }],
    sections: [
      S('hero', s => { s.data.headline = 'I design and build simple, dependable apps for people who rely on them every day.'; s.data.sub = 'Eight years across research, interface design and production code, currently building field tools for farmers and agents at Kisan Labs.'; }),
      S('about', s => { s.data.bio = "I started out designing posters for my college fest in Pune and never really stopped. Today I move between user research, interface design and TypeScript, because the best products come from people who can do all three.\n\nI care about accessibility, apps that work on slow networks, and interfaces that stay readable in bright sunlight, in Hindi as well as English."; }),
      S('skills', s => { s.items = [['TypeScript', 'Code', 92], ['React', 'Code', 90], ['CSS & motion', 'Code', 88], ['Node.js', 'Code', 74], ['Figma', 'Design', 94], ['Design systems', 'Design', 90], ['User research', 'Design', 78], ['Accessibility', 'Practice', 92]].map(([name, group, level]) => it('skills', { name, group, level })); }),
      S('projects', s => { s.title = 'Selected work'; s.items = [
        it('projects', { title: 'Mandi Mitra', description: 'A crop-price dashboard that turns raw mandi data into plain-language alerts for farmers in Maharashtra.', link: 'https://example.com/mandi-mitra', tags: ['Dashboard', 'React', 'Data viz'], role: 'Design lead', year: '2024', details: 'Interviewed 14 farmers and mandi agents, then rebuilt the alert flow around one question: should I sell today or wait? Alert comprehension rose from 58% to 91% in testing.' }),
        it('projects', { title: 'Yatra Offline', description: 'Offline trail maps for Himalayan trekking guides, with sync that survives two weeks without signal.', link: 'https://example.com/yatra-offline', tags: ['Mobile', 'Offline-first', 'Maps'], role: 'Front-end engineer', year: '2023', details: 'Designed a conflict-free sync model and a map style that stays legible in direct sunlight.' }),
        it('projects', { title: 'Hisaab', description: 'Invoicing for freelancers who would rather be working: three taps from job done to paid, with UPI built in.', link: 'https://example.com/hisaab', tags: ['Product', 'Branding', 'React'], role: 'Founding designer', year: '2022', details: '' }),
      ]; }),
      S('experience', s => { s.items = [it('experience', { role: 'Senior product engineer', company: 'Kisan Labs', period: '2022 – now', details: 'Lead the design system and the field-tools squad. Cut onboarding time for new field agents from two days to forty minutes.' }), it('experience', { role: 'Designer & developer', company: 'Rangoli Studio', period: '2019 – 2022', details: 'Shipped brand sites and small apps for cultural clients, from first sketch to deploy.' })]; }),
      S('education', s => { s.items = [it('education', { school: 'Savitribai Phule Pune University', degree: 'B.E. Computer Engineering', period: '2015 – 2019', details: 'Final-year project on navigation interfaces for low-connectivity environments.' })]; }),
      S('testimonials', s => { s.items = [it('testimonials', { quote: 'Aryan sees the whole product at once: the pixel, the pipeline and the person using it at 6 a.m. in a farm field.', author: 'Priya Nair', role: 'CTO, Kisan Labs' })]; }),
      S('contact'),
    ],
  };
}
const DEFAULT_TPL = { minimal: 'editorial', maximal: 'brutalist' };
function newProject({ name = 'Untitled portfolio', system = 'minimal', template, sample = true } = {}) {
  const tpl = template || DEFAULT_TPL[system], c = sample ? sampleContent() : { person: { name: '', title: '', location: '', email: '', phone: '', avatar: '', footer: '' }, socials: [], sections: ['hero', 'about', 'projects', 'contact'].map(t => newSection(t)) };
  return { v: 1, id: uid('p'), name, createdAt: Date.now(), updatedAt: Date.now(), ...c, design: makeDesign(tpl),
    seo: { title: '', description: '', lang: 'en', ogImage: '', siteUrl: '', favicon: { kind: 'letter', value: '', color: '' } },
    assets: {}, code: { html: null, css: null, js: null }, versions: [] };
}
const DOC_KEYS = ['name', 'person', 'socials', 'sections', 'design', 'seo', 'code'];
function docOf(p) { const d = {}; DOC_KEYS.forEach(k => d[k] = p[k]); return d; }
function itemTitle(s, it) { const t = SECTION_TYPES[s.type]; return (t && it[t.main]) || ('Untitled ' + (t ? t.item.toLowerCase() : 'item')); }

/* Validate & repair an imported / stored project so a bad file can't break the app */
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const sstr = (v, n = 3000) => (typeof v === 'string' ? v : (typeof v === 'number' && isFinite(v) ? String(v) : '')).slice(0, n);
const snum = (v, d, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
const safeId = (v, f) => String(v == null ? '' : v).replace(/[^\w-]/g, '').slice(0, 40) || f;
const DATA_URL_RE = /^data:(image\/(png|jpe?g|gif|webp|svg\+xml)|application\/pdf);base64,[A-Za-z0-9+\/=]+$/;
function coerceField(f, v) {
  if (f.t === 'tags') return (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []).map(x => sstr(x, 60).trim()).filter(Boolean).slice(0, 30);
  if (f.t === 'range') return snum(v, 80, 0, 100);
  return sstr(v, f.t === 'textarea' ? 20000 : 2000);
}
/* Every project that enters the app (import, storage, version restore) passes through here: types are coerced, unknown keys dropped,
   all tokens whitelisted. Nothing from a file is trusted to be well-formed or safe. */
function sanitizeProject(raw, o = {}) {
  if (!isObj(raw) || !Array.isArray(raw.sections) || !isObj(raw.person)) throw new Error('This file is not a PortfolioVerse project (missing sections or person details).');
  const base = newProject({ sample: false }), p = { ...base };
  p.id = safeId(raw.id, base.id); p.name = sstr(raw.name, 80) || 'Imported portfolio';
  p.createdAt = snum(raw.createdAt, Date.now(), 0, 4e12); p.updatedAt = o.keepStamp ? snum(raw.updatedAt, Date.now(), 0, 4e12) : Date.now();
  p.person = {}; Object.keys(base.person).forEach(k => p.person[k] = sstr(raw.person[k], 3000));
  p.socials = (Array.isArray(raw.socials) ? raw.socials : []).filter(isObj).slice(0, 30).map(x => ({ id: safeId(x.id, uid('o')), label: sstr(x.label, 60), url: sstr(x.url, 2000) }));
  const seenS = new Set();
  p.sections = raw.sections.filter(isObj).slice(0, 60).map(s => {
    const type = SECTION_TYPES[s.type] ? s.type : 'custom', n = newSection(type), t = SECTION_TYPES[type], fm = Object.fromEntries(t.fields.map(f => [f.k, f]));
    const src = isObj(s.data) ? s.data : {}, keys = t.kind === 'single' ? [...new Set([...Object.keys(n.data), ...t.fields.map(f => f.k)])] : Object.keys(n.data), data = {};
    keys.forEach(k => { data[k] = fm[k] ? coerceField(fm[k], src[k] !== undefined ? src[k] : n.data[k]) : sstr(src[k] !== undefined ? src[k] : n.data[k], 2000); });
    let id = safeId(s.id, n.id); if (seenS.has(id)) id = n.id; seenS.add(id); const seenI = new Set();
    const items = t.kind === 'single' ? [] : (Array.isArray(s.items) ? s.items : []).filter(isObj).slice(0, 500).map(i => { let iid = safeId(i.id, uid('i')); if (seenI.has(iid)) iid = uid('i'); seenI.add(iid); const it = { id: iid }; t.fields.forEach(f => it[f.k] = coerceField(f, i[f.k])); return it; });
    return { id, type, title: sstr(s.title, 120) || t.title, visible: s.visible !== false, nav: typeof s.nav === 'boolean' ? s.nav : n.nav, data, items, style: cleanSectionStyle(s.style) };
  });
  p.design = validateDesign(isObj(raw.design) ? raw.design : {});
  const rs = isObj(raw.seo) ? raw.seo : {}, rf = isObj(rs.favicon) ? rs.favicon : {};
  p.seo = { ...base.seo, title: sstr(rs.title, 160), description: sstr(rs.description, 400), siteUrl: sstr(rs.siteUrl, 500), ogImage: sstr(rs.ogImage, 500), lang: /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(rs.lang || '') ? rs.lang : 'en',
    favicon: { value: sstr(rf.value, 3), color: hexOk(rf.color) ? rf.color : base.seo.favicon.color } };
  p.assets = {}; if (!o.noAssets && isObj(raw.assets)) Object.entries(raw.assets).slice(0, 80).forEach(([k, a]) => { if (isObj(a) && typeof a.dataUrl === 'string' && a.dataUrl.length < 9e6 && DATA_URL_RE.test(a.dataUrl)) p.assets[safeId(k, uid('a'))] = { name: sstr(a.name, 120) || 'file', mime: a.dataUrl.slice(5, a.dataUrl.indexOf(';')), dataUrl: a.dataUrl, size: snum(a.size, a.dataUrl.length, 0, 1e9) }; });
  const rc = isObj(raw.code) ? raw.code : {}; p.code = { html: null, css: null, js: null }; ['html', 'css', 'js'].forEach(k => { if (typeof rc[k] === 'string' && rc[k].length < 2e6) p.code[k] = rc[k]; });
  p.versions = (Array.isArray(raw.versions) ? raw.versions : []).slice(0, 20).map(v => { try {
    if (!isObj(v)) return null; const d = typeof v.doc === 'string' ? JSON.parse(v.doc) : v.doc; if (!isObj(d)) return null;
    const sp = sanitizeProject({ person: d.person, socials: d.socials, sections: d.sections, design: d.design, seo: d.seo, code: d.code }, { noAssets: true });
    return { id: safeId(v.id, uid('v')), name: sstr(v.name, 80) || 'Version', at: snum(v.at, Date.now(), 0, 4e12), doc: JSON.stringify(docOf(sp)) }; } catch (e) { return null; } }).filter(Boolean);
  return p;
}
function deepMerge(a, b) {
  if (Array.isArray(b) || typeof b !== 'object' || b === null) return b === undefined ? a : b;
  const o = { ...a }; for (const k of Object.keys(b)) { if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; o[k] = (a && typeof a[k] === 'object' && !Array.isArray(a[k]) && a[k] !== null) ? deepMerge(a[k], b[k]) : b[k]; }
  return o;
}
