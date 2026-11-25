// Revive IV Lounge: flowing animations
// GSAP + ScrollTrigger + SplitText for motion, Lenis for smooth scrolling.
// Presets follow the UI/UX Pro Max motion guide (expo.out reveals, back.out stagger, subtle scrub parallax).
// Everything is skipped for visitors who turn on "reduce motion", and the page is fully usable if these libraries fail to load.
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    document.documentElement.classList.add('motion');

    // ---------- Smooth, flowy scrolling ----------
    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return 1 - Math.pow(1 - t, 4); }, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.documentElement.style.scrollBehavior = 'auto';
      // In-page links glide to their section, clearing the sticky header
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          var target = id === '#top' ? 0 : document.querySelector(id);
          if (target === null) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -76 });
        });
      });
    }

    // ---------- Hero: headline rises in, letter by letter ----------
    var h1 = document.querySelector('.hero h1');
    var heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (window.SplitText) {
      var split = new window.SplitText(h1, { type: 'words,chars', wordsClass: 'w' });
      gsap.set(h1, { perspective: 600 });
      heroTl.from(split.chars, { opacity: 0, yPercent: 60, rotateX: -50, filter: 'blur(6px)', duration: 1, stagger: 0.022 }, 0.15);
    } else {
      heroTl.from(h1, { opacity: 0, y: 30, duration: 1 }, 0.15);
    }
    heroTl
      .from('.pill-badge', { opacity: 0, y: -12, scale: 0.9, duration: 0.8 }, 0)
      .from('.hero-sub', { opacity: 0, y: 24, filter: 'blur(4px)', duration: 1 }, 0.55)
      .from('.hero-actions > *', { opacity: 0, y: 24, scale: 0.96, duration: 0.9, stagger: 0.1 }, 0.7)
      .from('.trust-row li', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.9)
      .from('.blob', { opacity: 0, scale: 0.6, duration: 2, stagger: 0.2, ease: 'power2.out' }, 0);

    // Background blobs drift at different speeds as you scroll (parallax depth)
    gsap.utils.toArray('.blob').forEach(function (blob, i) {
      gsap.to(blob, { yPercent: (i + 1) * 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    });
    // Hero content gently lifts and fades as it scrolls away
    gsap.to('.hero-inner', { yPercent: -12, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 } });

    // ---------- Section headings: words rise in ----------
    gsap.utils.toArray('.section-head h2, .booking h2').forEach(function (h) {
      var target = h;
      if (window.SplitText) target = new window.SplitText(h, { type: 'words', wordsClass: 'w' }).words;
      gsap.from(target, {
        opacity: 0, yPercent: 80, filter: 'blur(6px)', duration: 0.9, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });
    gsap.utils.toArray('.section-head .eyebrow, .section-head p:not(.eyebrow), .booking-text .eyebrow, .lead').forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 18, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // ---------- Treatment cards: wave in, prices count up ----------
    gsap.from('.card', {
      opacity: 0, y: 60, scale: 0.92, rotate: function (i) { return [-2, 1.5, -1.5, 2][i % 4]; },
      duration: 0.9, ease: 'back.out(1.4)', stagger: 0.1,
      scrollTrigger: { trigger: '.cards', start: 'top 80%' }
    });
    gsap.utils.toArray('.amount').forEach(function (el) {
      var end = parseInt(el.textContent.replace(/\D/g, ''), 10);
      var obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: function () { el.textContent = '$' + Math.round(obj.v); }
      });
    });
    gsap.from('.checklist li', {
      opacity: 0, x: -12, duration: 0.5, ease: 'power2.out', stagger: 0.04,
      scrollTrigger: { trigger: '.cards', start: 'top 70%' }
    });

    // ---------- Why choose us: icons pop, cards float up ----------
    gsap.from('.feature', {
      opacity: 0, y: 50, duration: 1, ease: 'expo.out', stagger: 0.14,
      scrollTrigger: { trigger: '.features', start: 'top 80%' }
    });
    gsap.from('.feature-icon', {
      scale: 0, rotate: -30, duration: 0.9, ease: 'back.out(2)', stagger: 0.14,
      scrollTrigger: { trigger: '.features', start: 'top 75%' }
    });
    // Icons keep a slow, gentle bob so the section feels alive
    gsap.to('.feature-icon', { y: -6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.4 } });

    // ---------- Reviews: cards slide in from the right ----------
    gsap.from('.t-card', {
      opacity: 0, x: 80, rotate: 3, duration: 1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '#t-track', start: 'top 82%' }
    });

    // ---------- FAQ: items cascade ----------
    gsap.from('.faq-item', {
      opacity: 0, y: 30, duration: 0.8, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.faq', start: 'top 82%' }
    });

    // ---------- Booking: two halves glide together ----------
    gsap.from('.assurances > div', {
      opacity: 0, x: -40, duration: 0.9, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.assurances', start: 'top 85%' }
    });
    gsap.from('.booking-form', {
      opacity: 0, y: 60, scale: 0.96, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.booking-form', start: 'top 85%' }
    });

    // ---------- Footer fades up ----------
    gsap.from('.footer-grid > div', {
      opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.site-footer', start: 'top 90%' }
    });

    // ---------- Buttons: soft magnetic pull on desktop ----------
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.hero-actions .btn, .nav-links .btn').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.25);
          yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
      });
    }

    // Opened FAQ/review panels change page height: keep scroll triggers in sync
    document.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'grid-template-rows') ScrollTrigger.refresh();
    });

    return function () {
      if (lenis) lenis.destroy();
      document.documentElement.classList.remove('motion');
    };
  });
})();
