/* ===== 08-screens: landing, projects, gallery, wizard steps ===== */
const ThumbDocs = new Map();
function thumbDoc(tpl, proj) {
  const key = tpl + ':' + (proj ? proj.id + ':' + proj.updatedAt : 'sample'); if (ThumbDocs.has(key)) return ThumbDocs.get(key);
  let p; if (proj) { p = { ...proj, design: makeDesign(tpl), code: { html: null, css: null, js: null } }; } else p = newProject({ system: TEMPLATES[tpl].system, template: tpl });
  const d = assembleDocument(p, { mode: 'thumb', fonts: true }); ThumbDocs.size > 40 && ThumbDocs.clear(); ThumbDocs.set(key, d); return d;
}
const tf = (tpl, proj, extra = '') => `<div class="tf" data-tpl="${tpl}" ${proj ? `data-proj="${proj}"` : ''} ${extra}><iframe sandbox title="${esc(TEMPLATES[tpl].name)} preview" tabindex="-1" aria-hidden="true"></iframe></div>`;
const projectThumb = p => `<div class="tf" data-own="${p.id}"><iframe sandbox title="Preview of ${esc(p.name)}" tabindex="-1" aria-hidden="true"></iframe></div>`;
let _thumbObs;
function hydrateThumbs(root) {
  const ro = new ResizeObserver(es => es.forEach(e => e.target.style.setProperty('--sc', (e.contentRect.width / 1280).toFixed(4))));
  _thumbObs && _thumbObs.disconnect();
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target, f = $('iframe', el); io.unobserve(el);
    if (el.dataset.own) { const p = S._cache.get(el.dataset.own) || S.project; f.srcdoc = assembleDocument(p, { mode: 'thumb' }); } else f.srcdoc = thumbDoc(el.dataset.tpl, el.dataset.proj && S.project ? S.project : null); }), { rootMargin: '200px' });
  $$('.tf', root).forEach(el => { ro.observe(el); io.observe(el); }); _thumbObs = { disconnect() { ro.disconnect(); io.disconnect(); } };
}

/* ----- landing ----- */
function screenLanding() {
  const n = S.index.length;
  return { html: `<div class="screen landing">${appbar({ title: 'PortfolioVerse', back: true, right: `<button class="btn ghost sm hide-m" data-act="goto" data-to="/gallery">Templates</button><button class="btn ghost sm" data-act="goto" data-to="/projects">${ico('folder', 16)} <span>${n ? 'My portfolios (' + n + ')' : 'Open / import'}</span></button>` })}
  <main class="sbody"><section class="l-hero"><div class="l-copy"><p class="kicker">No account. No backend. No lock-in.</p><h2>Build a portfolio you actually own.</h2><p class="lede">Design it visually, click anything to edit it, open the code whenever you like, then download a single HTML file you can host anywhere.</p>
  <div class="l-cta"><button class="btn primary lg" data-act="startnew">${ico('plus', 20)} Start building</button>${n ? `<button class="btn lg" data-act="goto" data-to="/projects">Continue a portfolio</button>` : `<button class="btn lg" data-act="goto" data-to="/gallery">Browse templates</button>`}</div>
  <ul class="l-points"><li>8 hand-built templates in two design systems</li><li>Click-to-edit preview wired to your real data</li><li>Make It Yours: restyle without touching your content</li></ul></div>
  <div class="l-stage" aria-hidden="true"><div class="l-dev a">${tf('neo-experimental')}</div><div class="l-dev b">${tf('editorial')}</div></div></section>
  <section class="l-sys"><h3>Two ways to be seen</h3><div class="sys-grid">
   <article class="sys-card"><div class="pair">${tf('editorial')}${tf('developer')}</div><h4>Minimal</h4><p>Typography-first, generous whitespace, restrained colour. For students, engineers, researchers and anyone who lets the work speak.</p><button class="btn" data-act="startnew" data-system="minimal">Start Minimal ${ico('next', 16)}</button></article>
   <article class="sys-card"><div class="pair">${tf('brutalist')}${tf('digital-playground')}</div><h4>Maximal</h4><p>Oversized type, overlap, texture and play. For designers, artists and creators who want a point of view.</p><button class="btn" data-act="startnew" data-system="maximal">Start Maximal ${ico('next', 16)}</button></article></div></section>
  <section class="l-modes"><div><h4>Visual</h4><p>Forms for content, controls for design, and click-to-edit right in the preview.</p></div><div><h4>Code</h4><p>Inspect and edit the real HTML, CSS and JavaScript. Your edits are kept and exported.</p></div><div><h4>Live</h4><p>Desktop, tablet and phone previews in an isolated sandbox.</p></div><div><h4>Export</h4><p>One standalone HTML file, a ZIP with assets, or your project as JSON.</p></div></section>
  <footer class="l-foot">Portfolios are saved in this browser (IndexedDB). Export JSON regularly if the work matters.</footer></main></div>`, mount: r => hydrateThumbs(r) };
}

