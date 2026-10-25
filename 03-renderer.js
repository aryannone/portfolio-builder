/* ===== 03-renderer: the single rendering engine (model + design -> html/css/js) ===== */
const VARIANTS = {
  nav: ['top', 'side', 'floating', 'dock', 'minimal'], hero: ['index', 'terminal', 'split', 'stack', 'big', 'overlap', 'sticker'],
  cards: ['list', 'grid', 'overlay', 'offset', 'brutal', 'sticker'], head: ['side', 'inline', 'code', 'huge'],
  decor: ['blobs', 'grain', 'grid-floor', 'sun', 'scanlines', 'shapes', 'stripes', 'cursor-glow'], bg: ['flat', 'gradient', 'mesh', 'grid', 'dots', 'grain'],
  entrance: ['none', 'fade', 'slide', 'scale', 'reveal'], hover: ['none', 'lift', 'glow', 'tilt', 'zoom', 'shift'],
};
const imgSrc = v => { const u = cleanUrl(v); return u ? u : ''; };
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const paras = t => String(t || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const fontStack = n => (FONTS[n] || FONTS.Inter).s;

function tokensCSS(p) {
  const D = p.design, P = D.palette, T = D.type, L = D.layout, C = D.components, A = D.anim;
  const shadow = { none: 'none', soft: '0 14px 34px -16px rgba(0,0,0,.35)', hard: '6px 6px 0 var(--c-border)', glow: '0 0 34px -10px var(--c-accent)' }[C.card.shadow] || 'none';
  const divH = { line: '1px', thick: '4px', none: '0px' }[C.divider] || '1px';
  const v = [['c-primary', P.primary], ['c-secondary', P.secondary], ['c-accent', P.accent], ['c-bg', P.bg], ['c-text', P.text], ['c-card', P.card], ['c-border', P.border],
    ['f-head', fontStack(T.heading)], ['f-body', fontStack(T.body)], ['fs', T.size + 'px'], ['lh', T.line], ['ls', T.spacing + 'em'], ['ls-h', (T.headSpacing / 100) + 'em'], ['fw', T.weight], ['tt', T.headCase === 'upper' ? 'uppercase' : 'none'],
    ['space', L.spacing + 'px'], ['w', L.width + 'px'], ['cols', L.cols], ['r-btn', C.btn.radius + 'px'], ['r-card', C.card.radius + 'px'], ['bw', C.card.border + 'px'], ['shadow', shadow], ['div-h', divH],
    ['dur', A.duration + 'ms'], ['stg', A.stagger ? '90ms' : '0ms'], ['dist', Math.round(A.intensity * 0.6)], ['int', (A.intensity / 100).toFixed(2)]];
  return ':root{' + v.map(([k, x]) => `--${k}:${x}`).join(';') + ';--c-muted:color-mix(in srgb,var(--c-text) 62%,var(--c-bg));--c-soft:color-mix(in srgb,var(--c-text) 6%,var(--c-bg))}\n';
}
const PADS = { xs: .4, s: .7, l: 1.4, xl: 1.9 };
function overridesCSS(p) {
  const D = p.design, out = [];
  Object.entries(D.elementStyles || {}).forEach(([path, st]) => {
    const r = []; if (!st) return;
    if (st.color) r.push('color:' + st.color); if (st.font) r.push('font-family:' + fontStack(st.font)); if (st.size) r.push('font-size:' + st.size + 'px');
    if (st.weight) r.push('font-weight:' + st.weight); if (st.align) r.push('text-align:' + st.align); if (st.ls != null && st.ls !== '') r.push('letter-spacing:' + st.ls + 'em');
    if (st.lh) r.push('line-height:' + st.lh); if (st.bg) r.push('background:' + st.bg + ';border-color:' + st.bg); if (st.radius != null && st.radius !== '') r.push('border-radius:' + st.radius + 'px');
    if (st.btnColor) r.push('color:' + st.btnColor);
    if (r.length) out.push(`.pv .x-${slug(path)}{${r.join(';')}}`);
  });
  p.sections.forEach(s => {
    const st = s.style || {}, r = [];
    if (st.bg === 'alt') r.push('--sec-bg:var(--c-soft)'); else if (st.bg === 'accent') r.push('--sec-bg:color-mix(in srgb,var(--c-accent) 14%,var(--c-bg))'); else if (st.bg === 'custom' && hexOk(st.bgColor || '')) r.push('--sec-bg:' + st.bgColor);
    if (PADS[st.pad]) r.push('--sec-pad:calc(var(--space)*' + PADS[st.pad] + ')');
    if (r.length) out.push(`.pv .x-s-${s.id}{${r.join(';')}}`);
  });
  return out.join('\n');
}
function buildCSS(p) { return '/* PortfolioVerse generated styles. Design tokens are CSS variables on :root. */\n' + tokensCSS(p) + CSS_BASE + '\n' + CSS_SKINS + '\n/* element & section overrides */\n' + overridesCSS(p) + '\n'; }

function buildJS(p) {
  const A = p.design.anim, cfg = { entrance: A.entrance, intensity: A.intensity, typewriter: !!A.typewriter, parallax: !!A.parallax };
  return '/* PortfolioVerse generated script */\n' + SITE_JS.replace('/*__CFG__*/', 'var CFG = ' + JSON.stringify(cfg) + ';') + '\n';
}

/* ---------- HTML ---------- */
function buildHTML(p, o = {}) {
  const edit = !!o.edit, D = p.design, L = D.layout, C = D.components, A = D.anim, V = p.person;
  const E = D.elementStyles || {};
  const rv = (i = 0, sec) => { const a = (sec && sec.style && sec.style.anim && sec.style.anim !== 'inherit') ? sec.style.anim : A.entrance; return a === 'none' ? '' : ` data-rv="${esc(a)}" style="--i:${i}"`; };
  const at = (path, kind, cls = '', extra = '') => {
    const st = E[path]; let c = cls; if (st && Object.keys(st).length) c += ' x-' + slug(path);
    if (kind === 'button' && st && (st.bsize === 'sm' || st.bsize === 'lg')) c += ' ' + st.bsize;
    if (kind === 'button') c += ' bh-' + ((st && st.hover) || A.hover === 'glow' ? (st && st.hover) || 'glow' : 'lift');
    return (c.trim() ? ` class="${c.trim()}"` : '') + (edit ? ` data-pv="${esc(path)}" data-k="${kind}"` : '') + extra;
  };
  const val = path => getVal(p, path);
  const txt = (path, tag, cls = '', extra = '') => { const v = val(path); if (blank(v)) return ''; return `<${tag}${at(path, 'text', cls, extra)}>${esc(v)}</${tag}>`; };
  const link = (path, href, cls) => { const u = cleanUrl(href); return u ? u : '#'; };
  const ext = u => /^https?:/.test(u) ? ' target="_blank" rel="noopener noreferrer"' : '';
  const btnCls = (extra = '') => `btn btn-${C.btn.style} ${C.btn.size === 'sm' ? 'sm' : C.btn.size === 'lg' ? 'lg' : ''} ${extra}`;
  const button = (sid, field, urlField) => {
    const s = findSection(p, sid), d = s.data, text = d[field]; if (blank(text)) return '';
    let u = link('', d[urlField]); const path = `s/${sid}/data/${field}`;
    /* No link set: point the button somewhere useful instead of "#" (a button that does nothing). Primary -> your work, secondary -> contact. */
    if (!u || u === '#') { const want = field === 'cta' ? ['projects', 'research', 'experience', 'about', 'skills'] : ['contact']; const t = want.map(ty => p.sections.find(x => x.type === ty && x.visible && sectionRenders(x, p))).find(Boolean); if (t) u = '#sec-' + t.id; }
    return `<a${at(path, 'button', btnCls(), (edit ? ` data-link="s/${sid}/data/${urlField}"` : '') + ` href="${esc(u)}"${ext(u)}`)}>${esc(text)}</a>`;
  };
  const avatar = (cls = '') => {
    const src = imgSrc(V.avatar);
    return src ? `<img${at('person/avatar', 'image', 'avatar ' + cls, ` src="${esc(src)}" alt="Portrait of ${esc(V.name)}" width="480" height="480" data-parallax="0.3"`)}>`
      : `<div${at('person/avatar', 'image', 'avatar ' + cls, ' role="img" aria-label="Initials of ' + esc(V.name) + '"')}>${esc(initials(V.name))}</div>`;
  };
  const sectionHead = s => `<div class="sec-head rv"${rv(0, s)}><h2 id="h-${s.id}"${at(`s/${s.id}/title`, 'text')}>${esc(s.title)}</h2></div>`;
  const wrapSec = (s, inner, cls = '') => {
    const st = s.style || {}; let c = `sec sec-${s.type} hd-${L.head} cv-${L.cards} ${cls}`;
    if (st.layout && st.layout !== 'default') c += ' lay-' + st.layout;
    if (L.secBg === 'alt') c += ' secbg-alt'; if (L.secBg === 'stripe') c += ' secbg-stripe';
    if (st.bg && st.bg !== 'none' || PADS[st.pad]) c += ' x-s-' + s.id;
    return `<section id="sec-${s.id}" class="${c}" aria-labelledby="h-${s.id}"${edit ? ` data-pv="s/${s.id}" data-k="section"` : ''}><div class="wrap">${sectionHead(s)}<div class="sec-body">${inner}</div></div></section>`;
  };

  /* hero variants */
  const hero = s => {
    const d = s.data, hid = s.id, name = V.name || 'Your name';
    const words = (V.title || '').split('|').map(x => x.trim()).filter(Boolean).join('|');
    const roleAttr = (A.typewriter && (!edit || o.animate) && words) ? ` data-typewriter="${esc(words)}"` : '';
    const role = V.title ? `<p${at('person/title', 'text', 'hero-role rv', roleAttr + rv(0, s))}>${esc(V.title)}</p>` : '';
    const nameEl = (inner) => `<h1${at('person/name', 'text', 'name rv', rv(1, s))}>${inner == null ? esc(name) : inner}</h1>`;
    const statement = txt(`s/${hid}/data/headline`, 'p', 'hero-statement rv', rv(2, s));
    const sub = txt(`s/${hid}/data/sub`, 'p', 'hero-sub rv', rv(3, s));
    const b1 = button(hid, 'cta', 'ctaUrl'), b2 = button(hid, 'cta2', 'cta2Url');
    const cta = (b1 || b2) ? `<div class="hero-cta rv"${rv(4, s)}>${b1}${b2 ? b2.replace('btn btn-' + C.btn.style, 'btn btn-' + (C.btn.style === 'outline' ? 'ghost' : 'outline')) : ''}</div>` : '';
    const loc = V.location ? `<div class="hero-contact rv"${rv(5, s)}><span${at('person/location', 'text')}>${esc(V.location)}</span></div>` : '';
    let inner;
    switch (L.hero) {
      case 'index': inner = `<div class="wrap">${role}${nameEl()}<div class="hero-cols"><div>${statement}</div><div>${sub}${cta}${loc}</div></div></div>`; break;
      case 'terminal': inner = `<div class="wrap"><div class="term rv"${rv(0, s)}><div class="term-bar"><i></i><i></i><i></i><span>~/${esc(slug(name).toLowerCase())}</span></div><div class="term-body"><div class="ln"><b>$</b> whoami</div>${nameEl()}<div class="ln"><b>$</b> cat role.txt</div>${role.replace('hero-role rv', 'hero-role rv')}<div class="ln"><b>$</b> cat about.md</div>${statement}${sub}<div class="ln"><b>$</b> ./contact --open</div>${cta}</div></div></div>`; break;
      case 'stack': inner = `<div class="wrap"><div class="hero-grid">${avatar()}${role}${nameEl()}${statement}${sub}${cta}${loc}</div></div>`; break;
      case 'big': inner = `<div class="wrap">${role}${nameEl()}<div class="hero-grid"><div>${statement}${sub}${cta}${loc}</div>${avatar()}</div></div>`; break;
      case 'overlap': inner = `<div class="wrap"><div class="hero-grid">${avatar()}${role}${nameEl()}${statement}${sub}${cta}${loc}</div></div>`; break;
      case 'sticker': inner = `<div class="wrap"><div class="hero-grid"><div>${role}${nameEl(name.split(' ').map(w => `<span class="w" aria-hidden="true">${[...w].map(ch => `<span>${esc(ch)}</span>`).join('')}</span>`).join(' ')).replace('<h1', `<h1 aria-label="${esc(name)}"`)}${statement}${sub}${cta}${loc}</div>${avatar()}</div></div>`; break;
      default: inner = `<div class="wrap"><div class="hero-grid"><div class="hero-text">${role}${nameEl()}${statement}${sub}${cta}${loc}</div>${avatar()}</div></div>`;
    }
    return `<section id="sec-${s.id}" class="hero hr-${L.hero} ${L.image === 'left' ? 'img-left' : ''} sec-hero${(s.style && (s.style.bg !== undefined && s.style.bg !== 'none' || PADS[s.style.pad])) ? ' x-s-' + s.id : ''}" aria-label="Introduction"${edit ? ` data-pv="s/${s.id}" data-k="section"` : ''}>${inner}</section>`;
  };
  const marquee = () => {
    if (!A.marquee) return '';
    const sk = p.sections.filter(s => s.type === 'skills' && sectionRenders(s, p)).flatMap(s => s.items.map(i => i.name).filter(Boolean));
    const w = (sk.length ? sk : [V.title, V.name].filter(Boolean)).slice(0, 12); if (!w.length) return '';
    const row = w.map(x => `<span>${esc(x)}</span>`).join('');
    return `<div class="marquee" aria-hidden="true"><div class="track">${row}${row}</div></div>`;
  };

  /* item section renderers */
  const ip = (s, it, f) => `s/${s.id}/i/${it.id}/${f}`;
  const itxt = (s, it, f, tag, cls = '', extra = '') => txt(ip(s, it, f), tag, cls, extra);
  const iAt = (s, it, cls, extra = '') => at(`s/${s.id}/i/${it.id}`, 'card', cls, extra);
  const lnk = (s, it, f, label) => { const u = cleanUrl(it[f]); return u ? `<a${edit ? ` data-pv="${ip(s, it, f)}" data-k="link"` : ''} href="${esc(u)}"${ext(u)}>${esc(label)}</a>` : ''; };

  const projects = s => {
    const tags = [...new Set(s.items.flatMap(i => i.tags || []))];
    const filters = tags.length > 2 ? `<div class="filters rv" role="group" aria-label="Filter projects by tag"><button type="button" aria-pressed="true" data-tag="">All</button>${tags.map(t => `<button type="button" aria-pressed="false" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : '';
    const cards = s.items.filter(it => !blank(it.title) || !blank(it.description)).map((it, n) => {
      const st = E[`s/${s.id}/i/${it.id}`] || {}, src = imgSrc(it.image);
      const media = src ? `<a class="card-media" href="${esc(cleanUrl(it.link) || '#')}"${edit ? ` tabindex="-1"` : ''}${ext(cleanUrl(it.link) || '')}><img${at(ip(s, it, 'image'), 'image', '', ` src="${esc(src)}" alt="${esc(it.imageAlt || it.title)}" loading="lazy"`)}></a>`
        : `<div class="card-media"${edit ? ` data-pv="${ip(s, it, 'image')}" data-k="image"` : ''}><div class="ph" aria-hidden="true">${esc(initials(it.title))}</div></div>`;
      const meta = (it.year || it.role) ? `<div class="meta">${it.year ? itxt(s, it, 'year', 'span') : ''}${it.role ? itxt(s, it, 'role', 'span') : ''}</div>` : '';
      const tg = (it.tags || []).length ? `<ul class="tags" aria-label="Tags">${it.tags.map(t => `<li class="chip">${esc(t)}</li>`).join('')}</ul>` : '';
      const l = lnk(s, it, 'link', 'View project');
      const det = it.details ? `<details class="case"><summary>Case study</summary>${paras(it.details).map(x => `<p>${esc(x)}</p>`).join('')}</details>` : '';
      const cls = `card rv hv-${st.hover || C.card.hover}${st.layout === 'featured' ? ' c-feat' : ''}${st.layout === 'horizontal' ? ' c-h' : ''}`;
      return `<article${iAt(s, it, cls, ` data-tags="${esc((it.tags || []).join('|'))}"${rv(n, s)}`)}>${media}<div class="card-body">${meta}${itxt(s, it, 'title', 'h3')}${itxt(s, it, 'description', 'p')}${tg}${(l || det) ? `<div class="card-links">${l}</div>${det}` : ''}</div></article>`;
    }).join('');
    return filters + `<div class="cards">${cards}</div>`;
  };
  const custom = s => `<div class="cards">${s.items.filter(it => !blank(it.title) || !blank(it.text)).map((it, n) => {
    const src = imgSrc(it.image), l = lnk(s, it, 'link', 'Learn more');
    return `<article${iAt(s, it, `card rv hv-${(E[`s/${s.id}/i/${it.id}`] || {}).hover || C.card.hover}`, rv(n, s))}>${src ? `<div class="card-media"><img${at(ip(s, it, 'image'), 'image', '', ` src="${esc(src)}" alt="${esc(it.imageAlt || it.title)}" loading="lazy"`)}></div>` : ''}<div class="card-body">${itxt(s, it, 'title', 'h3')}${(it.text ? paras(it.text) : []).length ? `<div${at(ip(s, it, 'text'), 'text', '', ' data-multi="1"')}>${paras(it.text).map(x => `<p>${esc(x)}</p>`).join('')}</div>` : ''}${l ? `<div class="card-links">${l}</div>` : ''}</div></article>`;
  }).join('')}</div>`;
  const timeline = (s, main, sub) => s.items.filter(it => !blank(it[main]) || !blank(it[sub])).map((it, n) => `<article${iAt(s, it, 'tl rv', rv(n, s))}><div class="tl-when">${esc(it.period)}</div><div>${itxt(s, it, main, 'h3')}${itxt(s, it, sub, 'p', 'sub')}${itxt(s, it, 'details', 'p')}</div></article>`).join('');
  const rows = (s, titleF, metaF, descF, urlF) => s.items.filter(it => !blank(it[titleF])).map((it, n) => {
    const u = urlF ? cleanUrl(it[urlF]) : '', h = itxt(s, it, titleF, 'h3');
    const desc = descF && it[descF] ? itxt(s, it, descF, 'p') : '';
    const when = metaF.map(f => it[f]).filter(Boolean).map(esc).join(' · ');
    return `<article${iAt(s, it, 'row rv', rv(n, s))}>${u ? `<a href="${esc(u)}"${ext(u)}>${h}</a>` : `<div>${h}</div>`}<span class="when">${when}</span>${desc}</article>`;
  }).join('');
  const skills = s => {
    const groups = {}; s.items.filter(i => !blank(i.name)).forEach(i => (groups[i.group || ''] = groups[i.group || ''] || []).push(i));
    return Object.entries(groups).map(([g, items]) => `<div class="skill-group">${g ? `<h3>${esc(g)}</h3>` : ''}<ul class="skills">${items.map((i, n) => `<li${iAt(s, i, 'skill rv', ` style="--lvl:${clamp(+i.level || 0, 0, 100)}%;--i:${n}"` + (A.entrance === 'none' ? '' : ` data-rv="${A.entrance}"`))}>${esc(i.name)}${i.level > 0 && i.level <= 100 ? '<i></i>' : ''}</li>`).join('')}</ul></div>`).join('');
  };
  const SECTION_HTML = {
    about: s => { const src = imgSrc(s.data.image), b = paras(s.data.bio); return `<div class="about-grid${src ? '' : ' noimg'}"><div${at(`s/${s.id}/data/bio`, 'text', 'about-text rv', ' data-multi="1"' + rv(0, s))}>${b.map(x => `<p>${esc(x)}</p>`).join('')}</div>${src ? `<img${at(`s/${s.id}/data/image`, 'image', 'about-img rv', ` src="${esc(src)}" alt="${esc(s.data.imageAlt || 'Photo of ' + V.name)}" loading="lazy"` + rv(1, s))}>` : ''}</div>`; },
    skills, projects, custom,
    experience: s => timeline(s, 'role', 'company'), education: s => timeline(s, 'school', 'degree'),
    achievements: s => rows(s, 'title', ['year'], 'detail'), certifications: s => rows(s, 'name', ['issuer', 'year'], null, 'url'),
    publications: s => rows(s, 'title', ['venue', 'year'], null, 'url'), research: s => rows(s, 'title', [], 'summary', 'url'), blog: s => rows(s, 'title', ['date'], 'summary', 'url'),
    testimonials: s => `<div class="quotes">${s.items.filter(i => !blank(i.quote)).map((i, n) => `<figure${iAt(s, i, 'quote rv', rv(n, s))}><blockquote${at(ip(s, i, 'quote'), 'text')}>${esc(i.quote)}</blockquote><figcaption>${itxt(s, i, 'author', 'strong')}${i.role ? ' — ' + esc(i.role) : ''}</figcaption></figure>`).join('')}</div>`,
    services: s => `<div class="svc-grid">${s.items.filter(i => !blank(i.title)).map((i, n) => `<article${iAt(s, i, `svc rv hv-${C.card.hover}`, rv(n, s))}>${itxt(s, i, 'title', 'h3')}${itxt(s, i, 'description', 'p')}${i.price ? itxt(s, i, 'price', 'p', 'price') : ''}</article>`).join('')}</div>`,
    hobbies: s => `<ul class="skills">${s.items.filter(i => !blank(i.name)).map((i, n) => `<li${iAt(s, i, 'skill rv', rv(n, s))}>${esc(i.name)}${i.note ? ` <span class="muted">· ${esc(i.note)}</span>` : ''}</li>`).join('')}</ul>`,
    resume: s => { const u = cleanUrl(s.data.url); return `<div class="callout rv"${rv(0, s)}>${txt(`s/${s.id}/data/text`, 'p')}<a${at(`s/${s.id}/data/button`, 'button', btnCls(), (edit ? ` data-link="s/${s.id}/data/url"` : '') + ` href="${esc(u || '#')}"${ext(u || '')}${/^asset:/.test(u) ? ' download' : ''}`)}>${esc(s.data.button || 'Download résumé')}</a></div>`; },
    contact: s => {
      const soc = p.socials.filter(x => cleanUrl(x.url)), mail = isEmail(V.email) ? V.email.trim() : '';
      return `<div class="contact-grid"><div class="rv"${rv(0, s)}>${txt(`s/${s.id}/data/text`, 'p', 'hero-sub')}${mail ? `<a${at('person/email', 'link', 'contact-mail', ` href="mailto:${esc(mail)}"`)}>${esc(mail)}</a>` : ''}<div class="contact-list">${V.phone ? `<span${at('person/phone', 'text')}>${esc(V.phone)}</span>` : ''}${V.location ? `<span>${esc(V.location)}</span>` : ''}</div>${soc.length ? `<div class="socials">${soc.map(x => `<a${edit ? ` data-pv="soc/${x.id}/label" data-k="text"` : ''} href="${esc(cleanUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.label || cleanUrl(x.url))}</a>`).join('')}</div>` : ''}</div>${mail ? `<form class="form rv" data-mailto="${esc(mail)}"${rv(1, s)}><label>Your name<input name="name" required autocomplete="name"></label><label>Your email<input name="from" type="email" required autocomplete="email"></label><label>Message<textarea name="message" required></textarea></label><button class="${btnCls()}" type="submit">${esc(s.data.formLabel || 'Send message')}</button></form>` : ''}</div>`;
    },
  };

  const live = p.sections.filter(s => sectionRenders(s, p));
  const nav = (() => {
    const links = live.filter(s => s.nav && s.type !== 'hero').slice(0, 7);
    return `<header class="nav nv-${L.nav}"${edit ? ' data-pv="nav" data-k="nav"' : ''}><a${at('person/name', 'text', 'brand', ' href="#main"')}>${esc(V.name || 'Portfolio')}</a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Toggle menu"><span></span><span></span><span></span></button><nav id="nav-links" class="nav-links" aria-label="Primary">${links.map(s => `<a href="#sec-${s.id}">${esc(s.title)}</a>`).join('')}</nav></header>`;
  })();
  const decorHTML = () => {
    const m = { blobs: '<div class="d-blobs"><i></i><i></i><i></i></div>', grain: '<div class="d-grain"></div>', 'grid-floor': '<div class="d-grid-floor"></div>', sun: '<div class="d-sun"></div>', scanlines: '<div class="d-scanlines"></div>', shapes: '<div class="d-shapes"><b></b><b></b><b></b><b></b></div>', stripes: '<div class="d-stripes"></div>', 'cursor-glow': '<div class="d-glow"></div>' };
    const h = (D.decor || []).map(x => m[x] || '').join(''); return h ? `<div class="decor" aria-hidden="true">${h}</div>` : '';
  };
  let main = '', heroDone = false;
  live.forEach(s => {
    if (s.type === 'hero') { main += hero(s) + (!heroDone ? marquee() : ''); heroDone = true; return; }
    const fn = SECTION_HTML[s.type] || SECTION_HTML.custom;
    main += wrapSec(s, fn(s));
  });
  const cls = ['pv', 't-' + D.template, 'bg-' + D.bg, L.nav === 'side' ? 'has-side' : '', L.nav === 'dock' ? 'has-dock' : '', 'nl-' + C.navLink, 'ib-' + C.imageBorder].filter(Boolean).join(' ');
  const foot = V.footer ? `<footer><p${at('person/footer', 'text', '', '')}>${esc(V.footer)}</p></footer>` : '<footer></footer>';
  return `<div class="${esc(cls)}" id="top"><a class="skip" href="#main">Skip to content</a>\n${decorHTML()}\n${A.progress ? '<div class="progress" aria-hidden="true"></div>\n' : ''}${nav}\n<main id="main">\n${main}\n</main>\n${foot}</div>\n`;
}

/* ---------- Code: generated vs manual overrides (one source of truth for preview AND export) ---------- */
let _genCache = { key: '', val: null };
function generated(p) {
  const key = JSON.stringify([p.person, p.socials, p.sections, p.design]);
  if (_genCache.key === key) return _genCache.val;
  const val = { html: buildHTML(p), css: buildCSS(p), js: buildJS(p) };
  _genCache = { key, val }; return val;
}
function effectiveCode(p) {
  const g = generated(p), c = p.code || {};
  return { html: c.html != null ? c.html : g.html, css: c.css != null ? c.css : g.css, js: c.js != null ? c.js : g.js, manual: { html: c.html != null, css: c.css != null, js: c.js != null } };
}
function usedFonts(p) {
  const D = p.design, set = [D.type.heading, D.type.body];
  Object.values(D.elementStyles || {}).forEach(s => s && s.font && set.push(s.font));
  if ((D.decor || []).length || D.template === 'developer' || D.layout.hero === 'terminal') set.push('JetBrains Mono');
  if (D.template === 'retro-futuristic') set.push('VT323');
  return [...new Set(set)].filter(n => FONTS[n]);
}

/* Assets: tokens `asset:ID` are resolved at assembly time so code stays readable */
function assetFileName(id, a) { return id + '-' + String(a.name || 'file').replace(/[^\w.-]+/g, '_').slice(-40); }
function resolveAssets(str, p, mode) {
  return str.replace(/asset:([\w-]+)/g, (m, id) => { const a = p.assets[id]; if (!a) return ''; return mode === 'path' ? 'assets/' + assetFileName(id, a) : a.dataUrl; });
}
function faviconHref(p) {
  const f = p.seo.favicon || {}, ch = (f.value || p.person.name || 'P').trim().slice(0, 2), col = hexOk(f.color || '') ? f.color : p.design.palette.accent;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${col}"/><text x="32" y="43" font-size="${ch.length > 1 ? 30 : 38}" font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle" fill="#fff">${esc(ch)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
const jsonSafe = o => JSON.stringify(o).replace(/</g, '\\u003c');

/* Assemble a complete HTML document. mode: 'preview' (bridge, click-to-edit) | 'export' | 'thumb' (no scripts) */
/* Previews are srcdoc iframes. A fragment link such as href="#work" inside one resolves against the PARENT page's URL, so a click
   used to navigate the frame to PortfolioVerse itself. Every embedded document therefore (1) pins its base URL to itself and
   (2) handles in-page anchors on its own and never lets a click leave the frame. Standalone exports contain none of this. */
const EMBED_GUARD = `(function(){document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';
if(h.charAt(0)==='#'){e.preventDefault();var id=h.slice(1);try{id=decodeURIComponent(id)}catch(x){}var t=id&&document.getElementById(id);var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
if(t)t.scrollIntoView({behavior:rm?'auto':'smooth'});else window.scrollTo(0,0);return}
e.preventDefault();if(/^(https?:|\\/\\/)/i.test(h)){try{parent.postMessage({pv:1,t:'link',href:h.slice(0,200)},'*')}catch(x){}}},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'){try{parent.postMessage({pv:1,t:'esc'},'*')}catch(x){}}});})();`;
function assembleDocument(p, o = {}) {
  const mode = o.mode || 'export', code = o.code || effectiveCode(p);
  let html = code.html, css = code.css, js = code.js;
  const am = o.assetMode || 'embed';
  html = resolveAssets(html, p, am); css = resolveAssets(css, p, am); js = resolveAssets(js, p, am);
  const S = p.seo, name = p.person.name || p.name, title = S.title || [name, p.person.title && p.person.title.split('|')[0].trim()].filter(Boolean).join(' — ');
  const heroS = p.sections.find(s => s.type === 'hero'), about = p.sections.find(s => s.type === 'about');
  const desc = S.description || (heroS && heroS.data.headline) || (about && paras(about.data.bio)[0]) || ('Portfolio of ' + name);
  const fontUrl = o.fonts === false ? '' : googleFontsUrl(usedFonts(p));
  const og = cleanUrl(S.ogImage) && !/^asset:/.test(S.ogImage) ? cleanUrl(S.ogImage) : '';
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name, jobTitle: p.person.title || undefined, email: isEmail(p.person.email) ? 'mailto:' + p.person.email : undefined, address: p.person.location || undefined, sameAs: p.socials.map(x => cleanUrl(x.url)).filter(Boolean) };
  const emb = (o.embedded || mode === 'preview') && mode !== 'thumb';
  const head = [`<meta charset="utf-8">`, emb ? `<base href="about:srcdoc">` : '', `<meta name="viewport" content="width=device-width,initial-scale=1">`, `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc.slice(0, 200))}">`, `<meta name="theme-color" content="${esc(p.design.palette.bg)}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:title" content="${esc(title)}">`, `<meta property="og:description" content="${esc(desc.slice(0, 200))}">`,
    og ? `<meta property="og:image" content="${esc(og)}">` : '', S.siteUrl && cleanUrl(S.siteUrl) ? `<meta property="og:url" content="${esc(cleanUrl(S.siteUrl))}"><link rel="canonical" href="${esc(cleanUrl(S.siteUrl))}">` : '',
    `<meta name="twitter:card" content="${og ? 'summary_large_image' : 'summary'}">`, `<link rel="icon" href="${faviconHref(p)}">`,
    fontUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fontUrl}">` : '',
    mode === 'export' ? `<script type="application/ld+json">${jsonSafe(ld)}</script>` : '', `<style>\n${css}</style>`].filter(Boolean).join('\n');
  let scripts = '';
  if (mode === 'preview') scripts = `<script>window.__PV=${jsonSafe({ scroll: o.scroll || 0, selected: o.selected || null, animate: !!o.animate })};</script><script>${BRIDGE_JS}</script><script>\n${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  else if (mode === 'export') scripts = `<script>\n${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  if (emb) scripts += `<script>${EMBED_GUARD}</script>`;
  return `<!DOCTYPE html>\n<html lang="${esc(S.lang || 'en')}">\n<head>\n${head}\n</head>\n<body>\n${html}${scripts}\n</body>\n</html>\n`;
}

function previewCode(p, animate) { const c = effectiveCode(p); if (!c.manual.html) c.html = buildHTML(p, { edit: true, animate: !!animate }); return c; }
