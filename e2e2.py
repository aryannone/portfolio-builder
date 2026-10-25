from playwright.sync_api import sync_playwright
from h import *
import json,zipfile,io
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1600,'height':900},accept_downloads=True); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    to_editor(pg, 1, 'Editorial')
    ok('editor loaded', pg.evaluate('location.hash')=='#/editor')
    f=fr(pg)
    f.locator('.name').click(); pg.wait_for_timeout(400)
    ok('click heading selects model path', pg.evaluate('PV.S.ui.selected')=='person/name', pg.evaluate('PV.S.ui.selected'))
    ok('selection toolbar visible', pg.is_visible('.sel-tb'))
    ok('inspector has text field', pg.is_visible('#wsinsp [data-bind="person/name"]'))
    pg.fill('#wsinsp [data-bind="person/name"]','Priya R.'); pg.wait_for_timeout(700)
    ok('inspector edit -> model', pg.evaluate('PV.S.project.person.name')=='Priya R.')
    ok('preview re-rendered with edit', fr(pg).locator('.name').inner_text()=='Priya R.')
    ok('nav brand updated too (single source)', fr(pg).locator('.brand').inner_text()=='Priya R.')
    # font style override
    pg.select_option('#wsinsp [data-es$="|font"]','Syne'); pg.wait_for_timeout(500)
    ok('typography override stored per element', pg.evaluate('PV.S.project.design.elementStyles["person/name"].font')=='Syne')
    cs=fr(pg).locator('.name').evaluate('e=>getComputedStyle(e).fontFamily'); ok('override applied in preview CSS', 'Syne' in cs, cs)
    # inline edit
    fr(pg).locator('.card h3').first.dblclick(); pg.wait_for_timeout(200)
    pg.keyboard.press('Control+A'); pg.keyboard.type('Mandi Mitra Pro'); pg.keyboard.press('Enter'); pg.wait_for_timeout(700)
    t=pg.evaluate('PV.S.project.sections.find(s=>s.type=="projects").items[0].title'); ok('dblclick inline edit updates correct project record', t=='Mandi Mitra Pro', t)
    # card
    fr(pg).locator('.card').nth(1).click(position={'x':3,'y':3}); pg.wait_for_timeout(400)
    ok('click card selects item', '/i/' in (pg.evaluate('PV.S.ui.selected') or '') and pg.evaluate('PV.S.ui.selKind')=='card', pg.evaluate('PV.S.ui.selected'))
    pg.select_option('#wsinsp [data-es$="|layout"]','featured'); pg.wait_for_timeout(600)
    ok('card layout applied', fr(pg).locator('.card.c-feat').count()==1)
    # edit card title via inspector
    iid=pg.evaluate('PV.S.ui.selected.split("/")[3]'); pg.fill(f'#wsinsp [data-bind$="{iid}/title"]','Yatra Offline 2'); pg.wait_for_timeout(500)
    ok('card title via inspector', fr(pg).locator('.card h3').nth(1).inner_text()=='Yatra Offline 2')
    # button
    fr(pg).locator('.hero-cta a').first.click(); pg.wait_for_timeout(400)
    ok('button selected', pg.evaluate('PV.S.ui.selKind')=='button')
    pg.fill('#wsinsp [data-bind$="/ctaUrl"]','javascript:alert(1)'); pg.wait_for_timeout(300)
    ok('invalid url flagged', pg.is_visible('#wsinsp em.err'))
    hv=fr(pg).locator('.hero-cta a').first.get_attribute('href'); ok('invalid url never emitted as href (falls back to an in-page anchor)', 'javascript' not in hv and hv.startswith('#'), hv)
    pg.fill('#wsinsp [data-bind$="/ctaUrl"]','#sec-x'); pg.fill('#wsinsp [data-bind$="/ctaUrl"]','example.com/work'); pg.wait_for_timeout(500)
    ok('valid url normalised', fr(pg).locator('.hero-cta a').first.get_attribute('href')=='https://example.com/work')
    # section select
    fr(pg).locator('#main section').nth(2).click(position={'x':3,'y':3}); pg.wait_for_timeout(400)
    ok('section select', pg.evaluate('PV.S.ui.selKind')=='section')
    pg.select_option('#wsinsp [data-ss$="|bg"]','accent'); pg.wait_for_timeout(500)
    ok('section bg style stored', pg.evaluate('PV.S.project.sections.find(s=>s.id==PV.S.ui.selected.split("/")[1]).style.bg')=='accent')
    pg.click('.sel-tb [data-act=tb-x]'); pg.wait_for_timeout(200); ok('deselect', pg.evaluate('PV.S.ui.selected')==None)
    # undo / redo
    pg.wait_for_timeout(200)
    n=pg.evaluate('PV.S.past.length'); pg.click('.appbar [data-act=undo]'); pg.wait_for_timeout(400)
    ok('undo pops history', pg.evaluate('PV.S.past.length')==n-1)
    pg.click('.appbar [data-act=redo]'); pg.wait_for_timeout(400); ok('redo restores', pg.evaluate('PV.S.past.length')==n)
    # persistence
    pg.wait_for_timeout(900); pg.reload(); pg.wait_for_timeout(1500)
    ok('refresh keeps route', pg.evaluate('location.hash')=='#/editor')
    ok('refresh keeps edit', pg.evaluate('PV.S.project.person.name')=='Priya R.' and pg.evaluate('PV.S.project.sections.find(s=>s.type=="projects").items[0].title')=='Mandi Mitra Pro')
    ok('preview after refresh shows edit', fr(pg).locator('.name').inner_text()=='Priya R.')
    pg.screenshot(path='ed2.png')
    print('errs',errs)
    b.close()
bad=[r for r in res if not r[1]]; print(len(res)-len(bad),'passed',len(bad),'failed')
