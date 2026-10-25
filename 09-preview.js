/* ===== 09-preview: sandboxed live preview + click-to-edit bridge host ===== */
const Preview = { inst: null };
const DEV = { desktop: 1280, tablet: 820, mobile: 390 };
const KIND_LABEL = { text: 'Text', button: 'Button', card: 'Card', section: 'Section', image: 'Image', link: 'Link', nav: 'Navigation' };

function mountPreview(host, { interactive = true } = {}) {
  destroyPreview();
  host.innerHTML = `<div class="pv-wrap ${interactive ? 'int' : ''}"><div class="pv-stage"><div class="pv-dev"><div class="pv-frame"><iframe sandbox="allow-scripts" title="Live portfolio preview"></iframe></div></div><div class="pv-cmp" hidden></div><div class="sel-tb" hidden role="toolbar" aria-label="Selected element tools"></div></div></div>`;
  const wrap = $('.pv-wrap', host), stage = $('.pv-stage', host), frame = $('iframe', host), inst = { host, wrap, stage, frame, dev: $('.pv-dev', host), fr: $('.pv-frame', host), interactive, scroll: 0, scale: 1, animKey: '', animate: true, timer: 0, rect: null };
  Preview.inst = inst; inst.ro = new ResizeObserver(() => layoutPreview()); inst.ro.observe(stage);
  refreshPreview(true); return inst;
}
function destroyPreview() { const i = Preview.inst; if (!i) return; i.ro.disconnect(); clearTimeout(i.timer); Preview.inst = null; }

/* Re-assigning srcdoc on an existing iframe adds a session-history entry (it would hijack the browser Back button).
   Inserting a brand-new iframe does not, so we double-buffer: build the new frame, then drop the old one once it has loaded. */
function swapFrame(j, doc) {
  const old = j.frame, nf = document.createElement('iframe'); nf.setAttribute('sandbox', 'allow-scripts'); nf.title = 'Live portfolio preview'; nf.className = 'fresh';
  nf.srcdoc = doc; j.frame = nf; let fin = false, t;
  const done = () => { if (fin) return; fin = true; clearTimeout(t); if (j.frame !== nf) { nf.remove(); old.remove(); return; } nf.classList.remove('fresh'); old.remove(); $$('iframe', j.fr).forEach(f => f !== nf && f.remove()); };
  nf.addEventListener('load', done, { once: true }); t = setTimeout(done, 4000); j.fr.appendChild(nf);
}
function layoutPreview() {
  const i = Preview.inst; if (!i) return; const sw = i.stage.clientWidth, sh = i.stage.clientHeight; if (!sw || !sh) return;
  if (S.ui.fullscreen && i.wrap.classList.contains('full') === false) i.wrap.classList.add('full');
  let dw = DEV[S.ui.device] || 1280, scale = 1;
  if (S.ui.device === 'mobile' && sw <= 520) dw = sw; else scale = Math.min(1, (sw - 16) / dw);
  i.scale = scale; i.dev.style.width = dw * scale + 'px'; i.dev.style.height = sh + 'px';
  i.fr.style.width = dw + 'px'; i.fr.style.height = sh / scale + 'px'; i.fr.style.transform = `scale(${scale})`;
  i.dev.classList.toggle('devframe', S.ui.device !== 'desktop' && sw > 520);
  if (S.compare && S.activeVar) layoutCompare();
  positionToolbar();
}
function layoutCompare() {
  const i = Preview.inst, c = $('.pv-cmp', i.host); if (!c || c.hidden) return;
  $$('.cmp-col', c).forEach(col => { const w = col.clientWidth, f = $('iframe', col); const k = w / 1280; f.style.width = '1280px'; f.style.height = (col.clientHeight / k) + 'px'; f.style.transform = `scale(${k})`; });
}
function previewDoc(proj, o = {}) { const code = o.interactive ? previewCode(proj, o.animate) : effectiveCode(proj); return assembleDocument(proj, { mode: o.interactive ? 'preview' : 'export', embedded: true, code, animate: o.animate, scroll: o.scroll, selected: o.selected }); }

