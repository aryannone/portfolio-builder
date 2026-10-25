/* ===== 10-workspace: editor screen, panels, inspector, Make It Yours ===== */
const TABS = { content: ['Content', 'edit'], sections: ['Sections', 'layers'], design: ['Design', 'sliders'], motion: ['Motion', 'play'], miy: ['Make it yours', 'spark'] };
const tabsFor = mode => mode === 'customize' ? ['design', 'motion', 'miy'] : ['content', 'sections', 'design', 'motion', 'miy'];
const acc = (key, title, body, def) => { const open = S.ui.openGroup[key] != null ? S.ui.openGroup[key] : def; return `<section class="acc ${open ? 'open' : ''}"><button class="acc-h" data-act="accgroup" data-key="${key}" aria-expanded="${open}"><span>${title}</span>${ico('chev', 16)}</button><div class="acc-b">${open ? body : ''}</div></section>`; };

/* ---- Content panel ---- */
function itemFieldsHTML(sec, it) { return SECTION_TYPES[sec.type].fields.map(f => fld(f, it[f.k], `s/${sec.id}/i/${it.id}/${f.k}`)).join(''); }
function contentPanelHTML() {
  const p = S.project;
  const person = acc('person', 'Personal details', `<div class="fgrid">${PERSON_FIELDS.map(x => fld(x, p.person[x.k], 'person/' + x.k)).join('')}</div>${fld(F('footer', 'Footer text'), p.person.footer, 'person/footer')}<h4 class="sh">Social links</h4>${p.socials.map(x => `<div class="socrow" data-fld="soc/${x.id}"><select data-bind="soc/${x.id}/label" data-t="str" aria-label="Network">${[...new Set([...SOCIAL_NETWORKS, x.label])].map(n => `<option ${n === x.label ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><input data-bind="soc/${x.id}/url" data-t="url" placeholder="https://…" inputmode="url" autocapitalize="off" value="${esc(x.url)}" aria-label="Link" ${x.url && cleanUrl(x.url) === null ? 'aria-invalid="true"' : ''}><button class="iconbtn" data-act="delsoc" data-id="${x.id}" aria-label="Remove link">${ico('trash', 17)}</button></div>`).join('')}<button class="btn sm" data-act="addsoc">${ico('plus', 15)} Add link</button>`, true);
  const secs = p.sections.map(s => {
    const t = SECTION_TYPES[s.type], open = S.ui.openSec[s.id], empty = sectionEmpty(s, p);
    let body = fld(F('title', 'Section title (also used in the menu)'), s.title, `s/${s.id}/title`);
    if (t.kind === 'single') body += t.fields.map(f => fld(f, s.data[f.k], `s/${s.id}/data/${f.k}`)).join('');
    else body += s.items.map((it, n) => { const io = S.ui.openItem[it.id]; return `<div class="item ${io ? 'open' : ''}" data-fld="s/${s.id}/i/${it.id}"><div class="item-h"><button class="item-t" data-act="itemopen" data-id="${it.id}" aria-expanded="${!!io}">${ico('chev', 15)}<span>${esc(itemTitle(s, it))}</span></button><span class="item-a"><button class="iconbtn" data-act="itemmove" data-sid="${s.id}" data-id="${it.id}" data-d="-1" ${n === 0 ? 'disabled' : ''} aria-label="Move up">${ico('up', 16)}</button><button class="iconbtn" data-act="itemmove" data-sid="${s.id}" data-id="${it.id}" data-d="1" ${n === s.items.length - 1 ? 'disabled' : ''} aria-label="Move down">${ico('down', 16)}</button><button class="iconbtn" data-act="itemdup" data-sid="${s.id}" data-id="${it.id}" aria-label="Duplicate">${ico('copy', 16)}</button><button class="iconbtn" data-act="itemdel" data-sid="${s.id}" data-id="${it.id}" aria-label="Delete">${ico('trash', 16)}</button></span></div>${io ? `<div class="item-b">${itemFieldsHTML(s, it)}</div>` : ''}</div>`; }).join('') + `<button class="btn sm" data-act="itemadd" data-sid="${s.id}">${ico('plus', 15)} Add ${esc(t.item.toLowerCase())}</button>`;
    return `<section class="acc sec ${open ? 'open' : ''} ${s.visible ? '' : 'off'}" data-fld="s/${s.id}"><div class="acc-hr"><button class="acc-h" data-act="secopen" data-id="${s.id}" aria-expanded="${!!open}"><span>${t.icon} ${esc(s.title)} <small class="muted">${!s.visible ? 'hidden' : empty ? 'empty · not shown' : ''}</small></span>${ico('chev', 16)}</button></div><div class="acc-b">${open ? body : ''}</div></section>`;
  }).join('');
  return person + `<h4 class="sh">Sections</h4>` + secs;
}

/* ---- Design panel ---- */
function designPanelHTML() {
  const D = S.project.design, P = D.palette, T = D.type, L = D.layout, C = D.components, tpl = TEMPLATES[D.template];
  const sw = (D.system === 'minimal' ? [...PALETTES.light, ...PALETTES.dark.slice(0, 2)] : [...PALETTES.bold, ...PALETTES.dark.slice(1, 3)]).map(([n, ...c]) => `<button class="swatch" data-act="palette" data-c="${c.join(',')}" aria-label="Apply ${n} palette" title="${n}"><i style="background:${c[3]}"></i><i style="background:${c[2]}"></i><i style="background:${c[0]}"></i><i style="background:${c[1]}"></i></button>`).join('');
  const fnts = fontOpts();
  return `<div class="tplrow"><div><small class="muted">Template</small><strong>${tpl.name}</strong> <span class="tag ${D.system}">${D.system}</span></div><button class="btn sm" data-act="goto" data-to="/gallery">${ico('grid', 15)} Change</button></div>
  <div class="segs two" role="group" aria-label="Design system"><button class="seg ${D.system === 'minimal' ? 'on' : ''}" data-act="setsystem" data-s="minimal">Minimal</button><button class="seg ${D.system === 'maximal' ? 'on' : ''}" data-act="setsystem" data-s="maximal">Maximal</button></div>
  ${acc('palette', 'Colors', `<div class="swatches">${sw}</div><div class="fgrid2">${PALETTE_KEYS.map(k => clr(k[0].toUpperCase() + k.slice(1), 'design.palette.' + k, P[k])).join('')}</div>`, true)}
  ${acc('type', 'Typography', `${sel('Heading font', 'design.type.heading', T.heading, fnts)}${sel('Body font', 'design.type.body', T.body, fnts)}${rng('Base size', 'design.type.size', T.size, 13, 24, 1, 'px')}${sel('Heading weight', 'design.type.weight', T.weight, [400, 500, 600, 700, 800, 900], { t: 'num' })}${rng('Line height', 'design.type.line', T.line, 1.2, 2, .05)}${rng('Letter spacing', 'design.type.spacing', T.spacing, -.05, .2, .005, 'em')}${rng('Heading tracking', 'design.type.headSpacing', T.headSpacing, -6, 10, 1, '')}${sel('Heading case', 'design.type.headCase', T.headCase, [['none', 'As typed'], ['upper', 'UPPERCASE']])}`)}
  ${acc('layout', 'Layout', `${rng('Section spacing', 'design.layout.spacing', L.spacing, 32, 220, 4, 'px')}${rng('Content width', 'design.layout.width', L.width, 720, 1400, 20, 'px')}${rng('Grid columns', 'design.layout.cols', L.cols, 1, 4, 1)}${sel('Hero layout', 'design.layout.hero', L.hero, VARIANTS.hero)}${sel('Hero image side', 'design.layout.image', L.image, [['right', 'Right'], ['left', 'Left']])}${sel('Navigation', 'design.layout.nav', L.nav, VARIANTS.nav)}${sel('Project cards', 'design.layout.cards', L.cards, VARIANTS.cards)}${sel('Section headings', 'design.layout.head', L.head, VARIANTS.head)}${sel('Section backgrounds', 'design.layout.secBg', L.secBg, [['none', 'Plain'], ['alt', 'Alternating tint'], ['stripe', 'Ruled']])}`)}
  ${acc('comp', 'Components', `${sel('Button style', 'design.components.btn.style', C.btn.style, ['solid', 'outline', 'ghost', 'brutal'])}${rng('Button radius', 'design.components.btn.radius', C.btn.radius, 0, 40, 1, 'px')}${sel('Button size', 'design.components.btn.size', C.btn.size, [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']])}${rng('Card radius', 'design.components.card.radius', C.card.radius, 0, 40, 1, 'px')}${sel('Card shadow', 'design.components.card.shadow', C.card.shadow, ['none', 'soft', 'hard', 'glow'])}${rng('Border width', 'design.components.card.border', C.card.border, 0, 6, 1, 'px')}${sel('Card hover', 'design.components.card.hover', C.card.hover, VARIANTS.hover)}${sel('Nav link style', 'design.components.navLink', C.navLink, ['plain', 'underline', 'pill', 'bracket'])}${sel('Dividers', 'design.components.divider', C.divider, ['line', 'thick', 'none'])}${sel('Image borders', 'design.components.imageBorder', C.imageBorder, ['none', 'thin', 'thick', 'frame'])}`)}
  ${acc('bg', 'Background & decoration', `${sel('Background', 'design.bg', D.bg, VARIANTS.bg)}<div class="chips" role="group" aria-label="Decorative elements">${VARIANTS.decor.map(x => `<button class="seg ${(D.decor || []).includes(x) ? 'on' : ''}" data-act="decor" data-d="${x}" aria-pressed="${(D.decor || []).includes(x)}">${x}</button>`).join('')}</div>`)}`;
}
function motionPanelHTML() {
  const A = S.project.design.anim;
  return `<p class="muted sm">Motion is switched off automatically for visitors who prefer reduced motion.</p>${sel('Entrance animation', 'design.anim.entrance', A.entrance, [['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide'], ['scale', 'Scale'], ['reveal', 'Reveal']])}${chk('Stagger children', 'design.anim.stagger', A.stagger)}${rng('Duration', 'design.anim.duration', A.duration, 100, 2000, 50, 'ms')}${rng('Intensity', 'design.anim.intensity', A.intensity, 0, 100, 5, '%')}${sel('Hover effect', 'design.anim.hover', A.hover, [['none', 'None'], ['lift', 'Lift'], ['glow', 'Glow'], ['tilt', 'Tilt'], ['zoom', 'Image zoom'], ['shift', 'Hard shift']])}
  ${chk('Skills marquee band', 'design.anim.marquee', A.marquee)}${chk('Typewriter job title (use “A | B | C” for several)', 'design.anim.typewriter', A.typewriter)}${chk('Parallax', 'design.anim.parallax', A.parallax)}${chk('Scroll progress bar', 'design.anim.progress', A.progress)}<button class="btn sm" data-act="replay">${ico('play', 15)} Replay animations</button>`;
}

/* ---- Make It Yours ---- */
const MIY_PRESETS = ['professional', 'creative', 'minimal', 'experimental', 'colorful', 'elegant', 'futuristic', 'editorial', 'playful', 'bold'];
function varThumb(design) { const p = S.project; return `<div class="tf" data-vdoc="${esc(JSON.stringify(design.template))}" data-var="1"><iframe sandbox title="Variation preview" tabindex="-1" aria-hidden="true"></iframe></div>`; }
function miyPanelHTML() {
  const vs = S.variations;
  if (!vs.length) {
    return `<div class="miy-hero"><h3>${ico('spark', 18)} Make it yours</h3><p>Restyle your portfolio without touching a word of your content. Your current design is always kept and one tap away.</p></div>
    ${S.lastApplied ? `<div class="notice ok">Design applied. <button class="btn sm" data-act="undo">${ico('undo', 15)} Undo</button></div>` : ''}
    ${S.varMsg ? `<div class="notice warn"><p>${esc(S.varMsg.message)}</p><div class="chips">${(S.varMsg.suggestions || []).map(k => `<button class="seg" data-act="miypreset" data-k="${k}">${esc(PRESETS[k].label)}</button>`).join('')}</div></div>` : ''}
    <h4 class="sh">Start from a direction</h4><div class="presets">${MIY_PRESETS.map(k => `<button class="preset" data-act="miypreset" data-k="${k}"><strong>${PRESETS[k].label}</strong><small>${PRESETS[k].desc}</small></button>`).join('')}</div>
    <h4 class="sh">Or describe it</h4><label class="fld"><span>Describe the look you want</span><textarea id="miy-text" rows="3" placeholder="e.g. futuristic digital playground with bold typography, neon accents, asymmetric project cards and smooth scroll animations">${esc(S.ui.miyText || '')}</textarea></label><button class="btn primary" data-act="miycustom">${ico('spark', 16)} Generate 3 variations</button>
    <p class="muted sm">Works offline with a deterministic design engine: it maps your words to supported colours, type, layout, navigation, motion and decoration — nothing else.</p>`;
  }
  const act = S.activeVar;
  return `<div class="miy-head"><button class="btn sm ghost" data-act="miyback">${ico('back', 15)} Back <small>(discard these)</small></button></div><p class="sm muted">Your content is untouched. Pick one to preview in the editor, compare it with your current design, then apply or discard.</p>
  ${S.interpreted && S.interpreted.length ? `<div class="chips"><span class="muted sm">Understood:</span>${S.interpreted.map(x => `<span class="chip2">${esc(x)}</span>`).join('')}</div>` : ''}
  <div class="vlist"><label class="vcard ${act ? '' : 'on'}"><input type="radio" name="var" data-act-change="varpick" value="" ${act ? '' : 'checked'}><div class="vt tf" data-own="${S.project.id}"><iframe sandbox title="Current design" tabindex="-1" aria-hidden="true"></iframe></div><div class="vb"><strong>Current design</strong><small>Always kept until you apply a variation</small></div></label>
  ${vs.map(v => `<label class="vcard ${act === v.id ? 'on' : ''}"><input type="radio" name="var" data-act-change="varpick" value="${v.id}" ${act === v.id ? 'checked' : ''}><div class="vt tf" data-vid="${v.id}"><iframe sandbox title="${esc(v.label)}" tabindex="-1" aria-hidden="true"></iframe></div><div class="vb"><strong>${esc(v.label)}</strong><small>${esc(v.changes.slice(0, 4).join(' · ') || 'Subtle changes')}</small></div></label>`).join('')}</div>
  <div class="miy-actions"><button class="btn primary" data-act="miyapply" ${act ? '' : 'disabled'}>${ico('check', 16)} Apply this design</button><button class="btn" data-act="miycompare" ${act ? '' : 'disabled'} aria-pressed="${S.compare}">${S.compare ? 'Exit compare' : 'Compare side by side'}</button><button class="btn ghost" data-act="miyshuffle">${ico('refresh', 15)} More options</button><button class="btn ghost danger-t" data-act="miydiscard">Discard all</button></div>`;
}
function hydrateVarThumbs(root) {
  $$('.tf[data-vid],.tf[data-own]', root).forEach(el => {
    const f = $('iframe', el); const ro = new ResizeObserver(() => el.style.setProperty('--sc', (el.clientWidth / 1280).toFixed(4))); ro.observe(el);
    if (el.dataset.vid) { const v = S.variations.find(x => x.id === el.dataset.vid); if (v) f.srcdoc = assembleDocument({ ...S.project, design: v.design }, { mode: 'thumb', code: effectiveCode({ ...S.project, design: v.design }) }); }
    else f.srcdoc = assembleDocument(S.project, { mode: 'thumb' });
  });
}
function runVariations(req, seed = 0) {
  const res = generateVariations(S.project.design, req, seed);
  S.lastApplied = false;
  if (!res.ok) { S.varMsg = res; S.variations = []; S.activeVar = null; } else { S.varMsg = null; S.variations = res.variations; S.interpreted = res.interpreted; S.activeVar = res.variations[0].id; S.miyReq = req; S.miySeed = seed; }
  emit('variations'); emit('doc', { structural: false, source: 'variation' });
}

/* ---- Inspector ---- */
function fieldDef(si) { const r = si.r; if (!si.sec) return null; const t = SECTION_TYPES[si.sec.type]; return t && t.fields.find(f => f.k === r.field) || null; }
function esv(path, prop) { const s = S.project.design.elementStyles[path]; return s && s[prop] != null ? s[prop] : ''; }
const esInput = (label, path, prop, type, o = {}) => {
  const v = esv(path, prop), id = `${path}|${prop}`;
  if (type === 'select') return `<label class="fld"><span>${label}</span><select data-es="${esc(id)}" data-t="str">${o.opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  if (type === 'range') return `<label class="fld"><span>${label} <output>${v === '' ? 'auto' : esc(v)}</output></span><input type="range" data-es="${esc(id)}" data-t="num" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${v === '' ? o.def : esc(v)}"></label>`;
  if (type === 'color') return `<label class="fld clr"><span>${label}</span><input type="color" data-es="${esc(id)}" data-t="str" value="${hexOk(v) ? v : o.def || '#000000'}"><code>${esc(v) || 'default'}</code></label>`;
  return '';
};
function typographyControls(path) {
  const al = esv(path, 'align');
  return `<h4 class="sh">Text style</h4>${esInput('Font', path, 'font', 'select', { opts: [['', 'Template default'], ...fontOpts()] })}${esInput('Size', path, 'size', 'range', { min: 10, max: 180, def: 24 })}${esInput('Weight', path, 'weight', 'select', { opts: [['', 'Default'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extra bold'], [900, 'Black']] })}${esInput('Color', path, 'color', 'color', { def: S.project.design.palette.text })}
  <div class="fld"><span>Alignment</span><div class="segs" role="group">${['left', 'center', 'right'].map(a => `<button class="seg ${al === a ? 'on' : ''}" data-act="esset" data-path="${esc(path)}" data-prop="align" data-v="${al === a ? '' : a}" aria-pressed="${al === a}">${a}</button>`).join('')}</div></div>${esInput('Letter spacing', path, 'ls', 'range', { min: -0.1, max: 0.4, step: 0.01, def: 0 })}${esInput('Line height', path, 'lh', 'range', { min: 0.8, max: 2.4, step: 0.05, def: 1.2 })}<button class="btn sm ghost" data-act="esreset" data-path="${esc(path)}">Reset text style</button>`;
}
function inspectorHTML() {
  const si = selInfo(); if (!si) return `<div class="insp-empty"><div>${ico('cursor', 28)}</div><h3>Click anything in the preview</h3><p>Headings, buttons, cards, images and sections can all be edited right where they are. Double-click text to type directly.</p></div>`;
  const { path, kind, r, sec, item } = si, par = parentPath(path);
  const crumbs = [sec && `<button data-act="selectcrumb" data-path="s/${sec.id}" data-kind="section">${esc(sec.title)}</button>`, item && `<button data-act="selectcrumb" data-path="s/${sec.id}/i/${item.id}" data-kind="card">${esc(itemTitle(sec, item))}</button>`, r.field && kind !== 'section' && kind !== 'card' ? `<span>${KIND_LABEL[kind] || 'Element'}</span>` : ''].filter(Boolean).join(' › ');
  let body = '';
  const val = getVal(S.project, path), def = fieldDef(si);
  if (kind === 'nav') body = `${fld(F('n', 'Brand text'), S.project.person.name, 'person/name')}${sel('Navigation layout', 'design.layout.nav', S.project.design.layout.nav, VARIANTS.nav)}${sel('Link style', 'design.components.navLink', S.project.design.components.navLink, ['plain', 'underline', 'pill', 'bracket'])}<p class="muted sm">Menu entries come from your visible sections — rename them in the Sections tab or by clicking a section heading.</p>`;
  else if (kind === 'section') body = sectionInspector(sec);
  else if (kind === 'card') body = cardInspector(sec, item, path);
  else if (kind === 'image') body = imageInspector(path, si);
  else if (kind === 'button') { const lp = S.ui.selLink; body = `${fld(F('t', 'Button text'), val, path)}${lp ? fld(F('l', 'Destination link', 'url'), getVal(S.project, lp), lp) : ''}<h4 class="sh">Button style</h4>${esInput('Background', path, 'bg', 'color', { def: S.project.design.palette.primary })}${esInput('Text color', path, 'btnColor', 'color', { def: S.project.design.palette.bg })}${esInput('Corner radius', path, 'radius', 'range', { min: 0, max: 40, def: S.project.design.components.btn.radius })}${esInput('Size', path, 'bsize', 'select', { opts: [['', 'Template default'], ['sm', 'Small'], ['lg', 'Large']] })}${esInput('Hover animation', path, 'hover', 'select', { opts: [['', 'Default'], ['lift', 'Lift'], ['glow', 'Glow'], ['grow', 'Grow'], ['invert', 'Invert'], ['none', 'None']] })}<button class="btn sm ghost" data-act="esreset" data-path="${esc(path)}">Reset button style</button>`; }
  else if (kind === 'link') body = fld(F('l', def ? def.l : 'Link', def && def.t === 'url' ? 'url' : 'text'), val, path);
  else body = fld(F('v', def ? def.l : (r.field === 'name' ? 'Name' : 'Text'), (def && def.t === 'textarea') || /bio|headline|sub|text/i.test(r.field || '') ? 'textarea' : 'text', { rows: r.field === 'bio' ? 6 : 3 }), val, path) + typographyControls(path);
  return `<div class="insp-h"><div class="crumbs">${crumbs || KIND_LABEL[kind] || ''}</div><div class="insp-hb">${par ? `<button class="btn sm ghost" data-act="tb-parent">${ico('layers', 14)} Parent</button>` : ''}<button class="iconbtn" data-act="tb-x" aria-label="Deselect">${ico('x', 18)}</button></div></div><div class="insp-b">${body}</div>`;
}
function sectionInspector(s) {
  const st = s.style || {}, i = secIdx(s.id), n = S.project.sections.length;
  const sv = (prop, label, opts) => `<label class="fld"><span>${label}</span><select data-ss="${s.id}|${prop}" data-t="str">${opts.map(([k, l]) => `<option value="${k}" ${(st[prop] || opts[0][0]) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  return `${fld(F('t', 'Section title'), s.title, `s/${s.id}/title`)}<div class="insp-act"><button class="btn sm" data-act="tb-up" ${i === 0 ? 'disabled' : ''}>${ico('up', 15)} Up</button><button class="btn sm" data-act="tb-down" ${i === n - 1 ? 'disabled' : ''}>${ico('down', 15)} Down</button><button class="btn sm" data-act="tb-hide">${ico('eyeoff', 15)} Hide</button><button class="btn sm" data-act="tb-dup">${ico('copy', 15)} Duplicate</button><button class="btn sm danger-t" data-act="tb-del">${ico('trash', 15)} Delete</button></div>
  <button class="btn sm" data-act="editcontent" data-id="${s.id}">${ico('edit', 15)} Edit this section's content</button><h4 class="sh">Section style</h4>${sv('bg', 'Background', [['none', 'None'], ['alt', 'Soft tint'], ['accent', 'Accent tint'], ['custom', 'Custom color']])}${st.bg === 'custom' ? `<label class="fld clr"><span>Background color</span><input type="color" data-ss="${s.id}|bgColor" data-t="str" value="${hexOk(st.bgColor) ? st.bgColor : '#eeeeee'}"></label>` : ''}${sv('pad', 'Vertical spacing', [['default', 'Default'], ['xs', 'Tight'], ['s', 'Snug'], ['l', 'Roomy'], ['xl', 'Spacious']])}${s.type === 'hero' ? '' : sv('layout', 'Content layout', [['default', 'Default'], ['wide', 'Wide'], ['narrow', 'Narrow'], ['cols', 'Two columns']])}${sv('anim', 'Animation', [['inherit', 'Match site'], ['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide'], ['scale', 'Scale'], ['reveal', 'Reveal']])}`;
}
function cardInspector(s, it, path) {
  const isProj = s.type === 'projects', n = s.items.length, i = s.items.findIndex(x => x.id === it.id);
  return `<div class="insp-act"><button class="btn sm" data-act="tb-up" ${i === 0 ? 'disabled' : ''}>${ico('up', 15)} Up</button><button class="btn sm" data-act="tb-down" ${i === n - 1 ? 'disabled' : ''}>${ico('down', 15)} Down</button><button class="btn sm" data-act="tb-dup">${ico('copy', 15)} Duplicate</button><button class="btn sm danger-t" data-act="tb-del">${ico('trash', 15)} Delete</button></div>${itemFieldsHTML(s, it)}
  <h4 class="sh">Card style</h4>${isProj ? esInput('Layout', path, 'layout', 'select', { opts: [['', 'Standard'], ['horizontal', 'Image beside text'], ['featured', 'Featured (full width)']] }) : ''}${esInput('Hover effect', path, 'hover', 'select', { opts: [['', 'Match site'], ...VARIANTS.hover.map(x => [x, x])] })}${esInput('Background', path, 'bg', 'color', { def: S.project.design.palette.card })}${esInput('Corner radius', path, 'radius', 'range', { min: 0, max: 48, def: S.project.design.components.card.radius })}<button class="btn sm ghost" data-act="esreset" data-path="${esc(path)}">Reset card style</button>`;
}
function imageInspector(path, si) {
  const r = si.r, altPath = r.iid ? `s/${r.sid}/i/${r.iid}/imageAlt` : r.data ? `s/${r.sid}/data/imageAlt` : null;
  return `${imageField(F('i', 'Image', 'image'), getVal(S.project, path), path)}${altPath ? fld(F('a', 'Description (alt text)'), getVal(S.project, altPath), altPath) : '<p class="muted sm">Alt text for the portrait is generated from your name.</p>'}${esInput('Corner radius', path, 'radius', 'range', { min: 0, max: 200, def: S.project.design.components.card.radius })}${sel('Image borders (site-wide)', 'design.components.imageBorder', S.project.design.components.imageBorder, ['none', 'thin', 'thick', 'frame'])}`;
}

/* ---- screen assembly ---- */
const panelBody = id => ({ content: contentPanelHTML, sections: () => sectionManagerHTML(false), design: designPanelHTML, motion: motionPanelHTML, miy: miyPanelHTML }[id] || (() => ''))();
function renderPanel() {
  const el = $('#wspanel .tabbody'); if (!el) return; const top = el.scrollTop, ae = document.activeElement && document.activeElement.id;
  if (!tabsFor(S.ui.mode).includes(S.ui.panel)) S.ui.panel = tabsFor(S.ui.mode)[0];
  el.innerHTML = panelBody(S.ui.panel); el.scrollTop = top; $$('#wspanel .tab').forEach(t => { const on = t.dataset.p === S.ui.panel; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
  if (S.ui.panel === 'miy') hydrateVarThumbs(el); if (ae) { const f = document.getElementById(ae); f && f.focus && f.focus({ preventScroll: true }); }
}
function renderInspector() { const el = $('#wsinsp .inspbody'); if (!el) return; const top = el.scrollTop; el.innerHTML = inspectorHTML(); el.scrollTop = top; $('#wsinsp').classList.toggle('has', !!selInfo()); }
function updateChrome() {
  $$('[data-act="undo"].tool').forEach(b => b.disabled = !S.past.length); $$('[data-act="redo"].tool').forEach(b => b.disabled = !S.future.length);
  $$('.savebadge').forEach(b => { b.className = 'savebadge ' + S.saveState; $('span', b).textContent = saveLabel(); });
  const ws = $('.ws'); if (ws) { ws.classList.toggle('sheet-open', !!S.ui.sheet); $$('.bn button').forEach(b => b.classList.toggle('on', b.dataset.sheet === S.ui.sheet || (!S.ui.sheet && b.dataset.sheet === 'preview'))); }
  $$('.dev-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === S.ui.device));
}
function screenWorkspace(mode) {
  S.ui.mode = mode; if (!tabsFor(mode).includes(S.ui.panel)) S.ui.panel = tabsFor(mode)[0];
  if (Router.cur.q.p && tabsFor(mode).includes(Router.cur.q.p)) { S.ui.panel = Router.cur.q.p; S.ui.sheet = matchMedia('(max-width:900px)').matches ? Router.cur.q.p : null; } else S.ui.sheet = null;
  const step = mode === 'customize' ? 5 : 6, next = mode === 'customize' ? ['/editor', 'Edit visually'] : ['/editor/code', 'Code'];
  const right = `<button class="iconbtn tool" data-act="undo" aria-label="Undo" title="Undo (Ctrl+Z)" ${S.past.length ? '' : 'disabled'}>${ico('undo', 19)}</button><button class="iconbtn tool hide-m" data-act="redo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" ${S.future.length ? '' : 'disabled'}>${ico('redo', 19)}</button>${saveBadge()}<button class="btn miybtn hide-m" data-act="openpanel" data-p="miy">${ico('spark', 16)} Make it yours</button><button class="btn sm hide-m" data-act="projmenu" aria-label="Project menu">${ico('more', 16)}</button><button class="btn primary nextbtn" data-act="goto" data-to="${next[0]}"><span>${next[1]}</span>${ico('next', 17)}</button>`;
  const tabs = tabsFor(mode).map(id => `<button class="tab" role="tab" data-act="openpanel" data-p="${id}" data-p-tab="${id}" aria-selected="false" aria-controls="tabpanel">${ico(TABS[id][1], 15)}<span>${TABS[id][0]}</span></button>`).join('');
  const bn = mode === 'customize' ? [['preview', 'Preview', 'eye'], ['design', 'Design', 'sliders'], ['motion', 'Motion', 'play'], ['miy', 'Make it yours', 'spark']] : [['preview', 'Preview', 'eye'], ['content', 'Content', 'edit'], ['design', 'Design', 'sliders'], ['/editor/code', 'Code', 'code'], ['/editor/export', 'Export', 'download']];
  return { html: `<div class="screen wsx">${appbar({ title: mode === 'customize' ? 'Customize' : S.project.name, sub: `Step ${step} of 8`, right })}${stepper(step)}
  <main class="ws ${S.ui.sheet ? 'sheet-open' : ''}"><aside class="ws-panel" id="wspanel" aria-label="Editing panel"><div class="sheet-grab"><span></span><button class="iconbtn" data-act="closesheet" aria-label="Close panel">${ico('x', 18)}</button></div><div class="tabs" role="tablist">${tabs}</div><div class="tabbody" id="tabpanel" role="tabpanel" tabindex="-1"></div></aside>
  <section class="ws-center"><div class="devbar"><div class="segs" role="group" aria-label="Preview size"><button class="dev-btn seg" data-act="device" data-d="desktop" aria-label="Desktop">${ico('monitor', 16)}<span>Desktop</span></button><button class="dev-btn seg" data-act="device" data-d="tablet" aria-label="Tablet">${ico('tablet', 16)}<span>Tablet</span></button><button class="dev-btn seg" data-act="device" data-d="mobile" aria-label="Mobile">${ico('phone', 16)}<span>Mobile</span></button></div><div class="devtools"><button class="iconbtn miy-tool show-m" data-act="openpanel" data-p="miy" aria-label="Make it yours" title="Make it yours">${ico('spark', 18)}</button><button class="iconbtn" data-act="replay" aria-label="Replay animations" title="Replay animations">${ico('play', 18)}</button><button class="iconbtn" data-act="fullscreen" aria-label="Full screen preview" title="Full screen">${ico('expand', 18)}</button><button class="iconbtn" data-act="newtab" aria-label="Open in new tab" title="Open in new tab">${ico('ext', 18)}</button></div></div><div class="prevhost" id="prevhost"></div>
  ${S.variations.length ? `<div class="varbar" id="varbar"></div>` : '<div class="varbar" id="varbar" hidden></div>'}</section>
  <aside class="ws-insp" id="wsinsp" aria-label="Selected element settings"><div class="sheet-grab"><span></span></div><div class="inspbody"></div></aside></main>
  <nav class="bn" aria-label="Editor sections">${bn.map(([k, l, ic]) => k.startsWith('/') ? `<button data-act="goto" data-to="${k}">${ico(ic, 20)}<span>${l}</span></button>` : `<button data-act="${k === 'preview' ? 'closesheet' : 'opensheet'}" data-sheet="${k}">${ico(ic, 20)}<span>${l}</span></button>`).join('')}</nav></div>`,
    mount: r => { mountPreview($('#prevhost', r), { interactive: mode === 'visual' }); renderPanel(); renderInspector(); renderVarBar(); updateChrome(); layoutPreview(); } };
}
function renderVarBar() {
  const b = $('#varbar'); if (!b) return; const v = S.variations.find(x => x.id === S.activeVar);
  if (!S.variations.length) { b.hidden = true; b.innerHTML = ''; return; } b.hidden = false;
  b.innerHTML = `<span><strong>${v ? 'Previewing: ' + esc(v.label) : 'Showing your current design'}</strong> <small class="muted">Nothing is saved until you apply.</small></span><span class="vb-a">${v ? `<button class="btn sm" data-act="miycompare" aria-pressed="${S.compare}">${S.compare ? 'Exit compare' : 'Compare'}</button><button class="btn sm primary" data-act="miyapply">Apply</button>` : ''}<button class="btn sm ghost" data-act="miydiscard">Discard</button></span>`;
}
/* react to model/selection changes */
on('doc', e => { if (!Preview.inst && !$('.ws')) return; refreshPreview(); updateChrome(); if (e.structural || e.source === 'variation') { renderPanel(); renderInspector(); renderVarBar(); } else if (e.source === 'user' && S.ui.selected) { /* keep inspector stable while typing */ } });
on('selection', e => { renderInspector(); const i = Preview.inst; if (i) { const tb = $('.sel-tb', i.host); tb && (tb.dataset.sig = ''); positionToolbar(); } const ws = $('.ws'); if (ws) ws.classList.toggle('insp-open', !!S.ui.selected && S.ui.insp); if (e.fromPreview && !matchMedia('(max-width:900px)').matches) focusPanelPath(S.ui.selected); updateChrome(); });
on('variations', () => { renderPanel(); renderVarBar(); updateChrome(); });
on('save', updateChrome);
function focusPanelPath(path) {
  if (!path || S.ui.mode !== 'visual' || path === 'nav') return; const r = parsePath(path); if (!r.sid) { return; }
  S.ui.openSec[r.sid] = true; if (r.iid) S.ui.openItem[r.iid] = true; S.ui.openGroup.person = S.ui.openGroup.person;
  if (S.ui.panel === 'content') { renderPanel(); const el = $(`#wspanel [data-fld="${CSS.escape(r.iid && r.field ? path : r.iid ? `s/${r.sid}/i/${r.iid}` : path)}"]`) || $(`#wspanel [data-fld="s/${r.sid}"]`); if (el) { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400); } }
}
