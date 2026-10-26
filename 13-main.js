/* ===== 13-main: render dispatcher, central action handling, boot ===== */
const SCREENS = { '/': screenLanding, '/projects': screenProjects, '/gallery': screenGallery, '/new/system': screenSystem, '/new/template': screenTemplate, '/new/info': screenInfo, '/new/sections': screenSections, '/new/customize': () => screenWorkspace('customize'), '/editor': () => screenWorkspace('visual'), '/editor/code': screenCode, '/editor/export': screenExport };
let lastPath = null; const isMobile = () => matchMedia('(max-width:900px)').matches;
function render() {
  destroyPreview(); const path = Router.cur.path, scr = SCREENS[path]();
  const app = $('#app'); app.innerHTML = scr.html; Router.guard = scr.guard || null; document.body.dataset.route = path; document.title = (ROUTES[path].title || 'PortfolioVerse') + ' · PortfolioVerse';
  scr.mount && scr.mount(app); const sb = $('.sbody'); sb && (sb.scrollTop = 0); S.ui.fullscreen = false;
  /* move focus to the new screen's heading so keyboard and screen-reader users know the screen changed */
  const h1 = app.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); if (lastPath !== null && !$('.dlg-wrap')) h1.focus({ preventScroll: true }); } renderBanner();
}
function onRoute(cur, first) { if (!first && cur.path === lastPath && $('.ws')) { applyQuery(cur); return; } lastPath = cur.path; render(); }
function applyQuery(cur) { const p = cur.q.p; S.ui.sheet = isMobile() && p && tabsFor(S.ui.mode).includes(p) ? p : null; if (p && tabsFor(S.ui.mode).includes(p)) S.ui.panel = p; renderPanel(); updateChrome(); layoutPreview(); }

/* ---- binding: any element with data-bind / data-es / data-ss edits the real model ---- */
function readVal(el) { const t = el.dataset.t; let v = el.type === 'checkbox' ? el.checked : el.value; if (t === 'num') v = parseFloat(v); if (t === 'tags') v = String(v).split(',').map(x => x.trim()).filter(Boolean); return v; }
function flagInvalid(el, v) { const t = el.dataset.t, em = el.parentElement.querySelector('em.err'); let bad = false; if (t === 'url') bad = !!v && cleanUrl(v) === null; else if (el.type === 'email') bad = !!v && !isEmail(v); if (em) em.hidden = !bad; el.toggleAttribute('aria-invalid', bad); if (!bad) el.removeAttribute('aria-invalid'); }
function updateOutput(el, v) { const o = el.closest('label') && el.closest('label').querySelector('output'); if (o) o.textContent = (v === '' ? 'auto' : v) + (el.dataset.unit || ''); const c = el.closest('label') && el.closest('label').querySelector('code'); if (c) c.textContent = v; }
function applyBind(el) {
  const v = readVal(el); if (typeof v === 'number' && isNaN(v)) return;
  if (el.dataset.bind) {
    const path = el.dataset.bind;
    if (path.startsWith('ui.')) { setByDots(S, path.replace(/^ui\./, 'ui.'), v); render(); return; }
    if (path.startsWith('design.')) editDesign(path.slice(7), v);
    else if (path.startsWith('seo.')) commit('SEO', p => setByDots(p, path, v), { coalesce: 'b:' + path });
    else { flagInvalid(el, v); if (effectiveCode(S.project).manual.html && false) return; editPath(path, v); }
    updateOutput(el, v);
  } else if (el.dataset.es) { const [path, prop] = el.dataset.es.split('|'); editStyle(path, prop, el.dataset.t === 'num' ? v : v); updateOutput(el, v); }
  else if (el.dataset.ss) { const [sid, prop] = el.dataset.ss.split('|'); editSecStyle(sid, prop, v); }
}
document.addEventListener('input', e => { const el = e.target; if (el.matches('[data-bind],[data-es],[data-ss]')) { if (el.tagName === 'SELECT') return; applyBind(el); } if (el.id === 'wiz-name') S.ui.wizName = el.value; });
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-bind],[data-es],[data-ss]')) { applyBind(el); if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'range' || el.type === 'color') { if ($('.ws')) { renderPanel(); renderInspector(); } } }
  if (el.dataset.actChange === 'wizsys') { S.ui.wizSystem = el.value; $$('.sysopt').forEach(x => x.classList.toggle('on', $('input', x).checked)); }
  if (el.dataset.actChange === 'varpick') { S.activeVar = el.value || null; if (!S.activeVar) S.compare = false; emit('variations'); emit('doc', { structural: false, source: 'variation' }); }
  if (el.id === 'fileIn' && el.files[0]) handleUpload(el.files[0]);
  if (el.id === 'jsonIn' && el.files[0]) handleImport(el.files[0]);
});
let pendingUpload = null;
async function handleUpload(file) { const pu = pendingUpload; $('#fileIn').value = ''; if (!pu) return; try { const tok = await addAsset(file); editPath(pu.path, tok, { structural: true, coalesce: false }); toast('Uploaded ' + file.name); } catch (e) { toast(e.message || 'Upload failed', 'err'); } }
async function handleImport(file) { $('#jsonIn').value = ''; try { const p = await importProject(await file.text()); toast('Imported “' + p.name + '”'); if (p.code.html || p.code.css || p.code.js) toast('This project contains hand-written code. It only runs inside the sandboxed preview, but review it in the Code editor before publishing.', 'warn'); render(); } catch (e) { toast('Import failed: ' + (e.message || 'invalid file'), 'err'); } }
document.addEventListener('focusin', e => { if (e.target.matches('input,textarea,select') && isMobile()) setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 280); });