function refreshPreview(immediate) {
  const i = Preview.inst; if (!i) return; clearTimeout(i.timer);
  const run = () => {
    const j = Preview.inst; if (!j) return; const pp = previewProject(); if (!pp) return;
    const animKey = JSON.stringify(pp.design.anim) + pp.design.template + (S.activeVar || '');
    const animate = !!(j.forceAnim || animKey !== j.animKey || !j.loaded); j.animKey = animKey; j.forceAnim = false; j.loaded = true;
    const cmp = $('.pv-cmp', j.host), compare = S.compare && S.activeVar;
    j.dev.hidden = !!compare; cmp.hidden = !compare; if (!compare) cmp.innerHTML = ''; if (compare) j.wrap.classList.add('comparing'); else j.wrap.classList.remove('comparing');
    if (compare) {
      const v = S.variations.find(x => x.id === S.activeVar), cur = S.project;
      cmp.innerHTML = `<div class="cmp-col"><span class="cmp-l">Current</span><iframe sandbox="allow-scripts" title="Current design" srcdoc="${esc(previewDoc(cur, {}))}"></iframe></div><div class="cmp-col"><span class="cmp-l new">${esc(v.label)}</span><iframe sandbox="allow-scripts" title="Variation" srcdoc="${esc(previewDoc({ ...cur, design: v.design }, {}))}"></iframe></div>`; layoutCompare(); hideToolbar(); return;
    }
    swapFrame(j, previewDoc(pp, { interactive: j.interactive, animate: animate && S.ui.animate, scroll: j.scroll, selected: S.ui.selected })); layoutPreview();
  };
  immediate ? run() : (i.timer = setTimeout(run, 110));
}
const postPreview = m => { const i = Preview.inst; if (i && i.frame.contentWindow) i.frame.contentWindow.postMessage({ pv: 1, ...m }, '*'); };
function replayAnimations() { const i = Preview.inst; if (i) { i.forceAnim = true; i.scroll = 0; refreshPreview(true); } }

/* ----- selection (click-to-edit) ----- */
function selectPath(path, kind, link, o = {}) {
  S.ui.selected = path || null; S.ui.selKind = path ? kind : null; S.ui.selLink = link || null;
  if (path && o.sync) postPreview({ t: 'select', path, scroll: !!o.scroll });
  if (!path) postPreview({ t: 'select', path: null });
  if (!path) hideToolbar(); emit('selection', { path, fromPreview: !!o.fromPreview });
}
function selInfo() {
  const path = S.ui.selected, p = S.project; if (!path || !p) return null;
  if (path === 'nav') return { path, kind: 'nav', r: {} };
  const r = parsePath(path); if (!r.sid) return { path, kind: S.ui.selKind, r };
  const sec = findSection(p, r.sid); if (!sec) return null; const item = r.iid ? sec.items.find(i => i.id === r.iid) : null; if (r.iid && !item) return null;
  return { path, kind: S.ui.selKind, r, sec, item };
}
function parentPath(path) { const r = path === 'nav' ? {} : parsePath(path); if (!r.sid) return null; if (r.iid && r.field) return [`s/${r.sid}/i/${r.iid}`, 'card']; if (r.iid) return [`s/${r.sid}`, 'section']; if (r.field && r.field !== 'title' || r.data) return [`s/${r.sid}`, 'section']; if (r.field === 'title') return [`s/${r.sid}`, 'section']; return null; }
function toolbarHTML() {
  const si = selInfo(); if (!si) return ''; const kind = si.kind, r = si.r, par = parentPath(si.path), isItem = r.iid && !r.field, isSec = r.sid && !r.iid && !r.field && !r.data;
  const b = (act, ic, label, extra = '') => `<button data-act="${act}" aria-label="${label}" title="${label}" ${extra}>${ico(ic, 17)}</button>`;
  const lbl = `<span class="tb-l">${KIND_LABEL[kind] || 'Element'}</span>`;
  return lbl + (kind === 'text' ? b('tb-edit', 'edit', 'Edit text') : '') + b('tb-insp', 'sliders', 'Open settings') + (par ? b('tb-parent', 'layers', 'Select parent') : '')
    + (isItem ? b('tb-up', 'up', 'Move up') + b('tb-down', 'down', 'Move down') + b('tb-dup', 'copy', 'Duplicate') + b('tb-del', 'trash', 'Delete') : '')
    + (isSec ? b('tb-up', 'up', 'Move section up') + b('tb-down', 'down', 'Move section down') + b('tb-hide', 'eyeoff', 'Hide section') + b('tb-dup', 'copy', 'Duplicate section') + b('tb-del', 'trash', 'Delete section') : '') + b('tb-x', 'x', 'Deselect');
}
function positionToolbar(rect) {
  const i = Preview.inst; if (!i) return; const tb = $('.sel-tb', i.host); if (!tb) return; if (rect) i.rect = rect;
  if (!S.ui.selected || !i.interactive || (S.compare && S.activeVar)) { tb.hidden = true; return; }
  if (!tb.dataset.sig || tb.dataset.sig !== S.ui.selected + S.ui.selKind) { tb.innerHTML = toolbarHTML(); tb.dataset.sig = S.ui.selected + S.ui.selKind; }
  tb.hidden = false; const mobile = matchMedia('(max-width:900px)').matches;
  tb.classList.toggle('dock', mobile); if (mobile) { tb.style.left = tb.style.top = ''; return; }
  const r = i.rect; if (!r) return; const sr = i.stage.getBoundingClientRect(), dr = i.fr.getBoundingClientRect();
  let x = dr.left - sr.left + r.x * i.scale, y = dr.top - sr.top + r.y * i.scale - tb.offsetHeight - 8;
  if (y < 4) y = dr.top - sr.top + (r.y + r.h) * i.scale + 8; y = clamp(y, 4, sr.height - tb.offsetHeight - 4); x = clamp(x, 4, Math.max(4, sr.width - tb.offsetWidth - 4));
  tb.style.left = x + 'px'; tb.style.top = y + 'px';
}
function hideToolbar() { const i = Preview.inst; if (i) { const tb = $('.sel-tb', i.host); tb.hidden = true; tb.dataset.sig = ''; i.rect = null; } }

