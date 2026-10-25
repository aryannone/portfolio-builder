"""Regression: clicking a link inside ANY embedded preview must never load PortfolioVerse inside the frame.
Reported bug: clicking "See my work" while editing opened the PortfolioVerse homepage inside the editor (only reproduces over http)."""
import os
from playwright.sync_api import sync_playwright
from h import *
srv, URL = serve(); os.environ['PV_APP'] = URL
import h; h.APP = URL
def app_in_frames(pg):
    n = 0
    for f in pg.frames:
        if f != pg.main_frame:
            try:
                if f.evaluate("!!document.querySelector('.appbar') && !!document.querySelector('#dialogs')"): n += 1
            except Exception: pass
    return n
with sync_playwright() as p:
    b = p.chromium.launch(); c = b.new_context(viewport={'width': 1400, 'height': 900}, accept_downloads=True); pg = c.new_page()
    pg.goto(URL); pg.wait_for_timeout(700)
    import h as H; 
    pg.click('.l-cta [data-act=startnew]'); pg.click('.sysopt:nth-child(1)'); pg.fill('#wiz-name', 'Links'); pg.click('.stepbar [data-act=wiznext]'); pg.wait_for_timeout(500)
    pg.click('.gcard:has-text("Professional") [data-act=tplpick]'); pg.wait_for_timeout(200)
    for _ in range(3): pg.click('.stepbar [data-act=next]'); pg.wait_for_timeout(450)
    ok('customize step reached', pg.evaluate('location.hash') == '#/new/customize')
    def probe(label, getframe):
        f = getframe()
        f.locator('.hero-cta a').first.click(); pg.wait_for_timeout(900)
        ok(f'{label}: "See my work" keeps the portfolio in the frame', app_in_frames(pg) == 0 and getframe().locator('.name').count() == 1, f'apps inside frames={app_in_frames(pg)}')
        f = getframe(); f.locator('.nav a, nav a').nth(2).click(); pg.wait_for_timeout(1000)
        ok(f'{label}: nav link keeps portfolio in frame and scrolls', app_in_frames(pg) == 0 and getframe().locator('.name').count() == 1 and getframe().locator('body').evaluate('document.scrollingElement.scrollTop') > 100, getframe().locator('body').evaluate('document.scrollingElement.scrollTop'))
    probe('customize step', lambda: fr(pg))
    # external link: blocked with an explanation, nothing navigates
    f = fr(pg); f.locator('.hero-cta a').first.evaluate("e=>e.setAttribute('href','https://example.com/work')"); f.locator('.hero-cta a').first.click(); pg.wait_for_timeout(700)
    ok('external link: frame stays, user is told links are off in preview', app_in_frames(pg) == 0 and fr(pg).locator('.name').count() == 1 and 'switched off' in ' '.join(pg.locator('.toast').all_inner_texts()), pg.locator('.toast').all_inner_texts())
    pg.evaluate("PV.Router.go('/editor')"); pg.wait_for_timeout(1500)
    f = fr(pg); f.locator('.hero-cta a').first.click(); pg.wait_for_timeout(700); ok('editor (click-to-edit): link click edits/selects, never navigates', app_in_frames(pg) == 0 and fr(pg).locator('.name').count() == 1)
    # hand-edited HTML pauses click-to-edit => links are live: this was the unprotected path
    pg.evaluate("PV.commit('h',p=>{p.code.html=PV.effectiveCode(p).html},{structural:true})"); pg.wait_for_timeout(1500)
    probe('editor with hand-edited HTML', lambda: fr(pg))
    pg.evaluate("PV.commit('h',p=>{p.code.html=null},{structural:true})"); pg.wait_for_timeout(800)
    pg.evaluate("PV.Router.go('/editor/code')"); pg.wait_for_timeout(1500); probe('code step', lambda: fr(pg))
    pg.evaluate("PV.Router.go('/new/info')"); pg.wait_for_timeout(1200)
    probe('wizard preview', lambda: pg.frame_locator('#wizprev iframe').last)
    pg.evaluate("(()=>{PV.ACT.previewdlg();return 1})()"); pg.wait_for_timeout(1200); probe('preview dialog', lambda: pg.frame_locator('.dlg iframe').last); pg.keyboard.press('Escape')
    pg.evaluate("PV.Router.go('/gallery')"); pg.wait_for_timeout(1200); pg.click('.gcard:has-text("Brutalist") [data-act=tplpreview]'); pg.wait_for_timeout(1500)
    probe('template preview dialog', lambda: pg.frame_locator('.dlg iframe').last); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.evaluate("PV.Router.go('/editor')"); pg.wait_for_timeout(1500)
    with c.expect_page() as np: pg.click('[data-act=newtab]')
    t = np.value; t.wait_for_timeout(1500); inner = t.frame_locator('iframe')
    inner.locator('.hero-cta a').first.click(); t.wait_for_timeout(900)
    ok('new-tab preview: link click does not load the wrapper/app inside the frame', inner.locator('.name').count() == 1 and inner.locator('.appbar').count() == 0)
    # exported file is a normal website: native anchors, no embed guard/base
    pg.evaluate("PV.Router.go('/editor/export')"); pg.wait_for_timeout(1200)
    with pg.expect_download() as dl: pg.click('[data-act=dlhtml]')
    html = open(dl.value.path(), encoding='utf8').read()
    ok('export has no preview-only guard or <base>', 'about:srcdoc' not in html and "pv:1,t:'link'" not in html)
    dl.value.save_as('links_export.html'); q = c.new_page(); q.goto('file://' + os.path.abspath('links_export.html')); q.wait_for_timeout(700)
    q.locator('.hero-cta a').first.click(); q.wait_for_timeout(500)
    ok('exported site: in-page link scrolls natively', q.evaluate("location.hash").startswith('#') and q.evaluate("document.scrollingElement.scrollTop") > 100, q.evaluate("[location.hash,document.scrollingElement.scrollTop]"))
    b.close(); srv.shutdown()
bad = [r for r in res if not r[1]]; print(len(res) - len(bad), 'passed', len(bad), 'failed')
