/* ===== 12-export: standalone HTML, ZIP (assets folder), JSON, clipboard ===== */
const enc = new TextEncoder();
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = ~0; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return ~c >>> 0; };
function dataUrlBytes(u) { const b = atob(u.slice(u.indexOf(',') + 1)), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function makeZip(files) { /* store-only ZIP writer: files=[{name, data:Uint8Array}] */
  const parts = [], cen = []; let off = 0; const d = new Date(), dt = ((d.getFullYear() - 1980) << 9 | (d.getMonth() + 1) << 5 | d.getDate()) & 0xffff, tm = (d.getHours() << 11 | d.getMinutes() << 5 | d.getSeconds() >> 1) & 0xffff;
  files.forEach(f => { const nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, f.data); const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true); c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true); cen.push(new Uint8Array(c.buffer), nm); off += 30 + nm.length + f.data.length; });
  const cs = cen.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const fileBase = p => (p.person.name || p.name || 'portfolio').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portfolio';
async function copyText(t, label) { try { await navigator.clipboard.writeText(t); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) { ta.remove(); toast('Copy was blocked by the browser. Select the code in the Code editor and copy manually.', 'warn'); return; } ta.remove(); } toast((label || 'Text') + ' copied to clipboard'); }

/* what the export actually depends on — we never claim "self-contained" unless it is */
function exportReport(p, o = {}) {
  const code = effectiveCode(p), fonts = o.fonts === false ? [] : usedFonts(p).filter(n => !FONTS[n].local), used = usedAssetIds(p);
  const ext = new Set(); const scan = JSON.stringify([p.person, p.sections]); (scan.match(/https?:\/\/[^"\\\s]+\.(png|jpe?g|gif|webp|svg|avif)(\?[^"\\\s]*)?/gi) || []).forEach(u => ext.add(u));
  [...(code.html + code.css).matchAll(/(?:src|url)\(?=?["']?(https?:\/\/[^"')\s>]+)/g)].forEach(m => { if (!/fonts\.(googleapis|gstatic)/.test(m[1])) ext.add(m[1]); });
  const bytes = used.reduce((a, id) => a + p.assets[id].size, 0), html = assembleDocument(p, { mode: 'export', assetMode: 'embed', fonts: o.fonts !== false });
  const remote = []; if (fonts.length) remote.push('Google Fonts (' + fonts.join(', ') + ') — falls back to system fonts offline'); if (ext.size) remote.push(ext.size + ' externally hosted image' + (ext.size > 1 ? 's' : '') + ' — need internet and must stay online');
  const profile = p.socials.filter(x => cleanUrl(x.url)).length; 
  return { fonts, ext: [...ext], used, bytes, htmlSize: new Blob([html]).size, remote, selfContained: !remote.length, profile };
}
function buildExportFiles(p, o) {
  const mode = o.zip ? 'path' : 'embed', html = assembleDocument(p, { mode: 'export', assetMode: mode, fonts: o.fonts !== false });
  if (!o.zip) return { html };
  const files = [{ name: 'index.html', data: enc.encode(html) }]; usedAssetIds(p).forEach(id => { const a = p.assets[id]; files.push({ name: 'assets/' + assetFileName(id, a), data: dataUrlBytes(a.dataUrl) }); });
  files.push({ name: 'README.txt', data: enc.encode('Portfolio exported from PortfolioVerse.\n\nOpen index.html in a browser, or upload this whole folder to any static host (Netlify, GitHub Pages, Cloudflare Pages, your own server).\nKeep the assets/ folder next to index.html.\n') });
  return { html, files };
}
const exportOpts = () => ({ fonts: S.ui.exFonts !== false });
function doDownloadHTML() { pruneAssetsSafe(); const p = S.project, r = exportReport(p, exportOpts()); const { html } = buildExportFiles(p, exportOpts()); download(fileBase(p) + '.html', new Blob([html], { type: 'text/html' })); toast('Downloaded ' + fileBase(p) + '.html (' + fmtBytes(r.htmlSize) + ')'); }
function doDownloadZip() { const p = S.project, { files } = buildExportFiles(p, { ...exportOpts(), zip: true }); download(fileBase(p) + '-site.zip', makeZip(files)); toast('ZIP downloaded: index.html + ' + (files.length - 2) + ' asset file(s)'); }
function pruneAssetsSafe() { /* never mutates the project during export */ }
function doExportJSON() { const p = S.project; pruneAssets(); const out = { ...clone(p), _format: 'portfolioverse', _exportedAt: new Date().toISOString() }; delete out.versions; download(fileBase(p) + '.portfolioverse.json', new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' })); toast('Project configuration exported'); }
function openInNewTab() {
  const p = S.project, pp = previewProject(), doc = assembleDocument(pp, { mode: 'export', embedded: true, code: effectiveCode(pp) });
  /* The portfolio always runs inside a sandboxed iframe (opaque origin), even in its own tab. */
  const wrapper = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(p.name)} — preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%;display:block}</style></head><body><iframe sandbox="allow-scripts allow-popups allow-forms" srcdoc="${esc(doc)}" title="Portfolio"></iframe></body></html>`;
  const u = URL.createObjectURL(new Blob([wrapper], { type: 'text/html' })), w = window.open(u, '_blank'); if (!w) toast('Your browser blocked the new tab. Allow pop-ups for this page and try again.', 'warn'); setTimeout(() => URL.revokeObjectURL(u), 60000);
}

/* A short, honest pre-publish checklist computed from the real project (not generic advice). */
function checklistItems(p, r, m) {
  const vis = p.sections.filter(s => s.visible), sample = sampleContent().person.name, items = [];
  const projects = vis.find(s => s.type === 'projects'), imgs = vis.flatMap(s => s.items.filter(i => i.image && blank(i.imageAlt)));
  const contact = !blank(p.person.email) || p.socials.some(x => !blank(x.url));
  items.push({ ok: !blank(p.person.name) && p.person.name.trim() !== sample, text: blank(p.person.name) ? 'Add your name' : p.person.name.trim() === sample ? 'You are still using the sample name (“' + sample + '”) — replace the sample content with your own' : 'Your name is set', fix: 'content' });
  items.push({ ok: contact, text: contact ? 'Visitors can contact you (email or a link)' : 'Add an email address or a social link so people can reach you', fix: 'content' });
  items.push({ ok: !!(projects && projects.items.some(i => !blank(i.title))), text: projects && projects.items.some(i => !blank(i.title)) ? 'At least one project or piece of work is shown' : 'Show at least one project or piece of work', fix: 'content' });
  items.push({ ok: imgs.length === 0, text: imgs.length ? imgs.length + ' image' + (imgs.length > 1 ? 's have' : ' has') + ' no description (alt text) — screen-reader users will miss them' : 'Images have descriptions', fix: 'content' });
  items.push({ ok: !blank(p.seo.description), text: blank(p.seo.description) ? 'Add a page description (shown in search results and link previews) below' : 'Page description is set', fix: null });
  items.push({ ok: !(m.html || m.css || m.js), info: true, text: m.html || m.css || m.js ? 'Hand-edited code (' + ['html', 'css', 'js'].filter(k => m[k]).join(', ').toUpperCase() + ') is exported exactly as written' : 'No hand-edited code — the export matches the visual editor', fix: null });
  items.push({ ok: r.selfContained, info: true, text: r.selfContained ? 'Works fully offline (nothing loaded from the internet)' : 'Loads web fonts / linked images from the internet (see below)', fix: null });
  return items;
}
const checklistHTML = (p, r, m) => { const it = checklistItems(p, r, m), todo = it.filter(i => !i.ok && !i.info).length;
  return `<div class="card-a"><h3>Before you publish</h3><p class="status ${todo ? 'warn' : 'ok'}">${ico(todo ? 'alert' : 'check', 18)} ${todo ? todo + ' thing' + (todo > 1 ? 's' : '') + ' worth fixing first' : 'Looks ready to publish'}</p><ul class="inc check">${it.map(i => `<li class="${i.ok ? 'in' : i.info ? 'note' : 'todo'}"><span aria-hidden="true">${i.ok ? '✓' : i.info ? 'ℹ' : '!'}</span><span>${esc(i.text)}${i.fix && !i.ok ? ` <button class="btn sm ghost" data-act="fixlink" data-p="${i.fix}">Fix</button>` : ''}</span></li>`).join('')}</ul></div>`; };
function screenExport() {
  const p = S.project, o = exportOpts(), r = exportReport(p, o), code = effectiveCode(p), m = code.manual;
  const live = p.sections.filter(s => sectionRenders(s, p)), skipped = p.sections.filter(s => !sectionRenders(s, p));
  const big = r.htmlSize > 5 * 1048576 ? 'danger' : r.htmlSize > 1.5 * 1048576 ? 'warn' : '';
  const seo = (k, l, t) => fld(F(k, l, t || 'text'), p.seo[k], 'seo/' + k);
  return { html: `<div class="screen">${appbar({ title: 'Export your website', sub: 'Step 8 of 8', right: saveBadge() })}${stepper(8)}<main class="sbody"><div class="inner exgrid">
  <section class="excol"><div class="card-a prime"><h2>Your portfolio is ready</h2><p>One standalone HTML file with its CSS and JavaScript inside. Open it from your desktop or upload it to any web host.</p><button class="btn primary lg" data-act="dlhtml">${ico('download', 20)} Download HTML</button><p class="muted sm" style="margin:8px 0 0">Nothing downloaded? Some preview panes block downloads — use <strong>Copy HTML</strong> and save it as <code>portfolio.html</code>, or open this app in a normal browser tab.</p><div class="btnrow"><button class="btn" data-act="copyexp" data-w="html">${ico('copy', 15)} Copy HTML</button><button class="btn" data-act="copyexp" data-w="css">Copy CSS</button><button class="btn" data-act="copyexp" data-w="js">Copy JavaScript</button></div><div class="btnrow"><button class="btn" data-act="dlzip">${ico('download', 15)} ZIP with assets folder</button><button class="btn" data-act="dljson">${ico('file', 15)} Project JSON</button><button class="btn" data-act="newtab">${ico('ext', 15)} Open in new tab</button></div></div>
  ${checklistHTML(p, r, m)}
  <div class="card-a"><h3>What this file depends on</h3><p class="status ${r.selfContained ? 'ok' : 'warn'}">${ico(r.selfContained ? 'check' : 'warn', 18)} ${r.selfContained ? 'Fully self-contained: works offline with no outside requests.' : 'Works offline, but not fully self-contained:'}</p>${r.remote.length ? `<ul class="bul">${r.remote.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<ul class="bul"><li>File size: <strong>${fmtBytes(r.htmlSize)}</strong>${r.used.length ? ` including ${r.used.length} uploaded file${r.used.length > 1 ? 's' : ''} embedded as data (${fmtBytes(r.bytes)})` : ''}</li></ul>${big ? `<p class="notice ${big}">${big === 'danger' ? 'This file is very large and may load slowly. Use the ZIP export so images are separate files.' : 'This file is getting large because of embedded images. The ZIP export keeps images as separate files that load faster.'}</p>` : ''}${chk('Load fonts from Google Fonts (needs internet; off = system fonts only)', 'ui.exFonts', o.fonts)}
  <p class="muted sm">Fonts and libraries can’t be bundled offline from this builder, so they’re listed above rather than hidden. Uploaded images are embedded. Pasted image links stay remote.</p></div>
  ${(m.html || m.css || m.js) ? `<div class="notice info">Your export includes manual edits to <strong>${['html', 'css', 'js'].filter(k => m[k]).map(k => k.toUpperCase()).join(', ')}</strong>. Anything you change visually in those parts won’t appear until you restore the generated version in the Code editor.</div>` : ''}</section>
  <section class="excol"><div class="card-a"><h3>Included sections</h3>${m.html ? '<p class="notice info">Your manual HTML is exported exactly as written, so this list (from the visual editor) may differ from it. Restore the generated HTML in the Code editor to sync them.</p>' : ''}<ul class="inc">${live.map(s => `<li class="in">${ico('check', 15)} ${esc(s.title)}</li>`).join('')}${skipped.map(s => `<li class="out">${ico('x', 15)} ${esc(s.title)} <small>${!s.visible ? 'hidden' : 'empty'}</small></li>`).join('')}</ul></div>
  <div class="card-a"><h3>Search & sharing</h3>${seo('title', 'Page title (blank = name + title)')}${fld(F('description', 'Description', 'textarea'), p.seo.description, 'seo/description')}${seo('siteUrl', 'Website address (optional)', 'url')}${seo('ogImage', 'Share image URL (optional, https)', 'url')}${fld(F('lang', 'Language code'), p.seo.lang, 'seo/lang')}<div class="fgrid2">${fld(F('v', 'Favicon letters'), p.seo.favicon.value, 'seo.favicon.value')}${clr('Favicon color', 'seo.favicon.color', hexOk(p.seo.favicon.color) ? p.seo.favicon.color : p.design.palette.accent)}</div></div>
  <div class="card-a"><h3>Versions</h3><p class="muted sm">Save a named snapshot of content, design and code you can return to.</p><button class="btn sm" data-act="saveversion">${ico('plus', 15)} Save version</button><ul class="vers">${p.versions.map(v => `<li><span><strong>${esc(v.name)}</strong><small class="muted"> ${ago(v.at)}</small></span><button class="btn sm" data-act="restorever" data-id="${v.id}">Restore</button></li>`).join('')}</ul></div></section>
  </div></main>${stepbar({ next: 'finish', nextLabel: 'Finish', info: '' })}</div>`, mount: () => {} };
}
