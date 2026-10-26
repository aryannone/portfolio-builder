"""PortfolioVerse build script. Works with EITHER layout:
  nested : src/js/*.js, src/site/*, src/app.css, src/index.html   -> writes dist/index.html
  flat   : every file in ONE folder (01-core.js ... 13-main.js, base.css, skins.css, site.js, bridge.js, app.css, shell.html)
           -> writes index.html next to this script (this is what you upload to GitHub Pages)
Usage:  python3 build.py
"""
import json, glob, os
R = os.path.dirname(os.path.abspath(__file__))
nested = os.path.isdir(os.path.join(R, 'src'))
def find(name):
    for d in ('src/js', 'src/site', 'src', '.'):
        p = os.path.join(R, d, name)
        if os.path.isfile(p): return p
    raise SystemExit('Missing file: %s  (put it next to build.py, or in src/)' % name)
def rd(name): return open(find(name), encoding='utf8').read()
assets = "const CSS_BASE=%s;\nconst CSS_SKINS=%s;\nconst SITE_JS=%s;\nconst BRIDGE_JS=%s;\n" % tuple(json.dumps(rd(f)) for f in ['base.css', 'skins.css', 'site.js', 'bridge.js'])
mods = sorted(glob.glob(os.path.join(R, 'src/js/[0-9][0-9]-*.js')) if nested else glob.glob(os.path.join(R, '[0-9][0-9]-*.js')))
if len(mods) != 13: raise SystemExit('Expected 13 modules (01-core.js ... 13-main.js), found %d' % len(mods))
code = "/* PortfolioVerse - generated bundle. Source modules: 01-core.js ... 13-main.js */\n(function(){\n" + assets + "\n".join(open(f, encoding='utf8').read() for f in mods) + "\n})();\n"
shell = rd('index.html' if nested else 'shell.html')
html = shell.replace('/*__CSS__*/', rd('app.css')).replace('/*__JS__*/', code.replace('</script', '<\\/script'))
out = os.path.join(R, 'dist', 'index.html') if nested else os.path.join(R, 'index.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf8').write(html)
print('built', len(html) // 1024, 'KB ->', os.path.relpath(out, R))
