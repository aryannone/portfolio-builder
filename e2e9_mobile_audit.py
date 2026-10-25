"""Mobile audit: essential controls are reachable (not covered), sheets scroll, keyboard emulation, rotation, dialogs, fullscreen exit, refresh restore.
Usage: python3 e2e9_mobile_audit.py 390x844   (one viewport per run)"""
import os,json,sys
from playwright.sync_api import sync_playwright
from h import *
COV="""(sel)=>{const e=document.querySelector(sel);if(!e)return 'missing';const r=e.getBoundingClientRect();if(!r.width||!r.height)return 'hidden';const vh=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vvh'))||innerHeight;for(const [fx,fy] of [[.5,.5],[.25,.5],[.75,.5]]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(x<0||y<0||x>innerWidth||y>vh+1)return 'offscreen('+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.bottom)+' vh='+vh+')';const t=document.elementFromPoint(x,y);if(!(t===e||e.contains(t)))return 'covered by '+(t&&(t.tagName+'.'+String(t.className).slice(0,25)))}return 'ok'}"""
issues=[]
def chk(pg,label,sels):
    for s in sels:
        r=pg.evaluate(COV,s)
        if r!='ok': issues.append(f'{label}: {s} -> {r}')
VPS=[tuple(int(x) for x in sys.argv[1].split('x'))]
with sync_playwright() as p:
    b=p.chromium.launch()
    for (W,H) in VPS:
        c=b.new_context(viewport={'width':W,'height':H},has_touch=W<900,is_mobile=W<900,accept_downloads=True); pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:100]))
        tag=f'{W}x{H}'; mob=W<=900
        pg.goto(APP); pg.wait_for_timeout(700)
        chk(pg,tag+' landing',['.appbar .back','.l-cta [data-act=startnew]'])
        pg.click('.l-cta [data-act=startnew]'); pg.wait_for_timeout(400); chk(pg,tag+' style',['.appbar .back','.stepbar [data-act=wiznext]','.stepbar [data-act=back]'])
        pg.click('.stepbar [data-act=wiznext]'); pg.wait_for_timeout(700); chk(pg,tag+' template',['.appbar .back','.stepbar [data-act=next]','.stepbar [data-act=back]'])
        pg.click('.stepbar [data-act=next]'); pg.wait_for_timeout(500); chk(pg,tag+' info',['.appbar .back','.stepbar [data-act=next]'])
        # long form scroll check
        sc=pg.evaluate("(()=>{const e=document.querySelector(mobile?'.sbody':'.pane-form');return e?[e.scrollHeight>e.clientHeight, e.scrollTop]:null})()".replace('mobile',str(mob).lower()))
        if mob:
            pg.evaluate("document.querySelector('.sbody').scrollTop=9999"); st=pg.evaluate("document.querySelector('.sbody').scrollTop"); 
            if st<=0: issues.append(f'{tag} info: long form not scrollable (scrollTop={st})')
            chk(pg,tag+' info(scrolled)',['.stepbar [data-act=next]','.appbar .back'])
        pg.click('.stepbar [data-act=next]'); pg.wait_for_timeout(500); chk(pg,tag+' sections',['.appbar .back','.stepbar [data-act=next]'])
        pg.click('.stepbar [data-act=next]'); pg.wait_for_timeout(1000); chk(pg,tag+' customize',['.appbar .back','.appbar .nextbtn']+(['.bn button:nth-child(1)','.bn button:nth-child(4)'] if mob else []))
        pg.click('.appbar .nextbtn'); pg.wait_for_timeout(1300)
        base=['.appbar .back','.appbar .nextbtn','.devbar .dev-btn:nth-child(1)','.devbar [data-act=fullscreen]']
        if mob: base+=['.bn button:nth-child(1)','.bn button:nth-child(5)']
        chk(pg,tag+' editor',base)
        # FAB vs portfolio hamburger overlap
        if mob:
            hb=pg.evaluate("(()=>{const f=document.querySelector('#prevhost iframe');const fr=f.getBoundingClientRect();return [fr.left,fr.top,fr.width]})()")
            fab=pg.evaluate("(()=>{const e=document.querySelector('.miy-fab');if(!e||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
            nt=fr(pg).locator('.nav-toggle'); 
            if fab and nt.count() and nt.is_visible():
                bb=nt.bounding_box(); ox=hb[0]+bb['x']; oy=hb[1]+bb['y']
                if not (ox+bb['width']<fab[0] or ox>fab[2] or oy+bb['height']<fab[1] or oy>fab[3]): issues.append(f'{tag} editor: Make-it-yours FAB covers the portfolio\'s own menu button (fab={fab} toggle=({ox:.0f},{oy:.0f}))')
        # sheets
        if mob:
            pg.tap('.bn [data-sheet=content]'); pg.wait_for_timeout(500); chk(pg,tag+' content sheet',['.sheet-grab .iconbtn','#wspanel .tab:nth-child(1)','.bn button:nth-child(2)'])
            sh=pg.evaluate("(()=>{const e=document.querySelector('#wspanel .tabbody');e.scrollTop=9999;return [e.scrollHeight>e.clientHeight,e.scrollTop]})()"); 
            if not (sh[0] and sh[1]>0): issues.append(f'{tag} content sheet not scrollable {sh}')
            # keyboard emulation: shrink visual viewport and focus a field
            pg.evaluate(f"window.__pvVV={int(H*0.5)};window.dispatchEvent(new Event('resize'))"); pg.wait_for_timeout(500)
            inp=pg.locator('#wspanel input:visible').first; inp.focus(); pg.wait_for_timeout(700)
            r=pg.evaluate("(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();const vh=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vvh'));const bn=document.querySelector('.bn').getBoundingClientRect();const pn=document.querySelector('#wspanel').getBoundingClientRect();return {top:r.top,bottom:r.bottom,vh,bnBottom:bn.bottom,bnTop:bn.top,panelTop:pn.top,panelBottom:pn.bottom}})()")
            if r['bottom']>r['bnTop']+1 or r['top']<r['panelTop']-1 or r['bnBottom']>r['vh']+1 or r['panelTop']<0: issues.append(f'{tag} keyboard-emulated(vv={r["vh"]}): input {r["top"]:.0f}-{r["bottom"]:.0f}, bottomNav {r["bnTop"]:.0f}-{r["bnBottom"]:.0f}, panel {r["panelTop"]:.0f}-{r["panelBottom"]:.0f}')
            pg.evaluate("window.__pvVV=undefined;window.dispatchEvent(new Event('resize'))"); pg.wait_for_timeout(300)
            pg.tap('#wspanel [data-act=closesheet]'); pg.wait_for_timeout(400)
            # select + toolbar + inspector
            fr(pg).locator('.name').tap(); pg.wait_for_timeout(600); chk(pg,tag+' selected toolbar',['.sel-tb button:nth-child(2)','.sel-tb button:last-child'])
            pg.tap('.sel-tb [data-act=tb-insp]'); pg.wait_for_timeout(600); chk(pg,tag+' inspector',['#wsinsp .insp-h .iconbtn','.bn button:nth-child(1)'])
            # orientation switch with inspector open
            pg.set_viewport_size({'width':H,'height':W}); pg.wait_for_timeout(700)
            sel=pg.evaluate('PV.S.ui.selected'); 
            chk(pg,tag+' after rotate',['.appbar .back']+(['.bn button:nth-child(1)'] if max(W,H)<=900 else []))
            ov=pg.evaluate('document.documentElement.scrollWidth-innerWidth'); 
            if ov>1 or sel!='person/name': issues.append(f'{tag} rotate: overflow={ov} selection={sel}')
            pg.set_viewport_size({'width':W,'height':H}); pg.wait_for_timeout(500)
        # fullscreen exit on touch
        pg.evaluate("PV.ACT.fullscreen()"); pg.wait_for_timeout(400); chk(pg,tag+' fullscreen',['.pv-exit']); pg.evaluate("document.querySelector('.pv-exit').click()"); pg.wait_for_timeout(300)
        if pg.evaluate("document.querySelector('.pv-wrap').classList.contains('full')"): issues.append(f'{tag} fullscreen exit button did not exit')
        # dialog on short viewport
        pg.evaluate("(()=>{PV.ACT.projmenu();return 1})()"); pg.wait_for_timeout(400)
        d=pg.evaluate("(()=>{const e=document.querySelector('.dlg');const r=e.getBoundingClientRect();return [r.top,r.bottom,innerHeight,e.querySelector('.dlg-f').getBoundingClientRect().bottom]})()")
        if d[0]<-1 or d[3]>d[2]+1: issues.append(f'{tag} dialog clipped {d}')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        if pg.locator('.dlg-wrap').count(): issues.append(f'{tag} Escape did not dismiss dialog')
        # refresh restore
        pg.evaluate("PV.editPath('person/name','Persisted?')"); pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(1500)
        if pg.evaluate('PV.S.project.person.name')!='Persisted?' or pg.evaluate('location.hash')!='#/editor': issues.append(f'{tag} refresh restore failed')
        if errs: issues.append(f'{tag} page errors {errs[:2]}')
        c.close()
    b.close()
W_,H_=VPS[0]; ok(f'{W_}x{H_}: no unreachable/overlapping essential controls, overflow, keyboard or dialog problems', not issues, issues)
for i in issues: print('  ISSUE',i)
bad=[r for r in res if not r[1]]; print(len(res)-len(bad),'passed',len(bad),'failed')
