/* ===== 07-ui-common: icons, dialogs, toasts, form fields, app bar, step footer ===== */
const IC = {
  back: 'M15 18l-6-6 6-6', next: 'M9 18l6-6-6-6', undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3', redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z', eyeoff: 'M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.2A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6C3.7 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 004.4-1',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', up: 'M12 19V5M5 12l7-7 7 7', down: 'M12 5v14M19 12l-7 7-7-7', x: 'M18 6L6 18M6 6l12 12',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4', code: 'M16 18l6-6-6-6M8 6l-6 6 6 6', monitor: 'M3 4h18v12H3zM8 20h8M12 16v4', tablet: 'M5 2h14v20H5zM11 18h2', phone: 'M7 2h10v20H7zM11 18h2',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5', download: 'M12 3v12M7 10l5 5 5-5M4 21h16', plus: 'M12 5v14M5 12h14', menu: 'M4 6h16M4 12h16M4 18h16',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z', check: 'M5 13l4 4L19 7', chev: 'M6 9l6 6 6-6', ext: 'M14 4h6v6M20 4L10 14M18 14v6H4V6h6',
  image: 'M3 4h18v16H3zM3 16l5-5 5 5 3-3 5 5M9 8.5a.5.5 0 100 1', layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5', star: 'M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2-5.6 3.2 1.3-6.2L3 9.5l6.3-.7z', home: 'M3 11l9-8 9 8M5 10v10h14V10', folder: 'M3 6h6l2 2h10v11H3z',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4', play: 'M6 4l14 8-14 8z', refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7', clock: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z', cursor: 'M5 3l14 7-6 2-2 6z', globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  upload: 'M12 15V3M7 8l5-5 5 5M4 21h16', link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1', file: 'M6 2h9l5 5v15H6zM14 2v6h6', warn: 'M12 3l10 18H2zM12 10v5M12 18v.5', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', more: 'M5 12h.01M12 12h.01M19 12h.01',
};
const ico = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n] || ''}"/></svg>`;

