// New Dimension - Shared JavaScript (No frameworks)
// Features: Mobile menu, Slideshow, Marquee, Tabs, Form validation

(function () {
  function qs(selector, scope) { return (scope || document).querySelector(selector); }
  function qsa(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  // Mobile Menu Toggle
  var hamburger = qs('[data-nav-toggle]');
  var navLinks = qs('[data-nav]');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on link click (mobile)
    qsa('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Slideshow (fading)
  function initSlideshows() {
    qsa('[data-slideshow]')
      .forEach(function (host) {
        var slides = qsa('.slide', host);
        if (!slides.length) return;
        var idx = 0;
        slides[0].classList.add('active');
        setInterval(function () {
          slides[idx].classList.remove('active');
          idx = (idx + 1) % slides.length;
          slides[idx].classList.add('active');
        }, 3500);
      });
  }

  // Marquee (infinite scroll of text)
  function initMarquees() {
    qsa('[data-marquee]').forEach(function (host) {
      var track = qs('.marquee-track', host);
      if (!track) return;
      // Duplicate content multiple times to ensure seamless loop with logos
      var original = track.innerHTML;
      track.innerHTML = original + original + original; // 3x
      var speed = Number(host.getAttribute('data-speed')) || 50; // px/s
      var pos = 0;
      var paused = false;
      // Pause on hover, focus, or touch
      host.addEventListener('mouseenter', function () { paused = true; });
      host.addEventListener('mouseleave', function () { paused = false; });
      host.addEventListener('focusin', function () { paused = true; });
      host.addEventListener('focusout', function () { paused = false; });
      host.addEventListener('touchstart', function () { paused = true; }, { passive: true });
      host.addEventListener('touchend', function () { paused = false; });
      function step(ts) {
        if (!paused) {
          pos -= speed / 60; // approx 60fps
          // Reset when scrolled past one third (since we tripled)
          var segmentWidth = track.scrollWidth / 3;
          if (-pos >= segmentWidth) pos = 0;
          track.style.transform = 'translateX(' + pos + 'px)';
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // Tabs (Projects)
  function initTabs() {
    qsa('[data-tabs]').forEach(function (tabs) {
      var tabList = qs('[role="tablist"]', tabs);
      var buttons = qsa('[role="tab"]', tabList);
      var panels = qsa('[role="tabpanel"]', tabs);
      function selectTab(id) {
        buttons.forEach(function (b) {
          var selected = b.getAttribute('aria-controls') === id;
          b.setAttribute('aria-selected', String(selected));
          b.tabIndex = selected ? 0 : -1;
        });
        panels.forEach(function (p) {
          p.hidden = p.id !== id;
        });
      }
      buttons.forEach(function (b, i) {
        b.addEventListener('click', function () { selectTab(b.getAttribute('aria-controls')); });
        b.addEventListener('keydown', function (e) {
          var current = buttons.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; });
          if (e.key === 'ArrowRight') { buttons[(current + 1) % buttons.length].focus(); }
          if (e.key === 'ArrowLeft') { buttons[(current - 1 + buttons.length) % buttons.length].focus(); }
        });
        if (i === 0) selectTab(b.getAttribute('aria-controls'));
      });
    });
  }

  // Contact Form Validation (client-side only)
  function initForms() {
    qsa('form[data-validate]')
      .forEach(function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var required = qsa('[data-required]', form);
          var valid = true;
          required.forEach(function (el) {
            var value = (el.value || '').trim();
            if (!value) { valid = false; el.setAttribute('aria-invalid', 'true'); }
            else { el.removeAttribute('aria-invalid'); }
          });
          var email = qs('input[type="email"]', form);
          if (email) {
            var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
            if (!ok) { valid = false; email.setAttribute('aria-invalid', 'true'); }
          }
          if (!valid) {
            alert('Please fill in all required fields correctly.');
            return;
          }
          alert('Thank you! Your message has been submitted.');
          form.reset();
        });
      });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else { onReady(); }

  function onReady() {
    initSlideshows();
    initMarquees();
    initTabs();
    initForms();
  }
})();


