(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // ---------- Theme toggle ----------
  var toggle = document.getElementById('themeToggle');
  function isDark() {
    if (root.dataset.theme) return root.dataset.theme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  toggle.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ---------- Mobile menu ----------
  var menuBtn = document.getElementById('menuBtn');
  var menu = document.getElementById('navMenu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });
  var wide = window.matchMedia('(min-width: 761px)');
  var onWide = function (mq) { if (mq.matches) setMenu(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);

  // ---------- Hero visual: gentle pointer parallax (mouse devices only) ----------
  var visual = document.getElementById('heroVisual');
  if (visual && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var raf = 0, tx = 0, ty = 0;
    var hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = visual.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
      if (!raf) raf = requestAnimationFrame(function () {
        visual.style.setProperty('--px', tx.toFixed(3));
        visual.style.setProperty('--py', ty.toFixed(3));
        raf = 0;
      });
    });
    hero.addEventListener('pointerleave', function () {
      visual.style.setProperty('--px', 0);
      visual.style.setProperty('--py', 0);
    });
  }

  // ---------- Hero image fade-in ----------
  var heroImg = document.querySelector('.hero-photo img');
  if (heroImg) {
    var markLoaded = function () { heroImg.classList.add('loaded'); };
    if (heroImg.complete) markLoaded();
    else { heroImg.addEventListener('load', markLoaded); heroImg.addEventListener('error', markLoaded); }
  }

  // ---------- Year ----------
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---------- Scroll progress ----------
  var bar = document.getElementById('progressBar');
  var nav = document.querySelector('.nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Rotating role line ----------
  var phrases = [
    'build AI tools with Claude',
    'own Tier 3 escalations end to end',
    'turn support data into answers',
    'trained CNNs before it was my job',
    'won a company-wide global hackathon'
  ];
  var el = document.getElementById('rotate');
  if (el && !reduce) {
    var i = 0, chars = phrases[0].length, deleting = true;
    setTimeout(function tick() {
      var p = phrases[i];
      if (deleting) {
        chars--;
        el.textContent = p.slice(0, chars);
        if (chars === 0) { deleting = false; i = (i + 1) % phrases.length; }
        setTimeout(tick, 28);
      } else {
        p = phrases[i];
        chars++;
        el.textContent = p.slice(0, chars);
        if (chars === p.length) { deleting = true; setTimeout(tick, 2200); }
        else setTimeout(tick, 55);
      }
    }, 2600);
  }

  // ---------- Count-up ----------
  function countUp(n) {
    var target = parseInt(n.dataset.count, 10);
    if (reduce || !target) { n.textContent = target; return; }
    var start = null, dur = 1200;
    n.textContent = '0';
    requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    });
  }

  // ---------- Reveal on scroll ----------
  var items = document.querySelectorAll('.reveal');
  function show(elm) {
    elm.classList.add('in');
    var n = elm.querySelector('[data-count]');
    if (n) countUp(n);
  }
  if (!hasIO) {
    items.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (elm) { io.observe(elm); });
  }

  // ---------- Project filters ----------
  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('.cards .card');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      cards.forEach(function (card) {
        var match = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hidden', !match);
        card.classList.remove('pop');
        if (match) {
          card.classList.add('in');
          void card.offsetWidth; // restart the fade-in
          card.classList.add('pop');
        }
      });
    });
  });

  // ---------- Active nav link ----------
  var links = document.querySelectorAll('.nav-links a');
  if (hasIO) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) navIO.observe(s);
    });
  }
})();
