import json,glob,os,sys
R=os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(R,'dist'),exist_ok=True)
def rd(p): return open(os.path.join(R,p),encoding='utf8').read()
assets="const CSS_BASE=%s;\nconst CSS_SKINS=%s;\nconst SITE_JS=%s;\nconst BRIDGE_JS=%s;\n"%tuple(json.dumps(rd(f)) for f in ['src/site/base.css','src/site/skins.css','src/site/site.js','src/site/bridge.js'])
files=sorted(glob.glob(os.path.join(R,'src/js/*.js')))
code="/* PortfolioVerse - generated bundle. Source modules live in src/js */\n(function(){\n"+assets+"\n".join(open(f,encoding='utf8').read() for f in files)+"\n})();\n"
open(os.path.join(R,'dist/bundle.js'),'w',encoding='utf8').write(code)
html=rd('src/index.html').replace('/*__CSS__*/',rd('src/app.css')).replace('/*__JS__*/',code.replace('</script','<\\/script'))
open(os.path.join(R,'dist/index.html'),'w',encoding='utf8').write(html)
print('built',len(html)//1024,'KB')
