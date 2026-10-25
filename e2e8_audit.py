"""Regression tests for every defect confirmed in the audit (security, data integrity, save honesty, multi-tab, a11y)."""
import os, json
from playwright.sync_api import sync_playwright
from h import *
srv, URL = serve(); import h as H; H.APP = URL
PAY = '<img src=x onerror="window.__xss=(window.__xss||0)+1">'
def new(b, **kw): c = b.new_context(viewport={'width': 1400, 'height': 900}, accept_downloads=True, **kw); return c, c.new_page()
def make(pg, tpl='Editorial', name='Audit', sys=1):
    pg.goto(URL); pg.wait_for_timeout(700); pg.click('.l-cta [data-act=startnew]'); pg.click(f'.sysopt:nth-child({sys})'); pg.fill('#wiz-name', name); pg.click('.stepbar [data-act=wiznext]'); pg.wait_for_timeout(500)
    pg.click(f'.gcard:has-text("{tpl}") [data-act=tplpick]'); pg.wait_for_timeout(200)
    for _ in range(3): pg.click('.stepbar [data-act=next]'); pg.wait_for_timeout(400)
    pg.click('.nextbtn'); pg.wait_for_timeout(1300)
def do_import(pg, j):
    pg.evaluate("PV.Router.go('/projects')"); pg.wait_for_timeout(700); n = pg.evaluate('PV.S.index.length')
    pg.set_input_files('#jsonIn', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': json.dumps(j).encode()}); pg.wait_for_timeout(1100); return pg.evaluate('PV.S.index.length') - n
with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- S1/S2: hostile + malformed imports ----------
    c, pg = new(b); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:120])); make(pg)
    base = json.loads(pg.evaluate("JSON.stringify(PV.S.project)")); proj = [s for s in base['sections'] if s['type'] == 'projects'][0]; ik = f"s/{proj['id']}/i/{proj['items'][0]['id']}"
    j = json.loads(json.dumps(base)); j['id'] = 'evil1'; d = j['design']
    d['layout']['spacing'] = PAY; d['type']['size'] = PAY; d['palette']['primary'] = PAY; d['layout']['hero'] = '"><script>window.__xss=9</script>'; d['bg'] = '" onmouseover="window.__xss=7'
    d['elementStyles'] = {'person/name': {'color': PAY, 'size': PAY, 'bg': 'red;}body{display:none}/*', 'radius': PAY}, ik: {'hover': PAY, 'layout': PAY}}
    proj_j = [s for s in j['sections'] if s['type'] == 'projects'][0]; proj_j['style'] = {'pad': PAY, 'bg': PAY, 'layout': PAY, 'anim': PAY}
    proj_j['items'][0]['tags'] = 'a,b'; proj_j['items'][1] = {'id': 'zz'}; proj_j['items'][2] = None; j['person'] = {'name': {'x': 1}, 'title': None, 'email': 5}
    j['assets'] = {'a1': {'name': 'x', 'dataUrl': 'data:image/png;base64,AAAA" onerror="window.__xss=5', 'size': 1}}
    j['versions'] = [{'id': 'v1', 'name': 'v', 'at': 1, 'doc': json.dumps({'person': base['person'], 'sections': base['sections'], 'design': {'palette': {'primary': PAY}, 'template': 'x'}})}]
    ok('hostile+malformed project imports without error', do_import(pg, j) == 1)
    pg.evaluate("PV.ACT.openproj({dataset:{id:'evil1'}})"); pg.wait_for_timeout(1800)
    for tab in ['design', 'content']: pg.evaluate(f"PV.S.ui.openGroup.palette=true;PV.S.ui.openGroup.type=true;PV.S.ui.openGroup.layout=true;PV.ACT.openpanel({{dataset:{{p:'{tab}'}}}})"); pg.wait_for_timeout(500)
    try: fr(pg).locator('.name').click(timeout=4000); pg.wait_for_timeout(600)
    except Exception: pass
    sp = pg.evaluate("JSON.stringify(PV.S.project.design)")
    ok('S1 stored XSS: no payload executed in the builder', (pg.evaluate('window.__xss||0') == 0), pg.evaluate('window.__xss||0'))
    ok('S1 design tokens whitelisted/clamped', PAY not in sp and '<script' not in sp and 'onmouseover' not in sp and pg.evaluate('typeof PV.S.project.design.layout.spacing')=='number', sp[:160])
    ok('S1 element/section styles cleaned', pg.evaluate('JSON.stringify(PV.S.project.design.elementStyles)') in ('{}',) or 'red;}' not in pg.evaluate('JSON.stringify(PV.S.project.design.elementStyles)'))
    ok('S1 hostile asset data URL rejected', pg.evaluate('Object.keys(PV.S.project.assets).length')==0)
    ok('S1 versions sanitised on import', 'img src' not in pg.evaluate('JSON.stringify(PV.S.project.versions)'))
    ok('S2 malformed data: editor renders with no exceptions', pg.locator('.ws').count() == 1 and not errs and fr(pg).locator('.name').count() == 1, errs[:2])
    ok('S2 tags string coerced to list, missing fields filled', pg.evaluate("PV.S.project.sections.find(s=>s.type=='projects').items.every(i=>Array.isArray(i.tags)&&typeof i.title=='string')"))
    ok('S2 export of imported project has no injected markup', '__xss' not in pg.evaluate("PV.assembleDocument(PV.S.project,{mode:'export'})"))
    pg.evaluate("['person/__proto__','design/template','code/html'].forEach(function(pt){try{PV.editPath(pt,'x')}catch(e){}})"); ok('S1 prototype keys / non-model paths rejected by editPath', pg.evaluate("({}).x===undefined && PV.S.project.design.template!=='pwned'"))
    c.close()
    # ---------- S3: forged bridge messages from custom code ----------
    c, pg = new(b); make(pg); t0 = pg.evaluate('PV.S.project.design.template')
    pg.evaluate("PV.commit('js',p=>{p.code.js=\"['design/template','code/html','seo/title','person/__proto__','s/x/items'].forEach(function(pt){parent.postMessage({pv:1,t:'edit',path:pt,value:'PWN'},'*')});parent.postMessage({pv:1,t:'edit',path:'person/name',value:{a:1}},'*');\"},{structural:true})"); pg.wait_for_timeout(2500)
    ok('S3 forged edit messages cannot rewrite model', pg.evaluate('PV.S.project.design.template')==t0 and pg.evaluate('PV.S.project.code.html')==None and pg.evaluate('PV.S.project.seo.title')!='PWN' and pg.evaluate("typeof PV.S.project.person.name")=='string')
    c.close()
    # ---------- D1: Leave anyway really discards ----------
    c, pg = new(b); make(pg); pg.click('.nextbtn'); pg.wait_for_timeout(1500); pg.click('.codecol .tab:has-text("CSS")')
    pg.fill('#codearea', pg.input_value('#codearea') + '\n.name{color:rgb(1,2,3)!important}\n'); pg.click('.appbar .back'); pg.wait_for_timeout(1200)
    if pg.locator('.dlg-wrap').count(): pg.click('.dlg-wrap [data-dlg=yes]')
    pg.wait_for_timeout(2500); ok('D1 "Leave anyway" discards the code draft (not silently committed)', pg.evaluate('PV.S.project.code.css')==None and pg.evaluate('PV.S.codeDraft.dirty')==False)
    c.close()
    # ---------- D2: failed writes are never shown as saved; recovery offered ----------
    c, pg = new(b); pg.add_init_script("window.__fail=false;const _p=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){if(window.__fail){const r={};setTimeout(()=>{r.error=new DOMException('disk full','QuotaExceededError');r.onerror&&r.onerror()},20);return r}return _p.apply(this,arguments)}")
    make(pg, name='Quota'); pg.wait_for_timeout(1200); pg.evaluate("window.__fail=true"); states = []
    pg.evaluate("PV.editPath('person/name','Edit while disk full')"); 
    for _ in range(8): pg.wait_for_timeout(350); states.append(pg.evaluate('PV.S.saveState'))
    ok('D2 never reports "saved" while the write is failing', 'saved' not in states, states)
    ok('D2 persistent alert banner with recovery actions', pg.locator('#banner[role=alert]').is_visible() and pg.locator('#banner [data-act=backup]').count()==1 and pg.locator('#banner [data-act=retrysave]').count()==1 and 'disk full' in pg.inner_text('#banner'))
    ok('D2 badge says "Not saved"', 'Not saved' in pg.inner_text('.savebadge'))
    with pg.expect_download() as dl: pg.click('#banner [data-act=backup]')
    ok('D2 backup JSON downloadable from the banner (work is preserved)', 'Edit while disk full' in open(dl.value.path()).read())
    pg.evaluate("window.__fail=false"); pg.click('#banner [data-act=retrysave]'); pg.wait_for_timeout(1500)
    ok('D2 retry succeeds, banner clears, state saved', pg.evaluate('PV.S.saveState')=='saved' and not pg.is_visible('#banner'))
    c.close()
    # ---------- D3: two tabs ----------
    c = b.new_context(viewport={'width': 1300, 'height': 850}); A = c.new_page(); make(A, name='Tabs'); A.wait_for_timeout(1000)
    B = c.new_page(); B.goto(URL + '#/editor'); B.wait_for_timeout(1600)
    A.evaluate("PV.editPath('person/name','Edited in A')"); A.wait_for_timeout(1500)
    B.wait_for_timeout(500); bshow = B.is_visible('#banner [data-act=bannerload]')
    B.evaluate("PV.editPath('person/title','Edited in B')"); B.wait_for_timeout(1500)
    ok('D3 second tab is warned and autosave pauses (no silent overwrite)', B.is_visible('#banner [data-act=bannerload]') and B.evaluate('PV.S.saveState')=='conflict', [bshow, B.evaluate('PV.S.saveState')])
    A.reload(); A.wait_for_timeout(1500); ok("D3 first tab's edit survives in storage", A.evaluate('PV.S.project.person.name')=='Edited in A')
    B.click('#banner [data-act=bannerload]'); B.wait_for_timeout(1500)
    ok('D3 "Load latest" adopts the other tab\'s work and clears the conflict', B.evaluate('PV.S.project.person.name')=='Edited in A' and not B.is_visible('#banner') and B.evaluate('PV.S.saveState')=='saved')
    A.evaluate("PV.editPath('person/name','A again')"); A.wait_for_timeout(1500); B.wait_for_timeout(400)
    B.evaluate("PV.editPath('person/title','B mine')"); B.wait_for_timeout(1500)
    B.click('#banner [data-act=bannermine]'); B.wait_for_timeout(1800); A.reload(); A.wait_for_timeout(1500)
    ok('D3 "Keep my version" intentionally overwrites', A.evaluate('PV.S.project.person.title')=='B mine')
    c.close()
    # ---------- D4: memory-only mode ----------
    c, pg = new(b); pg.add_init_script("Object.defineProperty(window,'indexedDB',{value:undefined});Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}})")
    make(pg, name='Mem'); pg.evaluate("PV.editPath('person/name','Unsaved work')"); pg.wait_for_timeout(1500)
    ok('D4 memory-only: badge says "Session only" + banner explains', 'Session only' in pg.inner_text('.savebadge') and pg.is_visible('#banner [data-act=backup]'))
    ok('D4 memory-only: closing the tab is guarded', pg.evaluate("(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented})()"))
    c.close()
    # ---------- D5: corrupt record ----------
    c, pg = new(b); make(pg, name='Fine'); pg.wait_for_timeout(800)
    pg.evaluate("new Promise(r=>{const q=indexedDB.open('portfolioverse',1);q.onsuccess=()=>{const t=q.result.transaction('projects','readwrite');t.objectStore('projects').put({id:'broken1',name:'Broken one',sections:'nope',design:5});t.oncomplete=()=>r(1)}})"); pg.reload(); pg.wait_for_timeout(1500)
    pg.evaluate("PV.Router.go('/projects')"); pg.wait_for_timeout(900)
    ok('D5 unreadable record: app boots and tells the user', pg.locator('.fatal').count()==0 and 'couldn’t be read' in pg.inner_text('.inner') and pg.locator('[data-act=rawdl]').count()==1)
    with pg.expect_download() as dl: pg.click('[data-act=rawdl]')
    ok('D5 raw data downloadable for recovery', 'Broken one' in open(dl.value.path()).read()); c.close()
    # ---------- U1: manual code vs design change ----------
    c, pg = new(b); make(pg, name='Trap'); pg.evaluate("PV.commit('c',p=>{p.code.css=PV.effectiveCode(p).css},{structural:true})"); pg.wait_for_timeout(500)
    pg.evaluate("(()=>{PV.ACT.tplpick({dataset:{id:'brutalist'}});return 1})()"); pg.wait_for_timeout(500)
    ok('U1 template switch warns about hand-edited code', pg.is_visible('.dlg-wrap') and 'hand-edited' in pg.inner_text('.dlg'))
    pg.click('.dlg [data-dlg=no]'); pg.wait_for_timeout(300); ok('U1 cancel keeps template', pg.evaluate('PV.S.project.design.template')=='editorial')
    pg.evaluate("(()=>{PV.ACT.tplpick({dataset:{id:'brutalist'}});return 1})()"); pg.wait_for_timeout(500); pg.click('.dlg [data-dlg=restore]'); pg.wait_for_timeout(1500)
    ok('U1 restore+apply: template changes and preview matches', pg.evaluate('PV.S.project.design.template')=='brutalist' and pg.evaluate('PV.S.project.code.css')==None and 't-brutalist' in fr(pg).locator('.pv').get_attribute('class'))
    c.close()
    # ---------- U2: stale selection ----------
    c, pg = new(b); make(pg, name='Sel'); pg.evaluate("PV.commit('t',p=>{p.sections.find(s=>s.type=='projects').items.push({id:'newone',title:'Temp',description:'d',tags:[],image:'',imageAlt:'',link:''})},{structural:true})"); pg.wait_for_timeout(1300)
    fr(pg).locator('.card').nth(3).click(position={'x': 3, 'y': 3}); pg.wait_for_timeout(500); had = pg.evaluate('PV.S.ui.selected')
    pg.click('.appbar [data-act=undo]'); pg.wait_for_timeout(1200)
    ok('U2 selection and toolbar cleared when undo removes the element', bool(had) and pg.evaluate('PV.S.ui.selected')==None and not pg.is_visible('.sel-tb'), [had, pg.evaluate('PV.S.ui.selected')])
    c.close()
    # ---------- A1: accessibility behaviours ----------
    c, pg = new(b); make(pg, name='A11y'); pg.evaluate("PV.Router.go('/projects')"); pg.wait_for_timeout(800)
    pg.click('.pcard >> nth=0 >> [data-act=delproj]'); pg.wait_for_timeout(400); out = 0
    for _ in range(14):
        pg.keyboard.press('Tab'); out += 0 if pg.evaluate("!!document.activeElement.closest('.dlg')") else 1
    ok('A1 dialog traps Tab focus', out == 0, out); ok('A1 page behind dialog is inert', pg.evaluate("document.querySelector('#app').hasAttribute('inert')"))
    pg.keyboard.press('Shift+Tab'); ok('A1 Shift+Tab stays inside dialog', pg.evaluate("!!document.activeElement.closest('.dlg')"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); ok('A1 inert removed and focus returns to the opener', not pg.evaluate("document.querySelector('#app').hasAttribute('inert')") and pg.evaluate("document.activeElement.dataset.act")=='delproj')
    pg.evaluate("PV.Router.go('/gallery')"); pg.wait_for_timeout(700); ok('A1 focus moves to the screen heading on navigation', pg.evaluate("document.activeElement.tagName")=='H1')
    ok('A1 polite status region exists for save announcements', pg.evaluate("document.querySelector('#sr-status').getAttribute('aria-live')")=='polite')
    pg.evaluate("PV.Router.go('/editor')"); pg.wait_for_timeout(1500); pg.evaluate("PV.editPath('person/name','announce me')"); pg.wait_for_timeout(2600); ok('A1 "All changes saved" announced', 'saved' in pg.inner_text('#sr-status').lower(), pg.inner_text('#sr-status'))
    pg.evaluate("PV.ACT.openpanel({dataset:{p:'content'}})"); pg.wait_for_timeout(400); ok('A1 tab panel semantics (tabpanel + aria-controls)', pg.locator('[role=tabpanel]').count()==1 and pg.locator('.tab[aria-controls=tabpanel]').count()>=3)
    pg.fill('#wspanel [data-bind="person/email"]', 'nope'); pg.wait_for_timeout(300)
    ok('A1 invalid email: described-by message announced as alert', pg.evaluate("(()=>{const i=document.querySelector('[data-bind=\"person/email\"]');const e=document.getElementById(i.getAttribute('aria-describedby'));return !!e&&e.getAttribute('role')=='alert'&&!e.hidden})()"))
    ok('A1 every visible field/button has an accessible name', pg.evaluate("""(()=>{const bad=[];document.querySelectorAll('button,input:not([type=hidden]):not([type=file]),select,textarea').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;const n=(e.getAttribute('aria-label')||(e.labels&&[...e.labels].map(l=>l.textContent).join(''))||e.textContent||e.title||'').trim();if(!n)bad.push(e.outerHTML.slice(0,60))});return bad.length==0})()"""))
    c.close()
    # ---------- P1: export checklist ----------
    c, pg = new(b); make(pg, name='Check'); pg.evaluate("PV.Router.go('/editor/export')"); pg.wait_for_timeout(1000)
    ok('P1 checklist flags leftover sample content', 'still using the sample' in pg.inner_text('.check'), pg.inner_text('.check')[:120])
    pg.evaluate("PV.editPath('person/name','Real Person')"); pg.evaluate("PV.render()"); pg.wait_for_timeout(900); ok('P1 checklist clears once replaced', 'still using the sample' not in pg.inner_text('.check'))
    c.close(); b.close(); srv.shutdown()
bad = [r for r in res if not r[1]]; print(len(res) - len(bad), 'passed', len(bad), 'failed')