window.addEventListener('message', e => {
  /* a click on a real link inside any of our preview frames: nothing navigates in a preview, so say why */
  /* Escape pressed while focus is inside a preview frame: forward it so dialogs / full screen still close */
  if (e.data && e.data.pv && e.data.t === 'esc' && [...document.querySelectorAll('iframe')].some(f => f.contentWindow === e.source)) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); return; }
  if (e.data && e.data.pv && e.data.t === 'link' && typeof e.data.href === 'string' && [...document.querySelectorAll('iframe')].some(f => f.contentWindow === e.source)) { toast('Links are switched off in the preview — ' + e.data.href.replace(/^https?:\/\//, '').slice(0, 40) + ' will work on your published site.', 'warn'); return; }
  const i = Preview.inst, m = e.data; if (!i || !m || !m.pv) return;
  if (e.source === i.frame.contentWindow && i.interactive) {
    switch (m.t) {
      case 'select': { const KINDS = ['text', 'button', 'card', 'section', 'image', 'link', 'nav'], path = typeof m.path === 'string' && /^[\w\/-]{1,120}$/.test(m.path) ? m.path : null;
        if (path) selectPath(path, KINDS.includes(m.kind) ? m.kind : 'text', typeof m.link === 'string' ? m.link.slice(0, 300) : '', { fromPreview: true }); else selectPath(null); break; }
      case 'rect': if (m.rect && ['x', 'y', 'w', 'h'].every(k => isFinite(+m.rect[k]))) positionToolbar({ x: +m.rect.x, y: +m.rect.y, w: +m.rect.w, h: +m.rect.h }); break;
      case 'scroll': i.scroll = snum(m.y, 0, 0, 1e7); break;
      case 'ready': if (S.ui.selected) postPreview({ t: 'select', path: S.ui.selected }); emit('previewready'); break;
      case 'edit': {
        /* The preview frame runs user-written JS, so its messages are untrusted input: only real text fields may be edited, as plain strings. */
        if (effectiveCode(S.project).manual.html) { toast('HTML is manually edited — restore the generated HTML in the Code editor to use click-to-edit.', 'warn'); refreshPreview(true); break; }
        if (typeof m.value !== 'string' || m.value.length > 20000 || !inlineEditable(S.project, m.path)) break;
        editPath(m.path, m.value); emit('selection', { path: m.path }); break;
      }
      case 'error': emit('runtimeerror', { msg: sstr(m.msg, 300), line: snum(m.line, 0, 0, 1e7) }); break;
    }
  } else if (m.t === 'error') emit('runtimeerror', { msg: sstr(m.msg, 300), line: snum(m.line, 0, 0, 1e7) });
});
