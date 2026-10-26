/* ===== 05-store: state, history (undo/redo), persistence, assets ===== */
const S = {
  index: [], project: null, past: [], future: [], saveState: 'saved', lastSaved: null, storageOk: true,
  variations: [], activeVar: null, compare: false, varMsg: null, lastApplied: false,
  draftWizard: false, favs: [],
  ui: { panel: 'content', device: 'desktop', fullscreen: false, selected: null, selKind: null, selLink: null, openSec: {}, openItem: {}, openGroup: { palette: true }, insp: false, sheet: null, animate: true },
  codeDraft: { html: null, css: null, js: null, dirty: false },
};
const bus = {}; const on = (t, f) => { (bus[t] = bus[t] || []).push(f); return () => bus[t] = bus[t].filter(x => x !== f); };
const emit = (t, d) => (bus[t] || []).slice().forEach(f => f(d));
const snap = () => JSON.stringify(docOf(S.project));

/* ----- IndexedDB with localStorage fallback ----- */
const DB = {
  db: null, mem: new Map(), mode: 'memory',
  open() { return new Promise(res => { try { const rq = indexedDB.open('portfolioverse', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('projects', { keyPath: 'id' }); rq.onsuccess = () => { DB.db = rq.result; DB.mode = 'indexeddb'; res(true); }; rq.onerror = () => res(false); rq.onblocked = () => res(false); } catch (e) { res(false); } }); },
  tx(mode) { return DB.db.transaction('projects', mode).objectStore('projects'); },
  put(p) { return new Promise((res, rej) => {
    if (DB.db) { try { const r = DB.tx('readwrite').put(p); r.onsuccess = () => res(); r.onerror = () => rej(r.error); } catch (e) { rej(e); } return; }
    try { localStorage.setItem('pv:p:' + p.id, JSON.stringify(p)); DB.mode = 'localstorage'; res(); }
    catch (e) { if (e && /quota/i.test(e.name + e.message)) return rej(e); DB.mode = 'memory'; DB.mem.set(p.id, JSON.stringify(p)); res(); } }); },
  all() { return new Promise(res => { if (DB.db) { try { const r = DB.tx('readonly').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); } catch (e) { res([]); } return; }
    const o = []; LS.keys().filter(k => k.startsWith('pv:p:')).forEach(k => { try { o.push(JSON.parse(LS.get(k))); } catch (e) { /* skip */ } }); DB.mem.forEach(v => { try { o.push(JSON.parse(v)); } catch (e) { /* skip */ } }); res(o); }); },
  get(id) { return new Promise(res => {
    if (DB.db) { try { const r = DB.tx('readonly').get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); } catch (e) { res(null); } return; }
    try { const v = LS.get('pv:p:' + id) || DB.mem.get(id); res(v ? JSON.parse(v) : null); } catch (e) { res(null); } }); },
  del(id) { return new Promise(res => { DB.mem.delete(id); if (!DB.db) { LS.del('pv:p:' + id); res(); return; } try { const r = DB.tx('readwrite').delete(id); r.onsuccess = r.onerror = () => res(); } catch (e) { res(); } }); },
};
const meta = p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, template: p.design.template, system: p.design.system, who: p.person.name });
async function initStore() {
  S.storageOk = await DB.open(); S.persist = () => DB.mode;
  try { S.favs = JSON.parse(LS.get('pv:favs') || '[]'); } catch (e) { S.favs = []; }
  const all = await DB.all(), good = [];
  S.corrupt = []; S.baseStamp = {};
  all.forEach(raw => { try { const p = sanitizeProject(raw, { keepStamp: true }); good.push(p); S.baseStamp[p.id] = p.updatedAt; } catch (e) { S.corrupt.push({ id: String((raw && raw.id) || 'unknown'), name: String((raw && raw.name) || 'Unnamed'), error: e.message, raw }); } });
  S.index = good.map(meta).sort((a, b) => b.updatedAt - a.updatedAt); S._cache = new Map(good.map(p => [p.id, p]));
  const last = LS.get('pv:last'); if (last && S._cache.has(last)) loadProject(last);
}
function loadProject(id) { const p = S._cache.get(id); if (!p) return false; S.project = p; S.past = []; S.future = []; S.variations = []; S.activeVar = null; S.compare = false; S.ui.selected = null; S.codeDraft = { html: null, css: null, js: null, dirty: false }; S.saveState = 'saved'; LS.set('pv:last', id); emit('project'); return true; }

