/* Preview-only bridge. Runs inside the sandboxed iframe; never included in exports. */
(function () {
  var P = window.__PV || {}, d = document, sel = null, editing = null;
  function send(m) { try { parent.postMessage(Object.assign({ pv: 1 }, m), '*'); } catch (e) {} }
  var st = d.createElement('style');
  st.textContent = '[data-pv]{cursor:pointer}[data-pv]:hover{outline:1.5px dashed rgba(99,102,241,.85);outline-offset:2px}.pv-sel,.pv-sel:hover{outline:2.5px solid #4f46e5!important;outline-offset:3px;box-shadow:0 0 0 6px rgba(99,102,241,.14)}[contenteditable]{outline:2.5px solid #f59e0b!important;cursor:text;min-width:1ch}.sec[data-pv]:hover{outline-offset:-2px}html.pv-static .rv{opacity:1!important;transform:none!important;clip-path:none!important}';
  d.head.appendChild(st);
  function pick(t) { while (t && t.nodeType === 1) { if (t.hasAttribute('data-pv')) return t; t = t.parentNode; } return null; }
  function report(el) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    send({ t: 'rect', rect: { x: r.left, y: r.top, w: r.width, h: r.height }, vw: innerWidth, vh: innerHeight });
  }
  function select(el, silent) {
    if (sel) sel.classList.remove('pv-sel');
    sel = el; if (!el) { if (!silent) send({ t: 'select', path: null }); return; }
    el.classList.add('pv-sel');
    if (!silent) send({ t: 'select', path: el.getAttribute('data-pv'), kind: el.getAttribute('data-k'), link: el.getAttribute('data-link') || null, text: el.getAttribute('data-k') === 'text' || el.getAttribute('data-k') === 'button' ? el.innerText : '' });
    report(el);
  }
  d.addEventListener('click', function (e) {
    if (editing) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]:not([data-pv])');
    if (a && !a.closest('[data-pv]:not(.nav)')) return; // in-page anchors keep working
    e.preventDefault(); e.stopPropagation();
    var el = pick(e.target);
    if (!el) { select(null); return; }
    select(el);
  }, true);
  d.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  d.addEventListener('dblclick', function (e) { var el = pick(e.target); if (el && el.getAttribute('data-k') === 'text') startEdit(el); }, true);
  function startEdit(el) {
    if (!el || editing) return; editing = el; var before = el.innerText, multi = el.hasAttribute('data-multi');
    el.setAttribute('contenteditable', 'true'); el.focus();
    var rg = d.createRange(); rg.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(rg);
    function done(commit) {
      el.removeEventListener('blur', onBlur); el.removeEventListener('keydown', onKey);
      el.removeAttribute('contenteditable'); editing = null;
      var v = el.innerText.replace(/\u00a0/g, ' ');
      if (!multi) v = v.replace(/\s*\n+\s*/g, ' ');
      v = v.replace(/\n{3,}/g, '\n\n').trim();
      if (commit && v !== before.trim()) send({ t: 'edit', path: el.getAttribute('data-pv'), value: v });
      else el.innerText = before;
      select(el);
    }
    function onBlur() { done(true); }
    function onKey(ev) { if (ev.key === 'Escape') { ev.preventDefault(); done(false); } else if (ev.key === 'Enter' && !multi) { ev.preventDefault(); done(true); } }
    el.addEventListener('blur', onBlur); el.addEventListener('keydown', onKey);
  }
  var tick = 0;
  function onMove() { if (tick) return; tick = requestAnimationFrame(function () { tick = 0; send({ t: 'scroll', y: scrollY }); if (sel) report(sel); }); }
  addEventListener('scroll', onMove, { passive: true }); addEventListener('resize', onMove);
  addEventListener('message', function (e) {
    var m = e.data; if (!m || !m.pv) return;
    if (m.t === 'select') { var el = m.path ? d.querySelector('[data-pv="' + m.path.replace(/"/g, '') + '"]') : null; select(el, true); if (el && m.scroll) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    if (m.t === 'edit') { var t = d.querySelector('[data-pv="' + String(m.path).replace(/"/g, '') + '"]'); if (t) startEdit(t); }
    if (m.t === 'scrollto') { var s = d.getElementById(m.id); if (s) s.scrollIntoView({ behavior: 'smooth' }); }
  });
  addEventListener('error', function (e) { send({ t: 'error', msg: e.message, line: e.lineno, col: e.colno }); });
  addEventListener('unhandledrejection', function (e) { send({ t: 'error', msg: 'Unhandled promise rejection: ' + (e.reason && e.reason.message || e.reason) }); });
  function ready() {
    if (P.scroll) scrollTo({ top: P.scroll, behavior: 'instant' });
    if (!P.animate) document.documentElement.classList.add('pv-static');
    if (P.selected) { var el = d.querySelector('[data-pv="' + P.selected + '"]'); if (el) select(el, true); }
    send({ t: 'ready', height: d.documentElement.scrollHeight });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready); else ready();
  addEventListener('load', function () { if (sel) report(sel); });
})();