/* ----- toasts & dialogs ----- */
function toast(msg, kind = 'ok') { const t = document.createElement('div'); t.className = 'toast ' + kind; t.setAttribute('role', kind === 'err' ? 'alert' : 'status'); t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3700); }
/* While a modal is open, everything behind it is inert: not focusable, not clickable, hidden from screen readers. */
function setInert(on) { ['#app', '#banner'].forEach(q => { const e = $(q); if (e) on ? e.setAttribute('inert', '') : e.removeAttribute('inert'); }); }
function openDialog({ title, body = '', actions = [], back = false, wide = false, onMount, cls = '' }) {
  return new Promise(res => {
    const wrap = document.createElement('div'); wrap.className = 'dlg-wrap';
    const btns = actions.map(a => `<button class="btn ${a.kind || 'ghost'}" data-dlg="${a.id}"${a.disabled ? ' disabled' : ''}>${a.label}</button>`).join('');
    wrap.innerHTML = `<div class="dlg ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="dlg-h">${back ? `<button class="iconbtn" data-dlg="__back" aria-label="Back">${ico('back')}</button>` : ''}<h2>${esc(title)}</h2><button class="iconbtn" data-dlg="__cancel" aria-label="Close">${ico('x')}</button></header><div class="dlg-b">${body}</div><footer class="dlg-f">${btns}</footer></div>`;
    const prev = document.activeElement; let done = false;
    const close = v => { if (done) return; done = true; document.removeEventListener('keydown', onKey, true); wrap.remove(); const open = !!$('.dlg-wrap'); document.body.classList.toggle('modal-open', open); setInert(open);
      /* restore focus to the control that opened the dialog; if a re-render removed it, fall back to the screen heading */
      if (prev && document.contains(prev) && prev.focus) prev.focus(); else { const h = $('#app h1'); h && h.focus({ preventScroll: true }); } res(v); };
    const onKey = e => { if (wrap !== [...$$('.dlg-wrap')].pop()) return;
      if (e.key === 'Escape') { e.stopPropagation(); close(null); return; }
      if (e.key === 'Tab') { const f = [...wrap.querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea,[href],[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null); if (!f.length) { e.preventDefault(); return; }
        const first = f[0], last = f[f.length - 1], a = document.activeElement; if (!wrap.contains(a)) { e.preventDefault(); first.focus(); } else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); } } };
    wrap.addEventListener('click', e => { if (e.target === wrap) return close(null); const b = e.target.closest('[data-dlg]'); if (b) close(b.dataset.dlg === '__cancel' ? null : b.dataset.dlg); });
    document.addEventListener('keydown', onKey, true); $('#dialogs').appendChild(wrap); document.body.classList.add('modal-open'); setInert(true);
    wrap.close = close; onMount && onMount(wrap, close);
    (wrap.querySelector('[data-autofocus]') || wrap.querySelector('.dlg-f .btn:last-child') || wrap.querySelector('button')).focus();
  });
}
const confirmDialog = ({ title, body, ok = 'OK', cancel = 'Cancel', danger = false }) => openDialog({ title, body: `<p>${esc(body)}</p>`, actions: [{ id: 'no', label: cancel, kind: 'ghost' }, { id: 'yes', label: ok, kind: danger ? 'danger' : 'primary' }] }).then(v => v === 'yes');
window.__pdv = null;
async function askText(title, label, value, ok) {
  return new Promise(res => { openDialog({ title, body: `<label class="fld"><span>${esc(label)}</span><input id="pd-in" data-autofocus value="${esc(value || '')}" maxlength="80"></label>`, actions: [{ id: 'no', label: 'Cancel' }, { id: 'yes', label: ok || 'Save', kind: 'primary' }],
    onMount: (w, close) => { const inp = $('#pd-in', w); inp.select(); const fin = ok => { window.__pdv = inp.value; close(ok); }; inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin('yes'); }); w.addEventListener('click', e => { const b = e.target.closest('[data-dlg="yes"]'); if (b) window.__pdv = inp.value; }, true); } }).then(v => res(v === 'yes' ? window.__pdv : null)); });
}