/* ----- saving ----- */
let saving = Promise.resolve();
async function saveNow() {
  const p = S.project; if (!p) return; clearTimeout(S._st);
  if (S.conflict) return;                       /* autosave stays paused until the user resolves the conflict */
  if (S.saveState === 'saved') return;
  S.saveState = 'saving'; emit('save'); p.updatedAt = Date.now();
  saving = saving.then(async () => {
    /* Another tab/window may have written this project since we loaded or last saved it. Never overwrite blindly. */
    const cur = await DB.get(p.id), known = S.baseStamp[p.id];
    if (cur && known != null && cur.updatedAt !== known) { S.conflict = { id: p.id, kind: 'changed' }; S.saveState = 'conflict'; emit('save'); return; }
    await DB.put(p); S.baseStamp[p.id] = p.updatedAt; announceSave(p.id);
    if (S.saveState === 'saving') { S.saveState = 'saved'; S.lastSaved = Date.now(); S.saveError = null; }
    S._cache.set(p.id, p); upsertIndex(p);
    if (DB.mode === 'memory' && !S._memWarned) { S._memWarned = true; toast('This viewer blocks saving to the browser. Your work lasts only while this page stays open — use Project JSON on the Export screen to keep it.', 'warn'); }
    emit('save');
  }).catch(e => { S.saveState = 'error'; S.saveError = (e && (e.name + ': ' + e.message)) || 'unknown error'; emit('save'); });
  return saving;
}
/* tell other tabs we wrote (instant conflict notice); the stamp check above is the real safety net */
const TAB_ID = uid('t'); let bc = null; try { bc = new BroadcastChannel('portfolioverse'); } catch (e) { /* not supported */ }
function announceSave(id) { try { bc && bc.postMessage({ t: 'saved', id, tab: TAB_ID, stamp: S.baseStamp[id] }); } catch (e) { /* ignore */ } }
if (bc) bc.onmessage = e => { const m = e.data; if (!m || m.t !== 'saved' || m.tab === TAB_ID || !S.project || S.project.id !== m.id || S.baseStamp[m.id] === m.stamp || S.conflict) return; S.conflict = { id: m.id, kind: 'changed' }; S.saveState = 'conflict'; emit('save'); };
async function resolveConflict(choice) {
  const c = S.conflict; if (!c || !S.project) return;
  if (choice === 'load') {
    const cur = await DB.get(c.id); if (cur) { const p = sanitizeProject(cur, { keepStamp: true }); S._cache.set(p.id, p); S.baseStamp[p.id] = p.updatedAt; S.conflict = null; loadProject(p.id); upsertIndex(p); S.saveState = 'saved'; emit('save'); emit('project'); return true; }
  }
  const cur = await DB.get(c.id); S.baseStamp[c.id] = cur ? cur.updatedAt : undefined; S.conflict = null; S.saveState = 'unsaved'; emit('save'); await saveNow(); return true;
}
function upsertIndex(p) { const m = meta(p), i = S.index.findIndex(x => x.id === p.id); if (i >= 0) S.index[i] = m; else S.index.unshift(m); S.index.sort((a, b) => b.updatedAt - a.updatedAt); }
function markDirty() { S.saveState = S.conflict ? 'conflict' : 'unsaved'; emit('save'); clearTimeout(S._st); if (!S.conflict) S._st = setTimeout(saveNow, 600); }

