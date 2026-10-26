import os
_here=os.path.dirname(os.path.abspath(__file__))
_cand=[os.path.join(_here,'..','index.html'),os.path.join(_here,'index.html')]   # nested repo or flat repo
APP=os.environ.get('PV_APP','file://'+os.path.abspath(next((c for c in _cand if os.path.isfile(c)),_cand[0])))
OUTHTML='file://'+os.path.abspath('out.html')
import threading, http.server, functools, socketserver
def serve(directory=None):
    """Serve the built app over http on a free port (some bugs, e.g. frame navigation, only appear over http, not file://)."""
    directory = directory or os.path.dirname(APP.replace('file://', ''))
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a): pass
    srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=directory)); srv.allow_reuse_address = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
res=[]
def ok(name,cond,info=''):
    res.append((name,bool(cond),info)); print(('PASS ' if cond else 'FAIL ')+name, ('| '+str(info)) if not cond else '')
def to_editor(pg, system_idx=2, tpl=None, name='Test site'):
    pg.goto(APP); pg.wait_for_timeout(600)
    pg.click('.l-cta [data-act=startnew]'); pg.wait_for_timeout(200)
    pg.click(f'.sysopt:nth-child({system_idx})'); pg.fill('#wiz-name',name); pg.click('.stepbar [data-act=wiznext]'); pg.wait_for_timeout(500)
    if tpl: pg.click(f'.gcard:has-text("{tpl}") [data-act=tplpick]'); pg.wait_for_timeout(200)
    for _ in range(3): pg.click('.stepbar [data-act=next]'); pg.wait_for_timeout(400)
    pg.click('.nextbtn'); pg.wait_for_timeout(1200)
def fr(pg):
    pg.wait_for_function("document.querySelectorAll('#prevhost iframe').length==1")
    return pg.frame_locator('#prevhost iframe').last
