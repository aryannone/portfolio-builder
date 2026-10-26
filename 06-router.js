/* ===== 06-router: one centralised hash router with history index, guards and logical parents ===== */
const ROUTES = {
  '/': { title: 'PortfolioVerse', parent: null }, '/projects': { title: 'Your portfolios', parent: '/' }, '/gallery': { title: 'Templates', parent: '/' },
  '/new/system': { title: 'Choose a style', parent: '/', step: 1 }, '/new/template': { title: 'Pick a template', parent: '/new/system', step: 2, project: true },
  '/new/info': { title: 'About you', parent: '/new/template', step: 3, project: true }, '/new/sections': { title: 'Choose sections', parent: '/new/info', step: 4, project: true },
  '/new/customize': { title: 'Customize', parent: '/new/sections', step: 5, project: true }, '/editor': { title: 'Visual editor', parent: '/new/customize', step: 6, project: true },
  '/editor/code': { title: 'Code editor', parent: '/editor', step: 7, project: true }, '/editor/export': { title: 'Export', parent: '/editor/code', step: 8, project: true },
};
const STEPS = [[1, 'Style', '/new/system'], [2, 'Template', '/new/template'], [3, 'You', '/new/info'], [4, 'Sections', '/new/sections'], [5, 'Customize', '/new/customize'], [6, 'Edit', '/editor'], [7, 'Code', '/editor/code'], [8, 'Export', '/editor/export']];
const Router = {
  idx: 0, cur: { path: '/', q: {} }, guard: null, leave: null, onPrompt: null, onStay: null, ignorePop: false, onResolve: null, mem: false, stack: [],
  parse(hash) { const h = String(hash || '').replace(/^#/, '') || '/', [path, qs] = h.split('?'); return { path: ROUTES[path] ? path : '/', q: Object.fromEntries(new URLSearchParams(qs || '')) }; },
  url(path, q) { const s = new URLSearchParams(q || {}).toString(); return '#' + path + (s ? '?' + s : ''); },
  /* History API can throw in sandboxed viewers (opaque origin). Then we keep our own stack ("memory mode"): same behaviour, no URL updates. */
  hist(kind, t, idx) { if (this.mem) return false; try { history[kind + 'State']({ idx }, '', this.url(t.path, t.q)); return true; } catch (e) { this.mem = true; return false; } },
  init(cb) {
    this.onResolve = cb; let t = { path: '/', q: {} };
    try { this.idx = (history.state && history.state.idx) || 0; t = this.parse(location.hash); addEventListener('popstate', e => this.onPop(e)); } catch (e) { this.mem = true; }
    this.cur = t; this.stack = []; this.stack[this.idx] = t; this.settle(t, true);
  },
  async canLeave(target) {
    if (target.path === this.cur.path) return true;
    if (S.saveState === 'unsaved') await saveNow();
    const msgs = []; if (this.guard) { const m = this.guard(target); if (m) msgs.push(m); }
    if (S.saveState === 'error') msgs.push('Your latest changes could not be saved to this browser.');
    if (!msgs.length) return true;
    if (this.onPrompt) this.onPrompt();
    const leave = await confirmDialog({ title: 'Leave this screen?', body: msgs.join(' '), ok: 'Leave anyway', cancel: 'Stay here', danger: true });
    if (!leave && this.onStay) this.onStay();
    return leave;
  },
  async go(path, { q = {}, replace = false } = {}) {
    const t = { path, q }; if (!(await this.canLeave(t))) return false;
    if (replace) { this.hist('replace', t, this.idx); this.stack[this.idx] = t; }
    else { this.hist('push', t, this.idx + 1); this.idx++; this.stack.length = this.idx; this.stack[this.idx] = t; }
    this.cur = t; this.settle(t); return true;
  },
  setQuery(q, { replace = true } = {}) {
    const t = { path: this.cur.path, q: { ...this.cur.q, ...q } }; Object.keys(t.q).forEach(k => t.q[k] == null && delete t.q[k]);
    if (replace) { this.hist('replace', t, this.idx); this.stack[this.idx] = t; } else { this.hist('push', t, this.idx + 1); this.idx++; this.stack.length = this.idx; this.stack[this.idx] = t; }
    this.cur = t;
  },
  async back() {
    if (this.idx > 0) { if (this.mem) return this.travel(this.idx - 1); history.back(); }
    else { const par = (ROUTES[this.cur.path] || {}).parent; if (par != null) this.go(par, { replace: true }); }
  },
  async travel(ni) { const t = this.stack[ni]; if (!t) return; if (!(await this.canLeave(t))) return; this.idx = ni; this.cur = t; this.settle(t); },
  async onPop(e) {
    if (this.ignorePop) { this.ignorePop = false; return; }
    const ni = (e.state && e.state.idx) || 0, t = this.parse(location.hash);
    if (!(await this.canLeave(t))) { this.ignorePop = true; history.go(this.idx - ni); return; }
    this.idx = ni; this.stack[ni] = t; this.cur = t; this.settle(t);
  },
  settle(t, first) {
    const r = ROUTES[t.path];
    if (r.project && !S.project) { const id = LS.get('pv:last'); if (!(id && loadProject(id))) { const nt = { path: '/projects', q: {} }; this.hist('replace', nt, this.idx); this.stack[this.idx] = nt; this.cur = nt; } }
    if (this.leave) { const f = this.leave; this.leave = null; f(); }
    if (first) this.hist('replace', this.cur, this.idx);   /* normalise odd/unknown hashes so URL and screen always agree */
    this.guard = null; this.onResolve(this.cur, first);
  },
  hasPrev() { return this.idx > 0 || (ROUTES[this.cur.path] || {}).parent != null; },
};