/* ---- actions ---- */
const goto = (to, o) => Router.go(to, o);
const selSec = () => { const si = selInfo(); return si && si.sec; };
/* Hand-edited code keeps overriding generated output; tell people before a design change silently does nothing. */
async function guardManualCode(what) {
  const m = S.project && effectiveCode(S.project).manual, names = m ? ['html', 'css', 'js'].filter(k => m[k]).map(k => k.toUpperCase()) : []; if (!names.length) return true;
  const v = await openDialog({ title: 'You have hand-edited code', body: `<p>Your edited ${names.join(', ')} keeps overriding the generated site, so ${esc(what)} may not show up in the preview or in the export.</p>`, actions: [{ id: 'no', label: 'Cancel' }, { id: 'keep', label: 'Keep my code', kind: '' }, { id: 'restore', label: 'Restore generated code', kind: 'primary' }] });
  if (v === 'restore') { clearTimeout(Code.timer); commit('Restore generated code', p => { p.code = { html: null, css: null, js: null }; }, { structural: true }); S.codeDraft = { html: null, css: null, js: null, dirty: false }; return true; }
  return v === 'keep';
}
const ACT = {
  bannerload: () => resolveConflict('load'), bannermine: () => resolveConflict('mine'), backup: () => doExportJSON(), retrysave: () => { S.saveState = 'unsaved'; S.conflict = null; saveNow(); },
  fixlink: async el => { if (await Router.go('/editor')) ACT.openpanel({ dataset: { p: el.dataset.p } }); },
  rawdl: el => { const c = S.corrupt[+el.dataset.i]; if (!c) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(c.raw, null, 2)], { type: 'application/json' })); a.download = 'unreadable-' + c.id + '.json'; document.body.appendChild(a); a.click(); a.remove(); },
  back: () => Router.back(), goto: el => goto(el.dataset.to), next: async el => { if (Router.cur.path === '/new/info' && blank(S.project.person.name) && !(await confirmDialog({ title: 'Continue without a name?', body: 'Your name appears in the header and hero of your portfolio. You can add it later in the editor.', ok: 'Continue', cancel: 'Add it now' }))) return; goto(el.dataset.to); },
  startnew: el => { SS.del('pv:wiz'); S.ui.wizSystem = el.dataset.system || null; S.ui.wizTpl = el.dataset.tpl || null; S.ui.wizName = null; goto('/new/system'); },
  wiznext: () => wizNext(), finish: () => { toast('All set — your portfolio is saved in this browser.'); SS.del('pv:wiz'); goto('/projects'); },
  save: async () => { await saveNow(); toast(S.saveState === 'error' ? 'Could not save — export JSON to be safe.' : 'Saved', S.saveState === 'error' ? 'err' : 'ok'); },
  undo: () => { if (!undo()) toast('Nothing to undo'); S.lastApplied = false; }, redo: () => { if (!redo()) toast('Nothing to redo'); },
  openproj: el => { loadProject(el.dataset.id) && goto('/editor'); },
  renameproj: async el => { const m = S.index.find(x => x.id === el.dataset.id), n = await askText('Rename portfolio', 'Name', m.name, 'Rename'); if (n) { renameProject(el.dataset.id, n); render(); } },
  dupproj: async el => { const c = await duplicateProject(el.dataset.id); toast('Duplicated as “' + c.name + '”'); render(); },
  delproj: async el => { const m = S.index.find(x => x.id === el.dataset.id); if (await confirmDialog({ title: 'Delete “' + m.name + '”?', body: 'This permanently removes the portfolio from this browser. Export JSON first if you might need it.', ok: 'Delete', danger: true })) { await deleteProject(el.dataset.id); toast('Deleted'); render(); } },
  importjson: () => $('#jsonIn').click(),
  upload: el => { pendingUpload = { path: el.dataset.path }; const f = $('#fileIn'); f.accept = el.dataset.pdf === '1' ? 'application/pdf,image/*' : 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'; f.click(); },
  clearimg: el => editPath(el.dataset.path, '', { structural: true, coalesce: false }),
  gfilter: el => { S.ui.gFilter = el.dataset.f; refreshGallery(); }, fav: el => { toggleFav(el.dataset.id); refreshGallery(); },
  tplpreview: el => templatePreviewDialog(el.dataset.id),
  tplpick: async el => { if (!(await guardManualCode('the new template'))) return; switchTemplate(el.dataset.id); toast('Switched to ' + TEMPLATES[el.dataset.id].name + ' — all your content is kept'); refreshGallery(); },
  tpldup: async el => { const c = await duplicateProject(S.project.id); c.design = { ...makeDesign(el.dataset.id), elementStyles: c.design.elementStyles }; c.name = S.project.name + ' · ' + TEMPLATES[el.dataset.id].name; DB.put(c); upsertIndex(c); toast('Created “' + c.name + '” in My portfolios'); },
  delsoc: el => removeSocial(el.dataset.id), addsoc: () => addSocial(),
  clearsample: async () => { if (await confirmDialog({ title: 'Clear sample content?', body: 'This empties your details and every section so you can start fresh. You can undo it in the editor.', ok: 'Clear it', danger: true })) clearSample(); },
  previewdlg: () => openDialog({ title: 'Preview', wide: true, cls: 'prevdlg', body: `<div class="pd-frame"><iframe sandbox="allow-scripts" title="Preview" srcdoc="${esc(assembleDocument(previewProject(), { mode: 'export', embedded: true, code: effectiveCode(previewProject()) }))}"></iframe></div>`, actions: [{ id: 'c', label: 'Close', kind: 'primary' }] }),
  secmove: el => moveSection(el.dataset.id, +el.dataset.d), sectoggle: el => toggleSection(el.dataset.id),
  secdup: el => { const id = duplicateSection(el.dataset.id); S.ui.openSec[id] = true; toast('Section duplicated'); },
  secdel: async el => { const s = findSection(S.project, el.dataset.id); if (await confirmDialog({ title: 'Delete “' + s.title + '”?', body: s.items.length ? 'Its ' + s.items.length + ' item(s) will be removed too. You can undo this.' : 'You can undo this.', ok: 'Delete section', danger: true })) { removeSection(el.dataset.id); if (S.ui.selected && S.ui.selected.includes(el.dataset.id)) selectPath(null); } },
  secadd: el => { const id = addSection(el.dataset.type); S.ui.openSec[id] = true; toast(SECTION_TYPES[el.dataset.type].label + ' added — it stays hidden on your site until it has content'); },
  accgroup: el => { S.ui.openGroup[el.dataset.key] = el.getAttribute('aria-expanded') !== 'true'; renderPanel(); },
  secopen: el => { const id = el.dataset.id, open = !S.ui.openSec[id]; S.ui.openSec[id] = open; renderPanel(); if (open && !isMobile()) selectPath('s/' + id, 'section', null, { sync: true, scroll: true }); },
  itemopen: el => { const id = el.dataset.id, open = !S.ui.openItem[id]; S.ui.openItem[id] = open; renderPanel(); },
  itemadd: el => { const id = addItem(el.dataset.sid); S.ui.openItem[id] = true; renderPanel(); }, itemmove: el => moveItem(el.dataset.sid, el.dataset.id, +el.dataset.d), itemdup: el => { const id = duplicateItem(el.dataset.sid, el.dataset.id); S.ui.openItem[id] = true; },
  itemdel: async el => { if (await confirmDialog({ title: 'Delete this item?', body: 'You can undo this.', ok: 'Delete', danger: true })) removeItem(el.dataset.sid, el.dataset.id); },
  palette: el => { const c = el.dataset.c.split(','); editDesign('palette', Object.fromEntries(PALETTE_KEYS.map((k, i) => [k, c[i]])), { structural: true, coalesce: false }); },
  setsystem: async el => { if (!(await guardManualCode('the new design system'))) return; setSystem(el.dataset.s); },
  decor: el => { const d = clone(S.project.design.decor || []), x = el.dataset.d; editDesign('decor', d.includes(x) ? d.filter(y => y !== x) : [...d, x], { structural: true, coalesce: false }); },
  replay: () => replayAnimations(), device: el => { S.ui.device = el.dataset.d; updateChrome(); layoutPreview(); },
  fullscreen: () => { const i = Preview.inst; if (!i) return; S.ui.fullscreen = !S.ui.fullscreen; i.wrap.classList.toggle('full', S.ui.fullscreen); const ex = $('.pv-exit', i.wrap); if (S.ui.fullscreen && !ex) i.wrap.insertAdjacentHTML('afterbegin', `<button class="pv-exit btn" data-act="fullscreen">${ico('shrink', 16)} Exit full screen</button>`); if (!S.ui.fullscreen && ex) ex.remove(); setTimeout(layoutPreview, 30); },
  newtab: () => openInNewTab(),
  projmenu: () => openDialog({ title: 'Project', body: `<div class="menulist"><button class="btn" data-dlg="rename">Rename project</button><button class="btn" data-dlg="ver">Save a named version</button><button class="btn" data-dlg="dup">Duplicate project</button><button class="btn" data-dlg="json">Export project JSON</button><button class="btn" data-dlg="gal">Template gallery</button><button class="btn" data-dlg="list">All portfolios</button></div>`, actions: [{ id: 'c', label: 'Close' }] }).then(async v => { if (v === 'rename') { const n = await askText('Rename portfolio', 'Name', S.project.name, 'Rename'); if (n) { S.project.name = n; renameProject(S.project.id, n); render(); } } else if (v === 'ver') ACT.saveversion(); else if (v === 'dup') { const c = await duplicateProject(S.project.id); toast('Duplicated as “' + c.name + '”'); } else if (v === 'json') doExportJSON(); else if (v === 'gal') goto('/gallery'); else if (v === 'list') goto('/projects'); }),
  openpanel: el => { const p = el.dataset.p; S.ui.panel = p; if (isMobile()) { S.ui.sheet = p; Router.setQuery({ p }, { replace: false }); } else Router.setQuery({ p }); renderPanel(); updateChrome(); layoutPreview(); },
  opensheet: el => ACT.openpanel({ dataset: { p: el.dataset.sheet } }),
  closesheet: () => { S.ui.sheet = null; S.ui.insp = false; if (Router.cur.q.p) Router.setQuery({ p: null }); const i = $('.ws'); i && i.classList.remove('insp-open'); updateChrome(); layoutPreview(); },
  editcontent: el => { S.ui.openSec[el.dataset.id] = true; ACT.openpanel({ dataset: { p: 'content' } }); },
  miypreset: el => runVariations({ preset: el.dataset.k }), miycustom: () => { const t = $('#miy-text').value; S.ui.miyText = t; runVariations({ text: t }); },
  miysave: async () => { try { const c = await saveVariationAsProject(S.activeVar); if (c) toast('Saved “' + c.name + '”. Find it any time under ⋯ → All portfolios.'); } catch (e) { toast('Could not save this design: ' + e.message, 'err'); } },
  miysaveall: async () => { try { const n = S.variations.length; for (const v of [...S.variations]) await saveVariationAsProject(v.id); toast('Saved ' + n + ' designs as new portfolios. Find them under ⋯ → All portfolios.'); } catch (e) { toast('Could not save these designs: ' + e.message, 'err'); } },
  miyback: () => discardVariations(), miydiscard: () => { discardVariations(); toast('Discarded — your design is unchanged'); },
  miyapply: async () => { if (!(await guardManualCode('this design'))) return; applyVariation(S.activeVar); toast('Design applied. Use Undo to go back.'); }, miyshuffle: () => runVariations(S.miyReq, (S.miySeed || 0) + 1),
  miycompare: () => { S.compare = !S.compare; emit('variations'); refreshPreview(true); },
  esset: el => { editStyle(el.dataset.path, el.dataset.prop, el.dataset.v); renderInspector(); },
  esreset: el => { commit('Reset style', p => { delete p.design.elementStyles[el.dataset.path]; }, { structural: true }); },
  selectcrumb: el => selectPath(el.dataset.path, el.dataset.kind, null, { sync: true }),
  'tb-edit': () => { if (isMobile()) { S.ui.insp = true; emit('selection', {}); } else postPreview({ t: 'edit', path: S.ui.selected }); },
  'tb-insp': () => { S.ui.insp = true; emit('selection', {}); }, 'tb-x': () => { S.ui.insp = false; selectPath(null); },
  'tb-parent': () => { const pp = parentPath(S.ui.selected); pp && selectPath(pp[0], pp[1], null, { sync: true, scroll: true }); },
  'tb-up': () => { const r = parsePath(S.ui.selected); r.iid && !r.field ? moveItem(r.sid, r.iid, -1) : moveSection(r.sid, -1); }, 'tb-down': () => { const r = parsePath(S.ui.selected); r.iid && !r.field ? moveItem(r.sid, r.iid, 1) : moveSection(r.sid, 1); },
  'tb-dup': () => { const r = parsePath(S.ui.selected); if (r.iid && !r.field) { const id = duplicateItem(r.sid, r.iid); selectPath(`s/${r.sid}/i/${id}`, 'card', null, { sync: true }); } else { const id = duplicateSection(r.sid); selectPath('s/' + id, 'section', null, { sync: true, scroll: true }); } toast('Duplicated'); },
  'tb-hide': () => { const r = parsePath(S.ui.selected); toggleSection(r.sid); selectPath(null); toast('Section hidden — show it again from the Sections tab'); },
  'tb-del': async () => { const r = parsePath(S.ui.selected), item = r.iid && !r.field; if (await confirmDialog({ title: item ? 'Delete this item?' : 'Delete this section?', body: 'You can undo this.', ok: 'Delete', danger: true })) { item ? removeItem(r.sid, r.iid) : removeSection(r.sid); selectPath(null); } },
  codetab: el => { Code.tab = el.dataset.t; renderCodeScreen(); }, codeapply: () => { commitCodeDraft(); updateCodeUI(); toast('Applied to preview'); }, codecopy: () => copyText(codeValue(Code.tab), Code.tab.toUpperCase()), coderestore: el => restoreCode(el.dataset.t),
  codepane: el => { Code.pane = el.dataset.v; const w = $('.codews'); w.classList.toggle('pane-code', Code.pane === 'code'); w.classList.toggle('pane-prev', Code.pane === 'prev'); $$('.seg-m .seg').forEach(b => b.classList.toggle('on', b.dataset.v === Code.pane)); layoutPreview(); },
  dlhtml: () => doDownloadHTML(), dlzip: () => doDownloadZip(), dljson: () => doExportJSON(),
  copyexp: el => { const w = el.dataset.w, p = S.project; copyText(w === 'html' ? assembleDocument(p, { mode: 'export', fonts: exportOpts().fonts }) : effectiveCode(p)[w], w === 'html' ? 'Complete HTML' : w.toUpperCase()); },
  saveversion: async () => { const n = await askText('Save version', 'Version name', 'Version ' + (S.project.versions.length + 1), 'Save'); if (n) { saveVersion(n); toast('Version saved'); if (Router.cur.path === '/editor/export') render(); } },
  restorever: async el => { if (await confirmDialog({ title: 'Restore this version?', body: 'Your current work will be replaced (you can undo this).', ok: 'Restore' })) { restoreVersion(el.dataset.id); toast('Version restored'); render(); } },
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); } });
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable, mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); S.project && ACT.save(); }
  if (!typing && mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } if (!typing && mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  if (e.key === 'Escape' && !$('.dlg-wrap')) { if (S.ui.fullscreen) ACT.fullscreen(); else if (S.ui.selected) { S.ui.insp = false; selectPath(null); } else if (S.ui.sheet) ACT.closesheet(); }
});
on('doc', e => { if (S.ui.selected && !selInfo()) { S.ui.insp = false; selectPath(null); }
  if (e.structural || e.source === 'undo' || e.source === 'redo') { const f = $('#infoform'); if (f && !f.contains(document.activeElement)) f.innerHTML = personForm(); else if (f && e.structural) f.innerHTML = personForm(); const m = $('#secmgr'); if (m) m.innerHTML = sectionManagerHTML(true); if (Router.cur.path === '/editor/export') { /* inputs update live */ } } });
