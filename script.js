// Revive IV Lounge: demo site interactions (vanilla JS, no dependencies)
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mobile menu ----------
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });

  // ---------- Illustrated avatars (ported from the 21st.dev testimonial component) ----------
  var SKIN = ['#f4d9c0', '#e8b894', '#cf9367', '#a2673f', '#79482a'];
  var HAIR = ['#2b2622', '#6b4423', '#a8552c', '#d9a441', '#5c5c5c', '#171717'];
  var SHIRT = ['#2A9D8F', '#1D3557', '#e1a35b', '#df6072', '#5b7fd1', '#3f9fb3'];
  var BACKDROP = ['#ffffff', '#f7f4ee', '#eef7f5', '#f4f1f8'];
  var HAIRS = [
    '<path d="M27 44c0-14 10-22 23-22s23 8 23 22c0-6-8-9-23-9s-23 3-23 9Z" fill="H"/>',
    '<g fill="H"><circle cx="34" cy="28" r="9"/><circle cx="50" cy="23" r="10"/><circle cx="66" cy="28" r="9"/><circle cx="28" cy="40" r="7"/><circle cx="72" cy="40" r="7"/></g>',
    '<path d="M26 46c0-16 11-24 24-24s24 8 24 24v30c0 4-4 6-7 4 2-14 1-24-1-30-4 4-11 6-16 6s-12-2-16-6c-2 6-3 16-1 30-3 2-7 0-7-4V46Z" fill="H"/>',
    '<g fill="H"><circle cx="50" cy="15" r="8"/><path d="M27 44c0-14 10-22 23-22s23 8 23 22c0-7-9-11-23-11s-23 4-23 11Z"/></g>',
    '<path d="M26 47c0-15 11-25 24-25s24 10 24 25c-2-9-9-14-18-14-6 0-10 2-16 6-5 3-10 5-14 8Z" fill="H"/>',
    '<path d="M26 47c0-16 11-25 24-25s24 9 24 25v12c0 3-4 4-6 2 1-8 1-14 0-18-5 4-11 6-18 6s-13-2-18-6c-1 4-1 10 0 18-2 2-6 1-6-2V47Z" fill="H"/>'
  ];
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }
  function avatarSvg(seed) {
    var h = hash(seed);
    var skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length];
    var shirt = SHIRT[(h >> 6) % SHIRT.length], bg = BACKDROP[(h >> 9) % BACKDROP.length];
    var hairPath = HAIRS[(h >> 12) % HAIRS.length].replace('H', hair);
    return '<svg viewBox="0 0 100 106" aria-hidden="true">' +
      '<rect width="100" height="106" fill="' + bg + '"/>' +
      '<path d="M12 106c0-23 17-34 38-34s38 11 38 34Z" fill="' + shirt + '"/>' +
      '<path d="M42 60h16v14a8 8 0 0 1-16 0Z" fill="' + skin + '" opacity=".85"/>' +
      '<circle cx="27" cy="47" r="4.5" fill="' + skin + '"/><circle cx="73" cy="47" r="4.5" fill="' + skin + '"/>' +
      '<ellipse cx="50" cy="45" rx="22" ry="24.5" fill="' + skin + '"/>' + hairPath +
      '<ellipse cx="42" cy="46" rx="1.9" ry="2.4" fill="#2b2622"/><ellipse cx="58" cy="46" rx="1.9" ry="2.4" fill="#2b2622"/>' +
      '<path d="M44 54c2 2.4 10 2.4 12 0" stroke="#2b2622" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".8"/>' +
      '</svg>';
  }

  // ---------- Testimonial cards: one open at a time, scroll track with edge fades ----------
  var track = document.getElementById('t-track');
  var cards = track.querySelectorAll('.t-card');
  var prev = document.getElementById('t-prev');
  var next = document.getElementById('t-next');

  cards.forEach(function (card) {
    card.querySelector('.t-avatar').innerHTML = avatarSvg(card.dataset.name);
    var btn = card.querySelector('.t-toggle');
    if (btn.getAttribute('aria-expanded') === 'true') card.classList.add('open');
    btn.addEventListener('click', function () {
      var willOpen = !card.classList.contains('open');
      cards.forEach(function (c) { setCard(c, false); });
      setCard(card, willOpen);
      // Bring a partly hidden card fully into view
      var left = card.offsetLeft - track.offsetLeft;
      if (left < track.scrollLeft || left + card.offsetWidth > track.scrollLeft + track.clientWidth) {
        track.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });
  function setCard(card, open) {
    var btn = card.querySelector('.t-toggle');
    var first = card.dataset.name.split(' ')[0];
    card.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', (open ? 'Hide ' : 'Read ') + first + "'s review");
  }
  function syncEdges() {
    var atStart = track.scrollLeft < 8;
    var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    track.classList.toggle('fade-left', !atStart);
    track.classList.toggle('fade-right', !atEnd);
    prev.disabled = atStart;
    next.disabled = atEnd;
    document.querySelector('.t-nav').classList.toggle('hidden', atStart && atEnd);
  }
  function scrollByCard(dir) {
    var step = cards[0].offsetWidth + 14;
    track.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { scrollByCard(-1); });
  next.addEventListener('click', function () { scrollByCard(1); });
  track.addEventListener('scroll', syncEdges, { passive: true });
  track.addEventListener('keydown', function (e) {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCard(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCard(-1); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(syncEdges).observe(track);
  syncEdges();

  // ---------- FAQ: smooth accordion, one open at a time ----------
  var faqButtons = document.querySelectorAll('.faq-q');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var willOpen = !item.classList.contains('open');
      faqButtons.forEach(function (b) {
        b.closest('.faq-item').classList.remove('open');
        b.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  // ---------- Treatment buttons pre-fill the booking form ----------
  var form = document.getElementById('booking-form');
  document.querySelectorAll('[data-treatment]').forEach(function (a) {
    a.addEventListener('click', function () { form.elements.treatment.value = a.dataset.treatment; });
  });

  // ---------- Booking form (demo only: validates, nothing is sent) ----------
  var success = document.getElementById('form-success');
  function setError(field, message) {
    field.classList.toggle('invalid', !!message);
    field.querySelector('.error').textContent = message || '';
    field.querySelectorAll('input').forEach(function (i) {
      if (i.type !== 'radio') i.setAttribute('aria-invalid', message ? 'true' : 'false');
    });
  }
  function validate() {
    var ok = true;
    var name = form.elements.name, phone = form.elements.phone;
    var dayField = form.querySelector('.day-chips').closest('.field');

    if (name.value.trim().length < 2) { setError(name.closest('.field'), 'Please enter your name.'); ok = false; }
    else setError(name.closest('.field'), '');

    if (phone.value.replace(/\D/g, '').length < 10) { setError(phone.closest('.field'), 'Please enter a 10-digit phone number.'); ok = false; }
    else setError(phone.closest('.field'), '');

    if (!form.querySelector('input[name="day"]:checked')) { setError(dayField, 'Please pick a day.'); ok = false; }
    else setError(dayField, '');

    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    success.hidden = true;
    if (!validate()) {
      var bad = form.querySelector('.invalid input');
      if (bad) bad.focus();
      return;
    }
    var first = form.elements.name.value.trim().split(' ')[0];
    var day = form.querySelector('input[name="day"]:checked').value;
    success.textContent = 'Thanks, ' + first + '! On a live site we would call you to confirm your ' + day +
      ' visit. (Demo only: nothing was sent.)';
    success.hidden = false;
    form.reset();
  });
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field.invalid');
    if (f) setError(f, '');
  });
  form.addEventListener('change', function (e) {
    var f = e.target.closest('.field.invalid');
    if (f) setError(f, '');
  });

  // ---------- Sticky mobile CTA: hidden while hero button or booking is on screen ----------
  var cta = document.querySelector('.mobile-cta');
  if ('IntersectionObserver' in window) {
    var onScreen = new Set();
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? onScreen.add(en.target) : onScreen.delete(en.target); });
      cta.classList.toggle('hidden', onScreen.size > 0);
    });
    watcher.observe(document.querySelector('.hero-actions'));
    watcher.observe(document.getElementById('book'));

    // Gentle staggered fade-in
    if (!reduceMotion) {
      var revealer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('visible'); revealer.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.cards, .features, .t-track, .faq').forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (el, i) {
          el.classList.add('reveal');
          el.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
          revealer.observe(el);
        });
      });
      var bookingForm = document.querySelector('.booking-form');
      bookingForm.classList.add('reveal');
      revealer.observe(bookingForm);
    }
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
