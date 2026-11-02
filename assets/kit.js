/* TESI 2108 · piezas comunes para las unidades (después de deck.js).
   Kit.photos(dir, CRED)   fotos guardadas en assets/img/<dir>; <img data-cm="Archivo_de_Commons.jpg">
   Kit.credits(ol, CRED)   lista de créditos (autor y licencia) en un <ol>
   Kit.sorter(chipsEl, scopeEl, items, msgEl, doneMsg)   clasificar: items = [[texto, bin, explicación], …]; bins con data-bin
   Kit.quiz(rootEl, preguntas)   ejercicio corto: [[pregunta, [opciones], índice correcto, explicación], …]
   Kit.goto()              botones [data-goto="idDeLámina"] */
(function () {
  'use strict';
  var K = window.Kit = {};
  var CM = 'https://commons.wikimedia.org/wiki/';

  K.src = function (dir, CRED, name) {
    var c = CRED[name]; if (!c) return '';
    var p = 'assets/img/' + dir + '/' + c.f + '.jpg';
    return (window.IMGDATA && window.IMGDATA[p]) || p;
  };
  K.setPhoto = function (img, dir, CRED, name) {
    var fig = img.closest('figure');
    if (fig) fig.classList.remove('nofoto');
    img.style.display = '';
    var s = name ? K.src(dir, CRED, name) : '';
    if (!s) { if (fig) fig.classList.add('nofoto'); img.removeAttribute('src'); img.style.display = 'none'; return; }
    img.onerror = function () { if (fig) fig.classList.add('nofoto'); img.style.display = 'none'; };
    img.src = s;
  };
  K.photos = function (dir, CRED) {
    [].forEach.call(document.querySelectorAll('img[data-cm]'), function (img) { K.setPhoto(img, dir, CRED, img.getAttribute('data-cm')); });
  };
  K.credits = function (ol, CRED, extra) {
    var seen = {};
    function add(n, alt) {
      if (!n || seen[n] || !CRED[n]) return; seen[n] = 1;
      var c = CRED[n], li = document.createElement('li');
      li.innerHTML = '<a href="' + CM + 'File:' + encodeURIComponent(n) + '" target="_blank" rel="noopener">' + alt + '</a>' + (c.a ? ' · ' + c.a : '') + (c.l ? ' · ' + c.l : '');
      ol.appendChild(li);
    }
    [].forEach.call(document.querySelectorAll('img[data-cm]'), function (img) { add(img.getAttribute('data-cm'), img.alt); });
    (extra || []).forEach(function (e) { add(e[0], e[1]); });
  };

  K.sorter = function (chips, scope, items, msg, okMsg) {
    var sel = null, done = 0;
    items.forEach(function (it) {
      var c = document.createElement('button'); c.className = 'chip'; c.textContent = it[0]; c.dataset.k = it[1]; c.dataset.w = it[2] || '';
      c.onclick = function () { if (c.classList.contains('ok')) return; [].forEach.call(chips.children, function (x) { x.classList.remove('sel', 'bad'); }); sel = c; c.classList.add('sel'); };
      chips.appendChild(c);
    });
    [].forEach.call(scope.querySelectorAll('[data-bin]'), function (bin) {
      bin.style.cursor = 'pointer';
      bin.onclick = function () {
        if (!sel) { msg.textContent = 'Primero toca un elemento.'; return; }
        if (sel.dataset.k === bin.dataset.bin) {
          var s = document.createElement('span'); s.textContent = sel.textContent; bin.querySelector('.in').appendChild(s);
          sel.classList.remove('sel'); sel.classList.add('ok'); sel.disabled = true; done++;
          msg.textContent = 'Correcto: ' + sel.textContent + '. ' + sel.dataset.w;
          if (done === items.length) msg.textContent = okMsg;
        } else { sel.classList.remove('sel'); sel.classList.add('bad'); msg.textContent = 'No va ahí. Piénsalo otra vez: ' + sel.textContent + '.'; }
        sel = null;
      };
    });
  };

  K.quiz = function (root, QZ) {
    var q = function (c) { return root.querySelector(c); };
    var qi = 0, res = [], answered = false;
    function dots() { q('.dots').innerHTML = QZ.map(function (x, i) { return '<i class="' + (res[i] === true ? 'ok' : res[i] === false ? 'bad' : i === qi ? 'cur' : '') + '"></i>'; }).join(''); }
    function show() {
      var nx = q('.qz-next');
      if (qi >= QZ.length) {
        var sc = res.filter(Boolean).length;
        q('.qz-q').textContent = 'Resultado: ' + sc + ' de ' + QZ.length + ' correctas'; q('.ops').innerHTML = '';
        q('.why').textContent = sc === QZ.length ? '¡Excelente! Dominas esta unidad.' : sc >= QZ.length - 2 ? '¡Muy bien! Repasa las preguntas en rojo.' : 'Repasa los temas de las preguntas en rojo y vuelve a intentarlo.';
        q('.qz-n').textContent = ''; nx.textContent = 'Repetir'; nx.disabled = false; dots(); return;
      }
      var it = QZ[qi]; answered = false;
      q('.qz-q').textContent = (qi + 1) + '. ' + it[0];
      q('.ops').innerHTML = it[1].map(function (o, i) { return '<button data-o="' + i + '">' + o + '</button>'; }).join('');
      q('.why').textContent = 'Escoge una respuesta.'; q('.qz-n').textContent = 'Pregunta ' + (qi + 1) + ' de ' + QZ.length;
      nx.textContent = qi === QZ.length - 1 ? 'Ver resultado' : 'Siguiente'; nx.disabled = true; dots();
      [].forEach.call(q('.ops').children, function (b) {
        b.onclick = function () {
          if (answered) return; answered = true; var ok = +b.dataset.o === it[2]; res[qi] = ok;
          b.classList.add(ok ? 'ok' : 'bad'); q('.ops').children[it[2]].classList.add('ok');
          q('.why').textContent = (ok ? 'Correcto. ' : 'Incorrecto. ') + it[3]; nx.disabled = false; dots();
        };
      });
    }
    q('.qz-next').onclick = function () { if (qi >= QZ.length) { qi = 0; res = []; } else qi++; show(); };
    show();
  };

  K.goto = function () {
    var slides = [].slice.call(document.querySelectorAll('.slide'));
    [].forEach.call(document.querySelectorAll('[data-goto]'), function (b) {
      b.onclick = function () { Deck.go(slides.indexOf(document.getElementById(b.dataset.goto))); };
    });
  };
})();