on('save', () => { renderBanner(); announceState(); });
on('project', () => renderBanner());
on('selection', () => { const ws = $('.ws'); if (ws) ws.classList.toggle('insp-open', !!S.ui.selected && S.ui.insp); });
on('selection', e => { if (e.fromPreview) S.ui.insp = !isMobile(); const ws = $('.ws'); if (ws) ws.classList.toggle('insp-open', !!S.ui.selected && S.ui.insp); });

function showFatal(e) { const a = $('#app'); if (!a) return; a.innerHTML = `<div class="fatal"><h2>PortfolioVerse couldn’t start</h2><p>${esc((e && e.message) || e)}</p><p class="muted">Try reloading. If you opened this inside a preview pane, open index.html directly in a normal browser tab.</p><button class="btn primary" data-act="reload">Reload</button></div>`; }
ACT.reload = () => location.reload();
/* Never fail silently: surface unexpected errors so a "dead button" always explains itself */
addEventListener('error', e => { if (e.message && !/ResizeObserver/.test(e.message)) toast('Something went wrong: ' + e.message, 'err'); });
addEventListener('unhandledrejection', e => { const m = e.reason && (e.reason.message || String(e.reason)); if (m) toast('Something went wrong: ' + m, 'err'); });
async function boot() {
  try {
    setVV(); if (window.visualViewport) { visualViewport.addEventListener('resize', () => { setVV(); layoutPreview(); }); visualViewport.addEventListener('scroll', setVV); } addEventListener('resize', () => { setVV(); layoutPreview(); }); addEventListener('orientationchange', () => setTimeout(() => { setVV(); layoutPreview(); }, 200));
    await initStore(); if (innerWidth <= 520) S.ui.device = 'mobile'; Router.init(onRoute);
    window.PV = { S, Router, ACT, render, commit, editPath, getVal, effectiveCode, assembleDocument, exportReport, buildExportFiles, makeZip, sanitizeProject, generateVariations, TEMPLATES, selectPath, runVariations };
  } catch (e) { console.error(e); showFatal(e); }
}
boot();