/* ----- projects ----- */
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(); };
const corruptNotice = () => `<div class="notice danger" role="alert"><p><strong>${S.corrupt.length} saved portfolio${S.corrupt.length > 1 ? 's' : ''} couldn’t be read</strong> and ${S.corrupt.length > 1 ? 'are' : 'is'} not listed below. The raw data is still in this browser — download it so it can be recovered or sent for help.</p><div class="btnrow">${S.corrupt.map((c, i) => `<button class="btn sm" data-act="rawdl" data-i="${i}">${ico('download', 15)} Download “${esc(c.name)}”</button>`).join('')}</div></div>`;
function screenProjects() {
  const cards = S.index.map(m => `<article class="pcard ${S.project && S.project.id === m.id ? 'cur' : ''}">${projectThumb(S._cache.get(m.id))}<div class="pc-b"><h3>${esc(m.name)}</h3><p class="muted">${esc(TEMPLATES[m.template] ? TEMPLATES[m.template].name : m.template)} · ${esc(m.system)} · ${ago(m.updatedAt)}</p><div class="pc-a"><button class="btn primary sm" data-act="openproj" data-id="${m.id}">Open</button><button class="btn sm" data-act="renameproj" data-id="${m.id}">Rename</button><button class="btn sm" data-act="dupproj" data-id="${m.id}">${ico('copy', 15)} Duplicate</button><button class="btn sm ghost danger-t" data-act="delproj" data-id="${m.id}" aria-label="Delete ${esc(m.name)}">${ico('trash', 15)}</button></div></div></article>`).join('');
  return { html: `<div class="screen">${appbar({ title: 'Your portfolios', sub: S.index.length + ' saved in this browser', right: `<button class="btn sm" data-act="importjson">${ico('upload', 16)} <span>Import JSON</span></button><button class="btn primary sm" data-act="startnew">${ico('plus', 16)} <span>New</span></button>` })}
  <main class="sbody"><div class="inner">${S.corrupt && S.corrupt.length ? corruptNotice() : ''}${S.storageOk ? '' : '<div class="notice warn">Your browser blocked IndexedDB, so projects are saved with a smaller fallback store. Export JSON to be safe.</div>'}${cards ? `<div class="pgrid">${cards}</div>` : `<div class="empty"><h3>Nothing here yet</h3><p>Create your first portfolio or import a project JSON you exported earlier.</p><button class="btn primary" data-act="startnew">Start building</button></div>`}</div></main></div>`, mount: r => hydrateThumbs(r) };
}

