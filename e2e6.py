from playwright.sync_api import sync_playwright
from h import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1600,'height':950}); pg=ctx.new_page()
    to_editor(pg,2,'Retro','Final')
    for d in ['tablet','mobile','desktop']:
        pg.click(f'.dev-btn[data-d={d}]'); pg.wait_for_timeout(400)
        w=pg.evaluate("parseFloat(document.querySelector('.pv-frame').style.width)"); ok(f'device {d} width', w=={'desktop':1280,'tablet':820,'mobile':390}[d], w)
    pg.click('[data-act=fullscreen]'); pg.wait_for_timeout(400); ok('fullscreen on', pg.evaluate("document.querySelector('.pv-wrap').classList.contains('full')") and pg.is_visible('.pv-exit'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); ok('Esc exits fullscreen', not pg.evaluate("document.querySelector('.pv-wrap').classList.contains('full')"))
    with ctx.expect_page() as np: pg.click('[data-act=newtab]')
    t=np.value; t.wait_for_timeout(1500); ok('new tab: portfolio runs inside sandboxed iframe', t.frame_locator('iframe').locator('.name').count()==1 and 'allow-same-origin' not in (t.get_attribute('iframe','sandbox') or ''))
    fr(pg).locator('.card >> nth=0').click(position={'x':4,'y':4}); pg.wait_for_timeout(600); pg.screenshot(path='desk_sel.png')
    pg.click('.nextbtn'); pg.wait_for_timeout(1500); pg.click('.codecol .tab:has-text("CSS")'); pg.wait_for_timeout(400); pg.screenshot(path='desk_code.png')
    pg.click('.nextbtn'); pg.wait_for_timeout(800); pg.screenshot(path='desk_export.png')
    b.close()
bad=[r for r in res if not r[1]]; print(len(res)-len(bad),'passed',len(bad),'failed')