/* ----- form fields: every control is bound to a model path via data-bind ----- */
function fld(f, value, path, o = {}) {
  const id = 'f-' + slug(path), attr = `data-bind="${esc(path)}" id="${id}"`, lab = esc(f.l);
  const wrapA = `class="fld" data-fld="${esc(path)}"`;
  switch (f.t) {
    case 'textarea': return `<label ${wrapA}><span>${lab}</span><textarea ${attr} rows="${f.rows || 3}" data-t="str">${esc(value || '')}</textarea></label>`;
    case 'range': return `<label ${wrapA}><span>${lab} <output>${+value || 0}</output></span><input type="range" min="0" max="100" ${attr} data-t="num" value="${+value || 0}"></label>`;
    case 'tags': return `<label ${wrapA}><span>${lab}</span><input ${attr} data-t="tags" value="${esc((value || []).join(', '))}"></label>`;
    case 'url': { const bad = value && cleanUrl(value) === null; return `<label ${wrapA}><span>${lab}</span><input ${attr} data-t="url" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="https://…" value="${esc(value || '')}" ${bad ? 'aria-invalid="true"' : ''} aria-describedby="${id}-err"><em class="err" id="${id}-err" role="alert" ${bad ? '' : 'hidden'}>This link can’t be used. Start with https:// (or mailto: / tel: / #section). Unsafe links like javascript: are blocked and will be left out of your site.</em></label>`; }
    case 'email': return `<label ${wrapA}><span>${lab}</span><input ${attr} type="email" data-t="str" inputmode="email" autocapitalize="off" value="${esc(value || '')}" ${value && !isEmail(value) ? 'aria-invalid="true"' : ''} aria-describedby="${id}-err"><em class="err" id="${id}-err" role="alert" ${value && !isEmail(value) ? '' : 'hidden'}>That doesn’t look like an email address (for example name@example.com).</em></label>`;
    case 'image': case 'file': return imageField(f, value, path);
    default: return `<label ${wrapA}><span>${lab}</span><input ${attr} data-t="str" value="${esc(value || '')}" autocomplete="off"></label>`;
  }
}
function imageField(f, value, path) {
  const v = String(value || ''), isAsset = /^asset:/.test(v), a = isAsset && S.project.assets[v.slice(6)], isPdf = f.t === 'file';
  const thumb = a && /^image/.test(a.mime) ? `<img src="${a.dataUrl}" alt="">` : (v && !isPdf && cleanUrl(v) ? `<img src="${esc(cleanUrl(v))}" alt="" onerror="this.style.opacity=.2">` : `<span>${ico(isPdf ? 'file' : 'image', 22)}</span>`);
  const bad = v && !isAsset && cleanUrl(v) === null;
  return `<div class="fld imgfld" data-fld="${esc(path)}"><span>${esc(f.l)}</span><div class="imgrow"><div class="thumb">${thumb}</div><div class="imgbtns"><button class="btn sm" data-act="upload" data-path="${esc(path)}" data-pdf="${isPdf ? 1 : 0}">${ico('upload', 16)} ${isAsset ? 'Replace' : 'Upload'}</button>${v ? `<button class="btn sm ghost" data-act="clearimg" data-path="${esc(path)}">Remove</button>` : ''}</div></div>${isAsset ? `<small class="muted">${esc(a ? a.name : 'missing file')} · ${a ? fmtBytes(a.size) : ''} · embedded in your site</small>` : `<input data-bind="${esc(path)}" data-t="url" inputmode="url" autocapitalize="off" placeholder="…or paste a link (https://)" aria-label="${esc(f.l)} — link" value="${esc(v)}" ${bad ? 'aria-invalid="true"' : ''}><em class="err" role="alert" ${bad ? '' : 'hidden'}>This link can’t be used. Start with https://.</em>${v && !bad ? '<small class="muted">Linked images need the internet and must stay online.</small>' : ''}`}</div>`;
}
const sel = (label, path, val, opts, o = {}) => `<label class="fld" data-fld="${esc(path)}"><span>${label}</span><select data-bind="${path}" data-t="${o.t || 'str'}">${opts.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select></label>`;
const rng = (label, path, val, min, max, step = 1, unit = '') => `<label class="fld" data-fld="${esc(path)}"><span>${label} <output>${esc(val)}${unit}</output></span><input type="range" data-bind="${path}" data-t="num" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${esc(val)}"></label>`;
const clr = (label, path, val) => `<label class="fld clr" data-fld="${esc(path)}"><span>${label}</span><input type="color" data-bind="${path}" data-t="str" value="${hexOk(val) ? val : '#000000'}"><code>${esc(val)}</code></label>`;
const chk = (label, path, val) => `<label class="fld chk" data-fld="${esc(path)}"><input type="checkbox" data-bind="${path}" data-t="bool" ${val ? 'checked' : ''}><span>${label}</span></label>`;
const fontOpts = () => Object.keys(FONTS).map(n => [n, n + (FONTS[n].local ? ' (no download)' : '')]);

