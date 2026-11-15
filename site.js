(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');

  /* шапка: тень после прокрутки */
  var bar = doc.getElementById('bar');
  function onScroll() { bar.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* появление блоков */
  var rv = [].slice.call(doc.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('is-in'); }); }

  /* плавающая панель: показываем, когда кнопки первого экрана ушли вверх */
  var dock = doc.getElementById('dock'), hb = doc.querySelector('.hero__btns');
  function dockTick() { dock.classList.toggle('is-on', hb.getBoundingClientRect().bottom < 0); }
  window.addEventListener('scroll', dockTick, { passive: true }); window.addEventListener('resize', dockTick); dockTick();

  /* мобильное меню */
  var burger = doc.getElementById('burger'), menu = doc.getElementById('menu');
  function setMenu(open, focusBack) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (!open && focusBack) burger.focus();
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden && !doc.querySelector('dialog[open]')) setMenu(false, true);
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* формы-диалоги */
  var opener = null;
  var dlgs = { calc: doc.getElementById('dlg-calc'), lead: doc.getElementById('dlg-lead') };

  function resetDialog(d) {
    var form = d.querySelector('form'), done = d.querySelector('.done');
    form.reset(); form.hidden = false; done.hidden = true;
    [].forEach.call(form.querySelectorAll('.f'), function (f) {
      f.classList.remove('is-bad');
      var er = f.querySelector('.f__err'); if (er) er.remove();
      var i = f.querySelector('input,textarea'); i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby');
    });
  }
  function openDlg(kind, btn) {
    var d = dlgs[kind]; if (!d) return;
    opener = btn || null;
    setMenu(false);
    resetDialog(d);
    if (kind === 'calc') {
      var to = btn && btn.getAttribute('data-to');
      if (to) d.querySelector('[name="to"]').value = to;
    }
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    root.classList.add('lock');
    var toField = d.querySelector('[name="to"]');
    var target = (toField && toField.value) ? d.querySelector('[name="what"]') : d.querySelector('input');
    setTimeout(function () { target.focus(); }, 30);
  }
  function afterClose() {
    root.classList.remove('lock');
    var o = opener; opener = null;
    if (!o) return;
    if (doc.contains(o) && o.getClientRects().length && !o.closest('[hidden]')) o.focus();
    else if (getComputedStyle(burger).display !== 'none') burger.focus();
  }
  function closeDlg(d) {
    if (d.open) d.close();
    afterClose();
  }
  Object.keys(dlgs).forEach(function (k) {
    var d = dlgs[k];
    d.addEventListener('close', afterClose);
    d.addEventListener('click', function (e) {
      if (e.target === d) closeDlg(d);                       /* клик по подложке */
      if (e.target.closest('[data-close]')) closeDlg(d);
    });
    d.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); submit(d, e.target); });
    d.querySelector('form').addEventListener('input', function (e) {
      var f = e.target.closest('.f'); if (f && f.classList.contains('is-bad')) validateField(f);
    });
  });
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]');
    if (b) { e.preventDefault(); openDlg(b.getAttribute('data-open'), b); }
  });

  /* валидация */
  function phoneOk(v) { var d = v.replace(/\D/g, ''); return (d.length === 11 && (d[0] === '7' || d[0] === '8')) || d.length === 10; }
  function validateField(f) {
    var i = f.querySelector('input,textarea'), v = i.value.trim(), msg = '';
    if (i.required && !v) msg = 'Заполните поле';
    else if (i.type === 'tel' && v && !phoneOk(v)) msg = 'Введите телефон полностью, например +7 900 000-00-00';
    else if (i.name === 'name' && v && v.length < 2) msg = 'Введите имя';
    var er = f.querySelector('.f__err');
    if (msg) {
      if (!er) { er = doc.createElement('div'); er.className = 'f__err'; er.id = i.id + '-err'; er.setAttribute('role', 'alert'); f.appendChild(er); }
      er.textContent = msg; f.classList.add('is-bad'); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', er.id);
      return false;
    }
    if (er) er.remove(); f.classList.remove('is-bad'); i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby');
    return true;
  }
  function submit(d, form) {
    var bad = null;
    [].forEach.call(form.querySelectorAll('.f'), function (f) { if (!validateField(f) && !bad) bad = f; });
    if (bad) { bad.querySelector('input,textarea').focus(); return; }
    /* данные никуда не отправляются: только показываем итог */
    var dl = d.querySelector('.done__dl'); dl.textContent = '';
    [].forEach.call(form.querySelectorAll('.f'), function (f) {
      var i = f.querySelector('input,textarea'), v = i.value.trim(); if (!v) return;
      var row = doc.createElement('div'), dt = doc.createElement('dt'), dd = doc.createElement('dd');
      dt.textContent = f.querySelector('label').firstChild.textContent.trim(); dd.textContent = v;
      row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
    });
    form.hidden = true;
    var done = d.querySelector('.done'); done.hidden = false; done.focus();
  }

  /* карта Яндекса: грузим при подходе, запасной блок при ошибке или зависании */
  var map = doc.getElementById('map'), frame = doc.getElementById('mapFrame'), mapLoaded = false;
  function loadMap() {
    if (mapLoaded) return; mapLoaded = true;
    var t = setTimeout(function () { map.classList.add('is-failed'); }, 9000);
    frame.addEventListener('load', function () { clearTimeout(t); map.classList.add('is-ok'); });
    frame.addEventListener('error', function () { clearTimeout(t); map.classList.add('is-failed'); });
    if (!navigator.onLine) { clearTimeout(t); map.classList.add('is-failed'); return; }
    frame.src = frame.getAttribute('data-src');
  }
  if ('IntersectionObserver' in window) {
    var mo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: '300px' });
    mo.observe(map);
  } else loadMap();
})();
