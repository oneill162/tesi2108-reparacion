/* TESI 2108 · motor común (heredado de TESI 2105) de presentaciones interactivas
   Uso: <script src="assets/deck.js"></script> al final de la página, después de las láminas.
   Láminas: <section class="slide" data-title="…">. Capítulos: class="slide chapter".
   Entradas animadas: data-a en los elementos (máx. 4 pasos por lámina).
   Títulos con máscara: <h2 class="mask"><span>…</span></h2>.
   Código: <pre class="code">; data-raw = sin colores; data-hash = # es comentario (shell, Python).
   Interactivos comunes: [data-step] (paso a paso), [data-rv] (revelar), [data-tabs] (pestañas). */
(function () {
  'use strict';
  var D = window.Deck = {};
  var stage = document.getElementById('stage');
  var S = [].slice.call(document.querySelectorAll('.slide'));
  var N = S.length, k = -1, busy = null;
  var unitName = stage.getAttribute('data-name') || '';

  /* ---------- highlight code ---------- */
  var RX = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(int|double|float|char|bool|void|return|for|while|do|if|else|const|nullptr|using|namespace|include|true|false|class|struct|public|static|unsigned|long|short|sizeof|static_cast|string|print|def|cout|cin|endl|printf|program|end|Begin|End|DISPLAY|STOP|RUN|PROCEDURE|DIVISION|IDENTIFICATION|git)\b|\b(\d+(?:\.\d+)?)\b/gm;
  D.hl = function (pre) {
    var keepHash = pre.hasAttribute('data-hash');
    pre.innerHTML = pre.innerHTML.split('\n').map(function (l) {
      var h = l.replace(RX, function (m, c, s, kw, n) {
        if (c) { if (!keepHash && c[0] === '#') return '<span class="k">' + c + '</span>'; return '<span class="c">' + c + '</span>'; }
        if (s) return '<span class="s">' + s + '</span>';
        if (kw) return '<span class="k">' + kw + '</span>';
        return '<span class="n">' + n + '</span>';
      });
      return '<span class="ln">' + (h || ' ') + '</span>';
    }).join('');
  };
  [].forEach.call(document.querySelectorAll('pre.code:not([data-raw])'), D.hl);

  /* ---------- entrance order ---------- */
  S.forEach(function (s) {
    var a = s.querySelectorAll('[data-a]');
    for (var i = 0; i < a.length; i++) if (!a[i].style.getPropertyValue('--i')) a[i].style.setProperty('--i', Math.min(i, 3));
    var m = s.querySelectorAll('.mask');
    for (var j = 0; j < m.length; j++) m[j].style.setProperty('--i', j);
  });

  /* ---------- bar ---------- */
  var bar = document.createElement('nav'); bar.id = 'bar'; bar.setAttribute('aria-label', 'Navegación de la presentación');
  bar.innerHTML = '<span class="name">' + unitName + '</span>' +
    '<button id="prev" aria-label="Lámina anterior">Anterior</button><div id="map"></div>' +
    '<button id="next" aria-label="Lámina siguiente">Siguiente</button><span id="count" aria-live="polite"></span>' +
    '<button id="idxb" aria-haspopup="true">Índice</button><button id="fsb">Pantalla completa</button>';
  stage.appendChild(bar);
  var map = bar.querySelector('#map'), count = bar.querySelector('#count');
  S.forEach(function (s, i) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', 'Lámina ' + (i + 1) + ': ' + (s.dataset.title || ''));
    b.title = (i + 1) + '. ' + (s.dataset.title || '');
    if (s.classList.contains('chapter')) b.className = 'ch';
    b.onclick = function () { go(i); };
    map.appendChild(b);
  });
  var mb = [].slice.call(map.children);

  /* ---------- index ---------- */
  var idx = document.createElement('div'); idx.id = 'index';
  var lis = S.map(function (s, i) {
    return '<li class="' + (s.classList.contains('chapter') ? 'ch' : '') + '"><a href="#' + (i + 1) + '" data-go="' + i + '">' + (s.dataset.title || ('Lámina ' + (i + 1))) + '</a></li>';
  }).join('');
  idx.innerHTML = '<div class="menu" role="dialog" aria-label="Índice"><h3>Índice</h3><ol>' + lis + '</ol></div>';
  stage.appendChild(idx);
  idx.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (a) { e.preventDefault(); toggleIdx(false); go(+a.dataset.go); }
    else if (e.target === idx) toggleIdx(false);
  });
  function toggleIdx(on) {
    idx.classList.toggle('open', on);
    [].forEach.call(idx.querySelectorAll('li'), function (li, i) { li.classList.toggle('cur', i === k); });
    if (on) { var c = idx.querySelector('li.cur a'); (c || idx.querySelector('a')).focus(); }
  }

  /* ---------- navigation ---------- */
  function go(i, instant) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === k) return;
    var back = i < k, old = S[k];
    if (busy) { clearTimeout(busy); S.forEach(function (s) { s.classList.remove('leaving', 'entering', 'back'); }); }
    if (old) { old.classList.remove('on', 'entering', 'back'); if (!instant) { old.classList.add('leaving'); if (back) old.classList.add('back'); } }
    k = i;
    var s = S[k];
    s.classList.add('on');
    if (!instant) { s.classList.add('entering'); if (back) s.classList.add('back'); }
    busy = setTimeout(function () {
      S.forEach(function (x) { x.classList.remove('leaving', 'entering', 'back'); });
      busy = null;
    }, 1500);
    mb.forEach(function (b, j) { b.classList.toggle('cur', j === k); b.classList.toggle('seen', j < k); });
    count.textContent = (k + 1) + ' de ' + N;
    try { history.replaceState(null, '', '#' + (k + 1)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('deck:slide', { detail: { index: k, slide: s } }));
  }
  D.go = go; D.index = function () { return k; };
  bar.querySelector('#prev').onclick = function () { go(k - 1); };
  bar.querySelector('#next').onclick = function () { go(k + 1); };
  bar.querySelector('#idxb').onclick = function () { toggleIdx(!idx.classList.contains('open')); };
  function fs() {
    var d = document, e = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { var r = e.requestFullscreen || e.webkitRequestFullscreen; if (r) r.call(e); }
  }
  bar.querySelector('#fsb').onclick = fs;

  document.addEventListener('keydown', function (e) {
    var t = e.target, tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) { if (e.key === 'Escape') t.blur(); return; }
    if (idx.classList.contains('open')) { if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') { toggleIdx(false); } return; }
    var onBtn = tag === 'BUTTON' || tag === 'A';
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !onBtn)) { e.preventDefault(); go(k + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(k - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(N - 1);
    else if (e.key === 'f' || e.key === 'F') fs();
    else if (e.key === 'i' || e.key === 'I') toggleIdx(true);
  });
  var x0 = null;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60 && !e.target.closest('button,input,a')) go(k + (dx < 0 ? 1 : -1));
  });
  function fit() { var s = Math.min(innerWidth / 1280, innerHeight / 720); stage.style.transform = 'scale(' + s + ')'; }
  addEventListener('resize', fit); fit();

  /* ---------- reveal ---------- */
  [].forEach.call(document.querySelectorAll('[data-rv]'), function (b) {
    var lbl = b.textContent, box = b.closest('[data-rv-box]') || b.parentNode;
    b.setAttribute('aria-expanded', 'false');
    b.onclick = function () { var on = box.classList.toggle('shown'); b.textContent = on ? (b.dataset.rv || 'Ocultar') : lbl; b.setAttribute('aria-expanded', on); };
  });

  /* ---------- tabs ---------- */
  [].forEach.call(document.querySelectorAll('[data-tabs]'), function (w) {
    var bs = w.querySelectorAll('[data-tab]'), ps = w.querySelectorAll('[data-panel]');
    function show(id) {
      [].forEach.call(bs, function (b) { b.setAttribute('aria-pressed', b.dataset.tab === id); });
      [].forEach.call(ps, function (p) { p.hidden = p.dataset.panel !== id; });
    }
    [].forEach.call(bs, function (b) { b.onclick = function () { show(b.dataset.tab); }; });
    show(w.getAttribute('data-tabs') || bs[0].dataset.tab);
  });

  /* ---------- stepper ----------
     <div data-step="id"> … <pre class="code"> … <div class="ws">estado</div> … [data-s=next] [data-s=reset] .stepn
     Deck.steps[id] = [{l: línea, set:{id:valor}, show:[], hide:[], flash:[], out:'texto', msg:'texto', run: fn(q)}] */
  D.steps = {};
  D.initSteppers = function () {
    [].forEach.call(document.querySelectorAll('[data-step]'), function (w) {
      if (w._init) return; w._init = true;
      var ws = w.querySelector('.ws'), init = ws.innerHTML, steps = D.steps[w.getAttribute('data-step')] || [];
      var code = w.querySelector('pre.code'), n = w.querySelector('.stepn'), nb = w.querySelector('[data-s=next]'), i = 0;
      var q = function (id) { return ws.querySelector('[data-id="' + id + '"]'); };
      function apply(st, anim) {
        if (code) [].forEach.call(code.querySelectorAll('.ln'), function (l, j) { l.classList.toggle('cur', j === st.l); });
        Object.keys(st.set || {}).forEach(function (id) { var e = q(id); if (e) e.textContent = st.set[id]; });
        (st.show || []).forEach(function (id) { var e = q(id); if (e) e.hidden = false; });
        (st.hide || []).forEach(function (id) { var e = q(id); if (e) e.hidden = true; });
        (st.add || []).forEach(function (p) { var e = q(p[0]); if (e) e.classList.add(p[1]); });
        (st.rem || []).forEach(function (p) { var e = q(p[0]); if (e) e.classList.remove(p[1]); });
        if (st.out) { var o = q('out'); if (o) o.appendChild(document.createTextNode(st.out + '\n')); }
        if (st.run) st.run(q, anim);
        if (anim) (st.flash || []).forEach(function (id) { var e = q(id); if (e) { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); } });
        var m = q('msg'); if (m && st.msg) m.textContent = st.msg;
      }
      function render() {
        ws.innerHTML = init;
        if (code) [].forEach.call(code.querySelectorAll('.ln'), function (l) { l.classList.remove('cur'); });
        for (var j = 0; j < i; j++) apply(steps[j], j === i - 1);
        if (n) n.textContent = 'Paso ' + i + ' de ' + steps.length;
        if (nb) nb.disabled = i >= steps.length;
      }
      if (nb) nb.onclick = function () { if (i < steps.length) { i++; render(); } };
      var rb = w.querySelector('[data-s=reset]'); if (rb) rb.onclick = function () { i = 0; render(); if (nb) nb.focus(); };
      render();
    });
  };

  /* ---------- temporizador: <div class="timer" data-timer="120"></div> ---------- */
  [].forEach.call(document.querySelectorAll('[data-timer]'), function (w) {
    var total = +w.getAttribute('data-timer') || 120, left = total, iv = null;
    w.innerHTML = '<span class="t-num" aria-live="off"></span><div class="row"><button class="go">Iniciar</button><button>Reiniciar</button></div>';
    var num = w.querySelector('.t-num'), bs = w.querySelectorAll('button');
    function draw() { num.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2); w.classList.toggle('done', left === 0); }
    function stop() { clearInterval(iv); iv = null; bs[0].textContent = left ? 'Continuar' : 'Iniciar'; }
    bs[0].onclick = function () {
      if (iv) { stop(); return; }
      if (!left) left = total;
      bs[0].textContent = 'Pausar';
      iv = setInterval(function () { left--; draw(); if (left <= 0) { left = 0; draw(); stop(); bs[0].textContent = 'Iniciar'; } }, 1000);
    };
    bs[1].onclick = function () { stop(); left = total; bs[0].textContent = 'Iniciar'; draw(); };
    document.addEventListener('deck:slide', function () { if (iv) stop(); });
    draw();
  });

  D.start = function () {
    D.initSteppers();
    var h = parseInt((location.hash || '').slice(1), 10);
    go(h > 0 ? h - 1 : 0, true);
    S[k].classList.add('entering');
    setTimeout(function () { S[k].classList.remove('entering'); }, 1500);
  };
})();