/* ----- chrome ----- */
const saveLabel = () => S.saveState === 'saved' && DB.mode === 'memory' ? 'Session only' : ({ saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved', error: 'Not saved', conflict: 'Paused' }[S.saveState]);
const saveBadge = () => `<button class="savebadge ${S.saveState}" data-act="save" title="Autosaves in this browser. Click to save now."><i></i><span>${saveLabel()}</span></button>`;
function appbar({ title, sub = '', right = '', back = true }) {
  const can = back && Router.hasPrev();
  return `<header class="appbar"><button class="back" data-act="back" ${can ? '' : 'disabled'} aria-label="Back">${ico('back')}<span>Back</span></button><div class="ab-title"><h1>${esc(title)}</h1>${sub ? `<small>${esc(sub)}</small>` : ''}</div><div class="ab-right">${right}</div></header>`;
}
function stepper(n) { return `<nav class="stepper" aria-label="Progress"><ol>${STEPS.map(([i, l, path]) => `<li class="${i === n ? 'cur' : i < n ? 'done' : ''}">${S.project || i === 1 ? `<button data-act="goto" data-to="${path}" ${i === n ? 'aria-current="step"' : ''}>${i}<span>${l}</span></button>` : `<button disabled>${i}<span>${l}</span></button>`}</li>`).join('')}</ol></nav>`; }
function stepbar({ next, nextTo, nextLabel = 'Continue', nextDisabled = false, info = '' }) {
  return `<footer class="stepbar"><button class="btn ghost" data-act="back" ${Router.hasPrev() ? '' : 'disabled'}>${ico('back', 18)} Back</button><span class="si">${info}</span>${next !== false ? `<button class="btn primary" data-act="${next || 'next'}" data-to="${nextTo || ''}" ${nextDisabled ? 'disabled' : ''}>${esc(nextLabel)} ${ico('next', 18)}</button>` : ''}</footer>`;
}
function setVV() { const v = window.visualViewport, h = window.__pvVV || (v ? v.height : innerHeight), t = v ? v.offsetTop : 0, r = document.documentElement.style; r.setProperty('--vvh', h + 'px'); r.setProperty('--vvt', Math.max(0, t) + 'px'); document.documentElement.classList.toggle('vshort', h < 340); }

/* ----- persistent banner: save failures, edit conflicts and session-only storage must never be missable ----- */
function bannerSpec() {
  if (S.conflict) return { kind: 'danger', role: 'alert', msg: 'This portfolio was changed in another tab or window. Autosave is paused so nothing gets overwritten.', acts: [['bannerload', 'Load the latest version', 'btn sm primary'], ['bannermine', 'Keep my version', 'btn sm'], ['backup', 'Download my copy', 'btn sm ghost']] };
  if (S.saveState === 'error') return { kind: 'danger', role: 'alert', msg: 'Couldn’t save to this browser (' + (S.saveError || 'unknown error') + '). Your work is still on screen but is not stored — storage may be full or blocked.', acts: [['retrysave', 'Try again', 'btn sm primary'], ['backup', 'Download backup (JSON)', 'btn sm']] };
  if (S.project && DB.mode === 'memory') return { kind: 'warn', role: 'status', msg: 'Saving is blocked here, so your work lasts only while this page stays open.', acts: [['backup', 'Download backup (JSON)', 'btn sm primary']] };
  return null;
}
function renderBanner() {
  const el = $('#banner'); if (!el) return; const b = bannerSpec(), key = b ? b.msg + b.acts.length : '';
  if (el.dataset.key === key) return; el.dataset.key = key;
  if (!b) { el.hidden = true; el.innerHTML = ''; el.removeAttribute('role'); return; }
  el.hidden = false; el.className = 'banner ' + b.kind; el.setAttribute('role', b.role);
  el.innerHTML = `<p>${esc(b.msg)}</p><div class="ba">${b.acts.map(([a, l, c]) => `<button class="${c}" data-act="${a}">${esc(l)}</button>`).join('')}</div>`;
}
/* polite, de-duplicated announcement of save progress for screen readers */
let _lastSaidState = '';
function announceState() { const r = $('#sr-status'); if (!r) return; const say = { saved: 'All changes saved', conflict: '', error: '' }[S.saveState]; if (say && _lastSaidState !== S.saveState) { clearTimeout(announceState.t); announceState.t = setTimeout(() => { r.textContent = ''; setTimeout(() => r.textContent = say, 30); }, 900); } _lastSaidState = S.saveState; }
