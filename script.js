// Revive IV Lounge: demo site interactions
(function () {
  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!links.classList.contains('open'));
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // FAQ: keep only one answer open at a time
  var faqItems = document.querySelectorAll('.faq details');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  // Booking form (demo only: validates, nothing is sent)
  var form = document.getElementById('booking-form');
  var success = document.getElementById('form-success');

  function setError(input, message) {
    var field = input.closest('.field');
    field.classList.toggle('invalid', !!message);
    field.querySelector('.error').textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate() {
    var ok = true;
    var name = form.elements.name;
    var phone = form.elements.phone;
    var day = form.elements.day;

    if (name.value.trim().length < 2) { setError(name, 'Please enter your name.'); ok = false; }
    else setError(name, '');

    var digits = phone.value.replace(/\D/g, '');
    if (digits.length < 10) { setError(phone, 'Please enter a 10-digit phone number.'); ok = false; }
    else setError(phone, '');

    if (!day.value) { setError(day, 'Please pick a day.'); ok = false; }
    else setError(day, '');

    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstBad = form.querySelector('.invalid input, .invalid select');
      if (firstBad) firstBad.focus();
      return;
    }
    var first = form.elements.name.value.trim().split(' ')[0];
    success.textContent = 'Thanks, ' + first + '! In a live site we would call you to confirm your ' +
      form.elements.day.value + ' visit. (Demo only: nothing was sent.)';
    success.hidden = false;
    form.reset();
  });

  form.addEventListener('input', function (e) {
    if (e.target.closest('.field.invalid')) setError(e.target, '');
  });

  // Sticky mobile button: hidden while the hero button or booking form is on screen
  var cta = document.querySelector('.mobile-cta');
  var heroBtn = document.querySelector('.hero .btn');
  var booking = document.getElementById('book');
  cta.classList.add('hidden');
  if ('IntersectionObserver' in window) {
    var onScreen = new Set();
    var ctaWatcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      });
      cta.classList.toggle('hidden', onScreen.size > 0);
    }, { threshold: 0 });
    ctaWatcher.observe(heroBtn);
    ctaWatcher.observe(booking);

    // Gentle fade-in as sections scroll into view
    var revealEls = document.querySelectorAll('.card, .feature, .review, .faq details, .booking-form');
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) {
      el.classList.add('reveal');
      revealer.observe(el);
    });
  }

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
})();