/* ----- gallery (standalone + wizard step) ----- */
function galleryHTML({ pick = false } = {}) {
  const f = S.ui.gFilter || (pick && S.project ? S.project.design.system : 'all'), cur = S.project && S.project.design.template;
  const list = Object.values(TEMPLATES).filter(t => f === 'all' || (f === 'favs' ? S.favs.includes(t.id) : t.system === f));
  const chips = [['all', 'All'], ['minimal', 'Minimal'], ['maximal', 'Maximal'], ['favs', 'Favorites ★']].map(([k, l]) => `<button class="seg ${f === k ? 'on' : ''}" data-act="gfilter" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join('');
  return `<div class="gtools"><div class="segs" role="group" aria-label="Filter templates">${chips}</div><span class="muted">${list.length} template${list.length === 1 ? '' : 's'}</span></div>
  <div class="ggrid">${list.map(t => `<article class="gcard ${cur === t.id && S.project ? 'sel' : ''}"><div class="g-prev">${tf(t.id, S.project ? 1 : 0)}<button class="fav ${S.favs.includes(t.id) ? 'on' : ''}" data-act="fav" data-id="${t.id}" aria-label="${S.favs.includes(t.id) ? 'Remove from' : 'Add to'} favorites" aria-pressed="${S.favs.includes(t.id)}">${ico('star', 18)}</button></div><div class="g-b"><h3>${t.name} <span class="tag ${t.system}">${t.system}</span></h3><p>${esc(t.blurb)}</p><div class="g-a"><button class="btn sm" data-act="tplpreview" data-id="${t.id}">${ico('eye', 15)} Preview</button>${S.project ? `<button class="btn sm" data-act="tpldup" data-id="${t.id}" title="Create a copy of your portfolio using this template">${ico('copy', 15)} Duplicate design</button><button class="btn sm ${cur === t.id ? '' : 'primary'}" data-act="tplpick" data-id="${t.id}" ${cur === t.id ? 'aria-pressed="true"' : ''}>${cur === t.id ? ico('check', 15) + ' Selected' : 'Use'}</button>` : `<button class="btn sm primary" data-act="startnew" data-system="${t.system}" data-tpl="${t.id}">Start with this</button>`}</div></div></article>`).join('') || '<p class="empty">No favorites yet — tap ★ on a template.</p>'}</div>`;
}
function screenGallery() {
  S.ui.gFilter = 'all';
  return { html: `<div class="screen">${appbar({ title: 'Template gallery', sub: S.project ? 'Switching keeps all your content' : '' })}<main class="sbody"><div class="inner wide" id="gal">${galleryHTML()}</div></main></div>`, mount: r => hydrateThumbs(r) };
}
async function templatePreviewDialog(id) {
  const p = S.project ? { ...S.project, design: makeDesign(id), code: { html: null, css: null, js: null } } : newProject({ system: TEMPLATES[id].system, template: id });
  const doc = assembleDocument(p, { mode: 'export', embedded: true });
  await openDialog({ title: TEMPLATES[id].name + ' preview', wide: true, cls: 'prevdlg', body: `<div class="pd-frame"><iframe sandbox="allow-scripts" title="Template preview" srcdoc="${esc(doc)}"></iframe></div>`, actions: [{ id: 'close', label: 'Close' }, ...(S.project ? [{ id: 'use', label: 'Use this template', kind: 'primary' }] : [])] }).then(v => { if (v === 'use') { switchTemplate(id); toast('Switched to ' + TEMPLATES[id].name + ' — your content is unchanged'); refreshGallery(); } });
}
function refreshGallery() { const g = $('#gal'); if (g) { g.innerHTML = galleryHTML({ pick: Router.cur.path === '/new/template' }); hydrateThumbs(g); } if (Router.cur.path === '/new/template') updateStepInfo(); }

/* ----- wizard step 1: style + name ----- */
function wizPid() { return SS.get('pv:wiz'); }
function screenSystem() {
  const p = wizPid() && S._cache.get(wizPid()), sys = S.ui.wizSystem || (p ? p.design.system : 'minimal'), name = S.ui.wizName != null ? S.ui.wizName : (p ? p.name : '');
  const card = (k, t, d, a, b) => `<label class="sysopt ${sys === k ? 'on' : ''}"><input type="radio" name="sys" value="${k}" ${sys === k ? 'checked' : ''} data-act-change="wizsys"><div class="pair">${tf(a)}${tf(b)}</div><h3>${t}</h3><p>${d}</p></label>`;
  return { html: `<div class="screen">${appbar({ title: 'Choose a style', sub: 'Step 1 of 8' })}${stepper(1)}<main class="sbody"><div class="inner"><h2 class="h2">Which design system fits you?</h2><p class="muted">You can switch any time — your content always carries over.</p>
  <div class="sysopts" role="radiogroup" aria-label="Design system">${card('minimal', 'Minimal', 'Elegant, professional, whitespace-rich. Editorial · Developer · Professional · Creative Minimal.', 'editorial', 'professional')}${card('maximal', 'Maximal', 'Bold, expressive, experimental. Brutalist · Neo-Experimental · Retro-Futuristic · Digital Playground.', 'brutalist', 'retro-futuristic')}</div>
  <label class="fld" style="max-width:420px"><span>Name this portfolio (only you see this)</span><input id="wiz-name" value="${esc(name)}" maxlength="80" placeholder="e.g. My portfolio 2026" autocomplete="off"></label></div></main>${stepbar({ next: 'wiznext', nextLabel: 'Choose template' })}</div>`, mount: r => hydrateThumbs(r) };
}
async function wizNext() {
  const sys = S.ui.wizSystem || (wizPid() && S._cache.get(wizPid()) ? S._cache.get(wizPid()).design.system : 'minimal'), nm = ($('#wiz-name') || {}).value || '';
  const existing = wizPid() && S._cache.get(wizPid());
  if (existing) { if (S.project.id !== existing.id) loadProject(existing.id); if (S.project.design.system !== sys) switchTemplate(DEFAULT_TPL[sys]); S.project.name = nm.trim() || S.project.name; markDirty(); }
  else { const p = await createProject({ name: nm.trim() || (sys === 'minimal' ? 'Minimal portfolio' : 'Maximal portfolio'), system: sys, template: S.ui.wizTpl && TEMPLATES[S.ui.wizTpl].system === sys ? S.ui.wizTpl : undefined }); SS.set('pv:wiz', p.id); }
  S.ui.wizSystem = null; S.ui.wizName = null; S.ui.wizTpl = null; S.ui.gFilter = S.project.design.system; Router.go('/new/template');
}

/* ----- wizard step 2: template ----- */
function screenTemplate() {
  S.ui.gFilter = S.ui.gFilter || S.project.design.system;
  return { html: `<div class="screen">${appbar({ title: 'Pick a template', sub: 'Step 2 of 8' })}${stepper(2)}<main class="sbody"><div class="inner wide" id="gal">${galleryHTML({ pick: true })}</div></main>${stepbar({ nextLabel: 'Your details', nextTo: '/new/info', info: '<span id="stepinfo"></span>' })}</div>`, mount: r => { hydrateThumbs(r); updateStepInfo(); } };
}
const updateStepInfo = () => { const e = $('#stepinfo'); if (e && S.project) e.textContent = 'Selected: ' + TEMPLATES[S.project.design.template].name; };

/* ----- wizard step 3: personal info ----- */
function personForm() {
  const p = S.project, hero = p.sections.find(s => s.type === 'hero'), about = p.sections.find(s => s.type === 'about');
  const f = PERSON_FIELDS.map(x => fld(x, p.person[x.k], 'person/' + x.k)).join('');
  const heroF = hero ? fld(SECTION_TYPES.hero.fields[0], hero.data.headline, `s/${hero.id}/data/headline`) + fld(SECTION_TYPES.hero.fields[1], hero.data.sub, `s/${hero.id}/data/sub`) : '';
  const bio = about ? fld(SECTION_TYPES.about.fields[0], about.data.bio, `s/${about.id}/data/bio`) : '';
  const soc = p.socials.map(x => `<div class="socrow" data-fld="soc/${x.id}"><select data-bind="soc/${x.id}/label" data-t="str" aria-label="Network">${[...new Set([...SOCIAL_NETWORKS, x.label])].map(n => `<option ${n === x.label ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><input data-bind="soc/${x.id}/url" data-t="url" placeholder="https://…" inputmode="url" autocapitalize="off" value="${esc(x.url)}" aria-label="Link" ${x.url && cleanUrl(x.url) === null ? 'aria-invalid="true"' : ''}><button class="iconbtn" data-act="delsoc" data-id="${x.id}" aria-label="Remove link">${ico('trash', 17)}</button></div>`).join('');
  return `<div class="fgroup"><h3>Who are you?</h3><div class="fgrid">${f}</div></div>${heroF ? `<div class="fgroup"><h3>First impression</h3>${heroF}</div>` : ''}${bio ? `<div class="fgroup"><h3>About you</h3>${bio}</div>` : ''}<div class="fgroup"><h3>Links</h3>${soc}<button class="btn sm" data-act="addsoc">${ico('plus', 15)} Add link</button></div>
  <div class="fgroup"><button class="btn sm ghost" data-act="clearsample">Clear all sample content</button><small class="muted"> Removes the example text so you can start from empty fields.</small></div>`;
}
function screenInfo() {
  return { html: `<div class="screen">${appbar({ title: 'About you', sub: 'Step 3 of 8', right: `<button class="btn sm show-m" data-act="previewdlg">${ico('eye', 16)} Preview</button>` })}${stepper(3)}<main class="sbody split"><div class="pane-form" id="infoform">${personForm()}</div><div class="pane-prev hide-m" id="wizprev"></div></main>${stepbar({ nextLabel: 'Choose sections', nextTo: '/new/sections' })}</div>`, mount: r => { mountPreview($('#wizprev', r), { interactive: false }); } };
}

/* ----- wizard step 4: sections ----- */
function screenSections() {
  return { html: `<div class="screen">${appbar({ title: 'Choose sections', sub: 'Step 4 of 8', right: `<button class="btn sm show-m" data-act="previewdlg">${ico('eye', 16)} Preview</button>` })}${stepper(4)}<main class="sbody split"><div class="pane-form" id="secmgr">${sectionManagerHTML(true)}</div><div class="pane-prev hide-m" id="wizprev"></div></main>${stepbar({ nextLabel: 'Customize', nextTo: '/new/customize' })}</div>`, mount: r => { mountPreview($('#wizprev', r), { interactive: false }); } };
}
function sectionManagerHTML(wizard) {
  const p = S.project, present = {};
  p.sections.forEach(s => present[s.type] = (present[s.type] || 0) + 1);
  const list = p.sections.map((s, i) => { const empty = sectionEmpty(s, p), t = SECTION_TYPES[s.type]; return `<li class="srow ${s.visible ? '' : 'off'}" data-sid="${s.id}"><span class="sico">${t.icon}</span><div class="smain"><strong>${esc(s.title)}</strong><small class="muted">${esc(t.label)}${!s.visible ? ' · hidden' : empty ? ' · empty — not shown on your site' : ''}${t.kind === 'list' ? ' · ' + s.items.length + ' item' + (s.items.length === 1 ? '' : 's') : ''}</small></div><div class="sact"><button class="iconbtn" data-act="secmove" data-id="${s.id}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(s.title)} up">${ico('up', 17)}</button><button class="iconbtn" data-act="secmove" data-id="${s.id}" data-d="1" ${i === p.sections.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(s.title)} down">${ico('down', 17)}</button><button class="iconbtn" data-act="sectoggle" data-id="${s.id}" aria-pressed="${s.visible}" aria-label="${s.visible ? 'Hide' : 'Show'} ${esc(s.title)}">${ico(s.visible ? 'eye' : 'eyeoff', 17)}</button><button class="iconbtn" data-act="secdup" data-id="${s.id}" aria-label="Duplicate ${esc(s.title)}">${ico('copy', 17)}</button><button class="iconbtn" data-act="secdel" data-id="${s.id}" aria-label="Delete ${esc(s.title)}">${ico('trash', 17)}</button></div></li>`; }).join('');
  const add = Object.entries(SECTION_TYPES).filter(([k]) => k !== 'hero').map(([k, t]) => `<button class="addtype ${present[k] ? 'has' : ''}" data-act="secadd" data-type="${k}"><span class="sico">${t.icon}</span><span>${esc(t.label)}</span>${present[k] ? `<em>${present[k]}</em>` : ico('plus', 15)}</button>`).join('');
  return `<div class="fgroup"><h3>${wizard ? 'Your page, top to bottom' : 'Page structure'}</h3><p class="muted sm">Use ↑ ↓ to reorder, the eye to hide, copy to duplicate. Sections with no content are skipped automatically.</p><ul class="slist">${list}</ul></div><div class="fgroup"><h3>Add a section</h3><div class="addgrid">${add}</div></div>`;
}
