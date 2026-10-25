/* ===== 11-code: code editor (HTML/CSS/JS) with manual-override protection ===== */
const Code = { tab: 'html', live: true, errors: [], timer: 0, pane: 'code' };
const hl = {
  html: s => esc(s).replace(/(&lt;\/?)([\w-]+)/g, '$1<b class="t">$2</b>').replace(/([\w-:]+)=(&quot;.*?&quot;)/g, '<b class="a">$1</b>=<b class="s">$2</b>').replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<b class="c">$1</b>'),
  css: s => esc(s).replace(/(\/\*[\s\S]*?\*\/)/g, '<b class="c">$1</b>').replace(/(--[\w-]+)/g, '<b class="v">$1</b>').replace(/([.#][\w-]+)(?=[^{}]*\{)/g, '<b class="t">$1</b>').replace(/([\w-]+)(?=:[^{};]*[;}])/g, '<b class="a">$1</b>'),
  js: s => esc(s).replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, '<b class="c">$1</b>').replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<b class="s">$1</b>').replace(/\b(var|let|const|function|return|if|else|for|while|new|this|typeof|true|false|null|break|continue|try|catch)\b/g, '<b class="k">$1</b>'),
};
function codeValue(tab) { const p = S.project, d = S.codeDraft; if (d[tab] != null) return d[tab]; if (tab === 'doc') return assembleDocument(p, { mode: 'export', assetMode: 'embed' }).replace(/data:[^"')\s]{80,}/g, m => m.slice(0, 40) + '…[embedded data]'); return effectiveCode(p)[tab]; }
function manualState() { return effectiveCode(S.project).manual; }
function codeHTML() {
  const m = manualState(), t = Code.tab, val = codeValue(t), ro = t === 'doc', anyManual = m.html || m.css || m.js, dirty = S.codeDraft.dirty;
  const tabs = ['html', 'css', 'js', 'doc'].map(k => `<button class="tab ${t === k ? 'on' : ''}" role="tab" aria-selected="${t === k}" data-act="codetab" data-t="${k}">${{ html: 'HTML', css: 'CSS', js: 'JavaScript', doc: 'Full file' }[k]}${m[k] ? '<i class="dot" title="Manually edited"></i>' : ''}</button>`).join('');
  return `<div class="codecol"><div class="tabs" role="tablist">${tabs}</div>
  ${anyManual ? `<div class="notice info"><strong>Manual edits active${['html', 'css', 'js'].filter(k => m[k]).map(k => ' · ' + k.toUpperCase()).join('')}.</strong> They are used in the preview and your export. Visual edits can’t update a tab you’ve edited by hand${m.html ? ' — click-to-edit is paused while HTML is manual' : ''}. <button class="btn sm" data-act="coderestore" data-t="all">Restore generated version</button></div>` : '<div class="notice">This is the real code generated from your content and design. Edit it freely — your changes are kept.</div>'}
  <div class="codebar"><label class="chk inline"><input type="checkbox" id="livechk" ${Code.live ? 'checked' : ''}><span>Live preview</span></label><button class="btn sm" data-act="codeapply" ${dirty ? '' : 'disabled'}>${ico('play', 14)} Apply</button><button class="btn sm" data-act="codecopy">${ico('copy', 14)} Copy</button><button class="btn sm ghost" data-act="coderestore" data-t="${t}" ${m[t] ? '' : 'disabled'}>Restore ${t.toUpperCase()}</button><span class="cstat" id="cstat">${dirty ? 'Unapplied changes' : 'In sync'}</span></div>
  <div class="editor ${ro ? 'ro' : ''}"><div class="gutter" id="gutter" aria-hidden="true"></div><div class="ed-in"><pre class="hl" id="hl" aria-hidden="true"></pre><textarea id="codearea" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="${t.toUpperCase()} code" ${ro ? 'readonly' : ''}></textarea></div></div>
  <div class="console" id="console" aria-live="polite">${consoleHTML()}</div></div>`;
}
const consoleHTML = () => Code.errors.length ? Code.errors.slice(-4).map(e => `<div class="cerr">${ico('warn', 14)} ${esc(e)}</div>`).join('') : '<div class="cok muted">Console: no runtime errors in the preview.</div>';
function syncEditor() {
  const ta = $('#codearea'); if (!ta) return; const v = codeValue(Code.tab); if (ta.value !== v) ta.value = v; paintEditor();
}
function paintEditor() {
  const ta = $('#codearea'), pre = $('#hl'), g = $('#gutter'); if (!ta) return; const t = Code.tab === 'doc' ? 'html' : Code.tab;
  pre.innerHTML = hl[t](ta.value) + '\n'; const n = ta.value.split('\n').length; if (g.dataset.n != n) { g.dataset.n = n; g.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); }
  pre.scrollTop = g.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft;
}
function commitCodeDraft() {
  const d = S.codeDraft; ['html', 'css', 'js'].forEach(k => { if (d[k] != null) { const gen = generated(S.project)[k]; commit('Edit ' + k, p => { p.code[k] = d[k] === gen ? null : d[k]; }, { coalesce: 'code:' + k, structural: true }); d[k] = null; } });
  d.dirty = false; Preview.inst && (Preview.inst.forceAnim = false);
}
function onCodeInput() {
  const ta = $('#codearea'), t = Code.tab; if (t === 'doc') return; S.codeDraft[t] = ta.value; S.codeDraft.dirty = true; paintEditor(); $('#cstat').textContent = 'Unapplied changes'; $('[data-act="codeapply"]').disabled = false;
  clearTimeout(Code.timer); if (Code.live) Code.timer = setTimeout(() => { commitCodeDraft(); Code.errors = []; updateCodeUI(); }, 700);
}
function updateCodeUI() { const c = $('#console'); if (c) c.innerHTML = consoleHTML(); const s = $('#cstat'); if (s) s.textContent = S.codeDraft.dirty ? 'Unapplied changes' : 'In sync'; const ap = $('[data-act="codeapply"]'); if (ap) ap.disabled = !S.codeDraft.dirty; $$('.codecol .tab').forEach(b => { const k = b.dataset.t, m = manualState(); const d = $('.dot', b); if (k !== 'doc') { if (m[k] && !d) b.insertAdjacentHTML('beforeend', '<i class="dot" title="Manually edited"></i>'); if (!m[k] && d) d.remove(); } }); }
async function restoreCode(which) {
  const names = which === 'all' ? 'all manual HTML, CSS and JavaScript edits' : 'your manual ' + which.toUpperCase() + ' edits';
  if (!(await confirmDialog({ title: 'Restore generated code?', body: `This discards ${names} and goes back to what the visual editor generates. You can undo this.`, ok: 'Restore generated', cancel: 'Keep my edits', danger: true }))) return;
  clearTimeout(Code.timer); (which === 'all' ? ['html', 'css', 'js'] : [which]).forEach(k => S.codeDraft[k] = null); S.codeDraft.dirty = false;
  commit('Restore generated code', p => { (which === 'all' ? ['html', 'css', 'js'] : [which]).forEach(k => p.code[k] = null); }, { structural: true }); toast('Restored the generated code'); renderCodeScreen();
}
function renderCodeScreen() { const c = $('#codehost'); if (!c) return; c.innerHTML = codeHTML(); syncEditor(); refreshCodePreview(); }
function refreshCodePreview() { if (Preview.inst) refreshPreview(true); }
function screenCode() {
  Code.errors = [];
  const right = `<button class="iconbtn tool" data-act="undo" aria-label="Undo" ${S.past.length ? '' : 'disabled'}>${ico('undo', 19)}</button><button class="iconbtn tool hide-m" data-act="redo" aria-label="Redo" ${S.future.length ? '' : 'disabled'}>${ico('redo', 19)}</button>${saveBadge()}<button class="btn primary nextbtn" data-act="goto" data-to="/editor/export"><span>Export</span>${ico('next', 17)}</button>`;
  Router.onPrompt = () => clearTimeout(Code.timer);
  Router.onStay = () => { if (Code.live && S.codeDraft.dirty) Code.timer = setTimeout(() => { commitCodeDraft(); Code.errors = []; updateCodeUI(); }, 700); };
  Router.leave = () => { clearTimeout(Code.timer); S.codeDraft = { html: null, css: null, js: null, dirty: false }; };
  return { guard: t => S.codeDraft.dirty ? 'You have code edits that haven’t been applied yet. Leaving will discard them.' : null,
    html: `<div class="screen wsx">${appbar({ title: 'Code editor', sub: 'Step 7 of 8', right })}${stepper(7)}<div class="seg-m show-m" role="group" aria-label="Code or preview"><button class="seg ${Code.pane === 'code' ? 'on' : ''}" data-act="codepane" data-v="code">${ico('code', 15)} Code</button><button class="seg ${Code.pane === 'prev' ? 'on' : ''}" data-act="codepane" data-v="prev">${ico('eye', 15)} Preview</button></div>
    <main class="codews pane-${Code.pane}"><section id="codehost" class="codehost"></section><section class="codeprev"><div class="devbar"><span class="muted sm">Live preview · runs in an isolated sandbox</span><div class="devtools"><button class="iconbtn" data-act="replay" aria-label="Replay">${ico('play', 18)}</button><button class="iconbtn" data-act="newtab" aria-label="Open in new tab">${ico('ext', 18)}</button></div></div><div class="prevhost" id="prevhost"></div></section></main></div>`,
    mount: r => { S.ui.device = S.ui.device || 'desktop'; mountPreview($('#prevhost', r), { interactive: false }); const host = $('#codehost', r); host.innerHTML = codeHTML(); syncEditor();
      /* delegated: the textarea is re-created on tab switches */
      host.addEventListener('input', e => { if (e.target.id === 'codearea') onCodeInput(); });
      host.addEventListener('scroll', e => { if (e.target.id === 'codearea') paintEditor(); }, true);
      host.addEventListener('keydown', e => { const ta = e.target; if (ta.id === 'codearea' && !ta.readOnly && e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); } });
      host.addEventListener('change', e => { if (e.target.id === 'livechk') { Code.live = e.target.checked; if (Code.live && S.codeDraft.dirty) { commitCodeDraft(); updateCodeUI(); } } }); } };
}
on('runtimeerror', e => { if (!$('#console')) return; const msg = (e.msg || 'Error') + (e.line ? ` (line ${e.line})` : ''); if (!Code.errors.includes(msg)) Code.errors.push(msg); updateCodeUI(); });
on('doc', e => { if ($('#codehost') && e.source !== 'user') { if (!S.codeDraft.dirty) renderCodeScreen(); } else if ($('#codehost') && !S.codeDraft.dirty && e.source === 'user') { updateCodeUI(); } });