/* ----- committing edits with undo ----- */
function commit(label, fn, o = {}) {
  const p = S.project; if (!p) return; const before = snap(), now = Date.now();
  fn(p); const after = snap(); if (after === before) return;
  const co = o.coalesce && S._co && S._co.key === o.coalesce && now - S._co.t < 1200;
  if (!co) { S.past.push(before); if (S.past.length > 120) S.past.shift(); }
  S._co = o.coalesce ? { key: o.coalesce, t: now } : null; S.future = [];
  markDirty(); emit('doc', { structural: !!o.structural, label, coalesce: !!o.coalesce, source: o.source || 'user' });
}
function restore(str) { const d = JSON.parse(str); DOC_KEYS.forEach(k => S.project[k] = d[k]); }
function undo() { if (!S.past.length) return false; S.future.push(snap()); restore(S.past.pop()); S._co = null; markDirty(); emit('doc', { structural: true, source: 'undo' }); return true; }
function redo() { if (!S.future.length) return false; S.past.push(snap()); restore(S.future.pop()); S._co = null; markDirty(); emit('doc', { structural: true, source: 'redo' }); return true; }

/* Generic setters used by every editing surface (forms, inspector, click-to-edit, code) */
function setByDots(obj, path, v) { const a = path.split('.'); let o = obj; for (let i = 0; i < a.length - 1; i++) { if (typeof o[a[i]] !== 'object' || o[a[i]] === null) o[a[i]] = {}; o = o[a[i]]; } o[a[a.length - 1]] = v; }
function getByDots(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function editPath(path, value, o = {}) { commit('Edit ' + path, p => { if (!setVal(p, path, value)) throw new Error('Unknown path ' + path); }, { coalesce: o.coalesce === false ? null : 'p:' + path, structural: !!o.structural }); }
function editDesign(path, v, o = {}) { commit('Design', p => setByDots(p.design, path, v), { coalesce: o.coalesce === false ? null : 'd:' + path, structural: !!o.structural }); }
function editStyle(path, prop, v) { commit('Style', p => { const es = p.design.elementStyles; es[path] = es[path] || {}; if (v === '' || v == null) delete es[path][prop]; else es[path][prop] = v; if (!Object.keys(es[path]).length) delete es[path]; }, { coalesce: 'es:' + path + prop }); }
function editSecStyle(sid, prop, v) { commit('Section style', p => { const s = findSection(p, sid); s.style = s.style || {}; if (v === '' || v == null || v === 'default' || v === 'none' && prop === 'bg') { if (v === 'none') s.style[prop] = 'none'; else delete s.style[prop]; } else s.style[prop] = v; }, { coalesce: 'ss:' + sid + prop }); }

/* ----- structure operations ----- */
const secIdx = sid => S.project.sections.findIndex(s => s.id === sid);
function moveSection(sid, d) { commit('Move section', p => { const i = secIdx(sid), j = i + d; if (j < 0 || j >= p.sections.length) return; [p.sections[i], p.sections[j]] = [p.sections[j], p.sections[i]]; }, { structural: true }); }
function toggleSection(sid) { commit('Toggle section', p => { const s = findSection(p, sid); s.visible = !s.visible; }, { structural: true }); }
function removeSection(sid) { commit('Delete section', p => { p.sections = p.sections.filter(s => s.id !== sid); }, { structural: true }); }
function duplicateSection(sid) { let nid; commit('Duplicate section', p => { const i = secIdx(sid), c = dupSection(p.sections[i]); nid = c.id; p.sections.splice(i + 1, 0, c); }, { structural: true }); return nid; }
function addSection(type, title) { let id; commit('Add section', p => { const s = newSection(type, { title }); id = s.id; const ci = p.sections.findIndex(x => x.type === 'contact'); (ci > 0 && type !== 'contact' ? p.sections.splice(ci, 0, s) : p.sections.push(s)); }, { structural: true }); return id; }
function addItem(sid) { let id; commit('Add item', p => { const s = findSection(p, sid), it = newItem(s.type); id = it.id; s.items.push(it); }, { structural: true }); return id; }
function removeItem(sid, iid) { commit('Delete item', p => { const s = findSection(p, sid); s.items = s.items.filter(i => i.id !== iid); }, { structural: true }); }
function duplicateItem(sid, iid) { let id; commit('Duplicate item', p => { const s = findSection(p, sid), i = s.items.findIndex(x => x.id === iid), c = clone(s.items[i]); c.id = uid('i'); id = c.id; if (c.title) c.title += ' copy'; s.items.splice(i + 1, 0, c); }, { structural: true }); return id; }
function moveItem(sid, iid, d) { commit('Move item', p => { const s = findSection(p, sid), i = s.items.findIndex(x => x.id === iid), j = i + d; if (j < 0 || j >= s.items.length) return; [s.items[i], s.items[j]] = [s.items[j], s.items[i]]; }, { structural: true }); }
function addSocial() { commit('Add link', p => p.socials.push({ id: uid('o'), label: 'Website', url: '' }), { structural: true }); }
function removeSocial(id) { commit('Remove link', p => { p.socials = p.socials.filter(x => x.id !== id); }, { structural: true }); }
function clearSample() { commit('Clear sample content', p => { Object.keys(p.person).forEach(k => p.person[k] = ''); p.socials = []; p.sections.forEach(s => { s.items = []; Object.keys(s.data).forEach(k => { if (!['cta', 'cta2', 'ctaUrl', 'cta2Url', 'button', 'formLabel'].includes(k)) s.data[k] = ''; }); }); }, { structural: true }); }
function switchTemplate(id) {
  commit('Switch template', p => { const keepEs = p.design.elementStyles, nd = makeDesign(id); nd.elementStyles = keepEs; p.design = nd; }, { structural: true });
}
function setSystem(system) { const id = TEMPLATES[S.project.design.template].system === system ? S.project.design.template : DEFAULT_TPL[system]; if (id !== S.project.design.template) switchTemplate(id); }

/* ----- projects ----- */
async function createProject(o) { const p = newProject(o); S._cache.set(p.id, p); S.project = p; S.past = []; S.future = []; S.variations = []; S.activeVar = null; S.codeDraft = { html: null, css: null, js: null, dirty: false }; S.saveState = 'unsaved'; LS.set('pv:last', p.id); await saveNow(); emit('project'); return p; }
async function duplicateProject(id) { const src = S._cache.get(id); if (!src) return; const c = clone(src); c.id = uid('p'); c.name = src.name + ' copy'; c.createdAt = c.updatedAt = Date.now(); S._cache.set(c.id, c); await DB.put(c); S.baseStamp[c.id] = c.updatedAt; upsertIndex(c); return c; }
/* Keep a Make It Yours design without applying it: copy the whole portfolio (content, assets, code) with that design as its own project. */
async function saveVariationAsProject(vid) {
  const v = S.variations.find(x => x.id === vid), src = S.project; if (!v || !src) return null;
  const c = clone(src); c.id = uid('p'); c.name = (src.name + ' · ' + v.label).slice(0, 80); c.design = clone(v.design); c.versions = []; c.createdAt = c.updatedAt = Date.now();
  S._cache.set(c.id, c); await DB.put(c); S.baseStamp[c.id] = c.updatedAt; upsertIndex(c); return c;
}
async function deleteProject(id) { await DB.del(id); S._cache.delete(id); S.index = S.index.filter(x => x.id !== id); if (S.project && S.project.id === id) { S.project = null; LS.del('pv:last'); } }
function renameProject(id, name) { const p = S._cache.get(id); if (!p) return; p.name = name.trim().slice(0, 80) || p.name; p.updatedAt = Date.now(); DB.put(p).then(() => { S.baseStamp[id] = p.updatedAt; }).catch(e => toast('Could not save the new name: ' + e.message, 'err')); upsertIndex(p); if (S.project && S.project.id === id) emit('save'); }
async function importProject(text) { const p = sanitizeProject(JSON.parse(text)); if (S._cache.has(p.id)) { p.id = uid('p'); p.name += ' (imported)'; } S._cache.set(p.id, p); await DB.put(p); S.baseStamp[p.id] = p.updatedAt; upsertIndex(p); return p; }
function saveVersion(name) { const p = S.project; p.versions = [{ id: uid('v'), name: name || 'Version ' + (p.versions.length + 1), at: Date.now(), doc: snap() }, ...p.versions].slice(0, 15); markDirty(); }
function restoreVersion(id) { const v = S.project.versions.find(x => x.id === id); if (!v) return; commit('Restore version', p => { const d = JSON.parse(v.doc); DOC_KEYS.forEach(k => { if (k !== 'name') p[k] = d[k]; }); }, { structural: true }); }
function toggleFav(id) { S.favs = S.favs.includes(id) ? S.favs.filter(x => x !== id) : [...S.favs, id]; LS.set('pv:favs', JSON.stringify(S.favs)); }

/* ----- assets ----- */
function readAsDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Could not read file')); r.readAsDataURL(file); }); }
async function addAsset(file, { max = 1600 } = {}) {
  const p = S.project; let dataUrl, mime = file.type;
  if (/^image\/(png|jpe?g|webp|gif)$/.test(mime)) {
    dataUrl = await readAsDataURL(file);
    if (mime !== 'image/gif' && file.size > 150 * 1024) {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Not a valid image')); i.src = dataUrl; });
      /* shrink until the embedded copy is small enough to keep exports light */
      for (const [mx, q] of [[max, .86], [1280, .78], [1000, .7], [800, .6]]) {
        const k = Math.min(1, mx / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const out = c.toDataURL(mime === 'image/png' && file.size < 600 * 1024 ? 'image/png' : 'image/jpeg', q);
        if (out.length < dataUrl.length) { dataUrl = out; mime = out.slice(5, out.indexOf(';')); }
        if (dataUrl.length < 700 * 1024) break;
      }
    }
  } else if (mime === 'image/svg+xml') { if (file.size > 300 * 1024) throw new Error('SVG is larger than 300 KB'); dataUrl = await readAsDataURL(file); }
  else if (mime === 'application/pdf') { if (file.size > 3 * 1024 * 1024) throw new Error('PDF is larger than 3 MB — host it elsewhere and paste its link instead.'); dataUrl = await readAsDataURL(file); }
  else throw new Error('Unsupported file type. Use PNG, JPG, WebP, GIF, SVG or PDF.');
  const id = uid('a'); p.assets[id] = { name: file.name, mime, dataUrl, size: Math.round(dataUrl.length * .75) }; markDirty(); return 'asset:' + id;
}
function usedAssetIds(p) { const s = JSON.stringify([p.person, p.sections, p.seo, p.code]) + JSON.stringify(p.design); return [...new Set([...s.matchAll(/asset:([\w-]+)/g)].map(m => m[1]))].filter(id => p.assets[id]); }
function pruneAssets() { const used = new Set(usedAssetIds(S.project)); Object.keys(S.project.assets).forEach(k => { if (!used.has(k)) delete S.project.assets[k]; }); }

/* ----- variations (temporary, separate from the saved design) ----- */
function previewProject() { const p = S.project; if (!p) return p; const v = S.variations.find(x => x.id === S.activeVar); return v ? { ...p, design: v.design } : p; }
function applyVariation(id) { const v = S.variations.find(x => x.id === id); if (!v) return; commit('Apply variation: ' + v.label, p => { v.design.elementStyles = p.design.elementStyles; p.design = clone(v.design); }, { structural: true }); S.variations = []; S.activeVar = null; S.compare = false; S.lastApplied = true; emit('variations'); }
function discardVariations() { S.variations = []; S.activeVar = null; S.compare = false; emit('variations'); emit('doc', { structural: false, source: 'variation' }); }
window.addEventListener('beforeunload', e => { if (S.saveState === 'unsaved' || S.saveState === 'saving' || S.saveState === 'error' || S.saveState === 'conflict' || S.codeDraft.dirty || (DB.mode === 'memory' && S.project && (S.past.length || S.lastSaved))) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
