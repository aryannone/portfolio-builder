/* Portfolio runtime. Edit CFG to tweak behaviour; everything else is plain DOM code. */
(function () {
  /*__CFG__*/
  var d = document, root = d.documentElement, body = d.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  var animate = !reduce && CFG.entrance !== 'none' && CFG.animate !== false;
  if (animate) root.classList.add('anim');

  /* Navigation toggle */
  var nav = d.querySelector('.nav'), tg = d.querySelector('.nav-toggle');
  if (nav && tg) {
    tg.addEventListener('click', function () { var o = nav.classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
    nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.nav-links a')) { nav.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); } });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nav.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); } });
  }

  /* Scroll reveal */
  var rv = [].slice.call(d.querySelectorAll('.rv'));
  if (animate && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.04, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* Active nav link */
  var links = [].slice.call(d.querySelectorAll('.nav-links a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); } }); }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var t = d.getElementById(a.getAttribute('href').slice(1)); if (t) so.observe(t); });
  }

  /* Typewriter */
  var tw = d.querySelector('[data-typewriter]');
  if (tw && CFG.typewriter && !reduce) {
    var words = (tw.getAttribute('data-typewriter') || '').split('|').filter(Boolean), wi = 0, ci = 0, del = false;
    if (words.length) {
      tw.classList.add('typed');
      (function tick() {
        var w = words[wi];
        tw.textContent = w.slice(0, ci);
        if (!del && ci < w.length) { ci++; setTimeout(tick, 55); }
        else if (!del) { if (words.length === 1) return; del = true; setTimeout(tick, 1400); }
        else if (ci > 0) { ci--; setTimeout(tick, 28); }
        else { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 300); }
      })();
    }
  }

  /* Parallax */
  var px = [].slice.call(d.querySelectorAll('[data-parallax]'));
  if (px.length && CFG.parallax && !reduce) {
    var raf = 0;
    var run = function () { raf = 0; var y = window.scrollY, k = CFG.intensity / 400; px.forEach(function (el) { var s = parseFloat(el.getAttribute('data-parallax')) || 1; el.style.transform = 'translate3d(0,' + (y * k * s * -1).toFixed(1) + 'px,0)'; }); };
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(run); }, { passive: true }); run();
  }

  /* Progress bar */
  var pb = d.querySelector('.progress');
  if (pb) window.addEventListener('scroll', function () { var h = root.scrollHeight - innerHeight; pb.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%'; }, { passive: true });

  /* Project filters (tags) */
  [].forEach.call(d.querySelectorAll('.filters'), function (f) {
    var cards = [].slice.call(f.parentNode.querySelectorAll('.card[data-tags]'));
    f.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      [].forEach.call(f.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      var tag = b.getAttribute('data-tag');
      cards.forEach(function (c) { c.hidden = !!tag && (c.getAttribute('data-tags') || '').split('|').indexOf(tag) < 0; });
    });
  });

  /* Contact form -> opens the visitor's mail app (no server needed) */
  var form = d.querySelector('form[data-mailto]');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = form.elements.name.value, m = form.elements.message.value, f = form.elements.from.value;
    location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent('Hello from ' + n) + '&body=' + encodeURIComponent(m + '\n\n— ' + n + ' (' + f + ')');
  });

  /* Decor: floating shapes follow the pointer, glow follows the cursor */
  var shapes = [].slice.call(d.querySelectorAll('.d-shapes b')), glow = d.querySelector('.d-glow');
  if ((shapes.length || glow) && !reduce) window.addEventListener('pointermove', function (e) {
    var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    shapes.forEach(function (s, i) { var k = (i + 1) * 14 * (CFG.intensity / 50); s.style.translate = (x * k).toFixed(1) + 'px ' + (y * k).toFixed(1) + 'px'; });
    if (glow) { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }
  }, { passive: true });
})();
