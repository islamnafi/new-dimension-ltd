// New Dimension - Shared JavaScript (No frameworks)
// Features: Mobile menu, Slideshow, Marquee, Tabs, Form validation

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initNavToggle();
    initSlideshows();
    initMarquees();
    initTabs();
    initFormValidation();
    initBackToTop();
  });

  function initNavToggle() {
    const btn = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if (!btn || !nav) return;

    const navLinks = Array.from(nav.querySelectorAll('a'));
    const mq = window.matchMedia('(min-width: 901px)');

    btn.setAttribute('aria-expanded', 'false');

    const closeNav = () => {
      if (!nav.classList.contains('open')) return;
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };

    const openNav = () => {
      if (nav.classList.contains('open')) return;
      nav.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    };

    btn.addEventListener('click', () => {
      if (nav.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeNav();
      });
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('open')) return;
      if (event.target === btn || btn.contains(event.target)) return;
      if (nav.contains(event.target)) return;
      closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        btn.focus();
      }
    });

    const handleMediaChange = (event) => {
      if (event.matches) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleMediaChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handleMediaChange);
    }
  }

  function initSlideshows() {
    document.querySelectorAll('[data-slideshow]').forEach((root) => {
      if (root.dataset.slideshowInit === '1') return;
      root.dataset.slideshowInit = '1';

      const slides = Array.from(root.querySelectorAll('.slide'));
      if (slides.length < 2) return;

      const ACTIVE = 'active';
      let index = Math.max(0, slides.findIndex(s => s.classList.contains(ACTIVE)));
      if (index < 0) index = 0;

      const intervalMs = parseInt(root.getAttribute('data-interval') || '5000', 10);
      let timer = null;

      function show(n) {
        slides[index]?.classList.remove(ACTIVE);
        index = (n + slides.length) % slides.length;
        slides[index]?.classList.add(ACTIVE);
      }

      function next() { show(index + 1); }
      function prev() { show(index - 1); }

      function start() {
        if (timer) return;
        timer = setInterval(next, intervalMs);
      }

      function stop() {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
      }

      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      root.querySelector('.slide-next')?.addEventListener('click', () => { stop(); next(); });
      root.querySelector('.slide-prev')?.addEventListener('click', () => { stop(); prev(); });

      // Ensure one active at start
      slides.forEach((s, i) => s.classList.toggle(ACTIVE, i === index));
      start();
    });
  }

  function initMarquees() {
    document.querySelectorAll('[data-marquee]').forEach((container) => {
      if (container.dataset.marqueeInit === '1') return;
      container.dataset.marqueeInit = '1';

      const speed = parseFloat(container.getAttribute('data-speed') || '60'); // px/s
      const track = container.querySelector('.marquee-track') || container.firstElementChild;
      if (!track) return;

      // Duplicate content for seamless loop
      const segmentHTML = track.innerHTML;
      track.innerHTML = segmentHTML + segmentHTML;

      // Wait for images (so widths are correct)
      const imgs = Array.from(track.querySelectorAll('img'));
      let loaded = 0;
      const done = () => startScroll(container, track, speed);

      if (imgs.length === 0) {
        done();
      } else {
        const mark = () => { loaded++; if (loaded === imgs.length) done(); };
        imgs.forEach(img => {
          if (img.complete) return mark();
          img.addEventListener('load', mark, { once: true });
          img.addEventListener('error', mark, { once: true });
        });
      }
    });

    function startScroll(container, track, speed) {
      let children = Array.from(track.children);
      if (children.length === 0) return;

      // Width of the original (first) segment = half of duplicated track width
      // Using scrollWidth accounts for flex gap spacing so we avoid a jump.
      const half = Math.floor(children.length / 2);
      let segmentWidth = track.scrollWidth / 2;
      if (segmentWidth <= 0) {
        // Fallback: sum child widths including gap approximation
        segmentWidth = 0;
        for (let i = 0; i < half; i++) {
          segmentWidth += children[i].getBoundingClientRect().width;
        }
      }

      let x = 0;
      let last = performance.now();
      let paused = false;
      let rafId = 0;

      const frame = (now) => {
        const dt = (now - last) / 1000;
        last = now;

        if (!paused) {
          x -= speed * dt;
          if (-x >= segmentWidth) x += segmentWidth;
          track.style.transform = `translateX(${x}px)`;
        }
        rafId = requestAnimationFrame(frame);
      };

      container.addEventListener('mouseenter', () => { paused = true; });
      container.addEventListener('mouseleave', () => { paused = false; });

      window.addEventListener('resize', () => {
        // Recompute segment width on resize using scrollWidth to include gaps
        segmentWidth = track.scrollWidth / 2;
        if (segmentWidth <= 0) {
          children = Array.from(track.children);
          let w = 0;
            for (let i = 0; i < half; i++) {
              w += children[i].getBoundingClientRect().width;
            }
          segmentWidth = w || 1; // avoid zero
        }
      });

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(frame);
    }
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach((tabsRoot) => {
      if (tabsRoot.dataset.tabsInit === '1') return;
      tabsRoot.dataset.tabsInit = '1';

      const tabButtons = Array.from(tabsRoot.querySelectorAll('[role="tab"]'));
      const panels = Array.from(tabsRoot.querySelectorAll('[role="tabpanel"]'));
      if (!tabButtons.length || !panels.length) return;

      function activateTab(btn, setFocus = true) {
        const targetId = btn.getAttribute('aria-controls');
        tabButtons.forEach(b => {
          const selected = b === btn;
          b.setAttribute('aria-selected', String(selected));
          b.classList.toggle('active', selected);
          b.tabIndex = selected ? 0 : -1;
        });
        panels.forEach(p => {
          const show = p.id === targetId;
          if (show) {
            p.removeAttribute('hidden');
          } else {
            p.setAttribute('hidden', '');
          }
        });
        if (setFocus) btn.focus();
      }

      // Initialize: find already visible panel else first
      let initialBtn = tabButtons.find(b => {
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        return panel && !panel.hasAttribute('hidden');
      }) || tabButtons[0];
      activateTab(initialBtn, false);

      tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          activateTab(btn);
        });
        btn.addEventListener('keydown', (e) => {
          const i = tabButtons.indexOf(btn);
          let newIndex = i;
          switch (e.key) {
            case 'ArrowRight':
            case 'Right':
              newIndex = (i + 1) % tabButtons.length; break;
            case 'ArrowLeft':
            case 'Left':
              newIndex = (i - 1 + tabButtons.length) % tabButtons.length; break;
            case 'Home': newIndex = 0; break;
            case 'End': newIndex = tabButtons.length - 1; break;
            default: return;
          }
          e.preventDefault();
          activateTab(tabButtons[newIndex]);
        });
      });
    });
  }
  
  function initFormValidation() {
    document.querySelectorAll('[data-validate]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        const requiredFields = form.querySelectorAll('[data-required]');
        
        requiredFields.forEach((field) => {
          const value = field.value.trim();
          const fieldWrapper = field.closest('.field');
          
          // Remove existing error
          const existingError = fieldWrapper?.querySelector('.field-error');
          if (existingError) existingError.remove();
          field.classList.remove('error');
          
          // Validate
          if (!value) {
            isValid = false;
            field.classList.add('error');
            if (fieldWrapper) {
              const error = document.createElement('span');
              error.className = 'field-error';
              error.textContent = 'This field is required';
              error.setAttribute('role', 'alert');
              fieldWrapper.appendChild(error);
            }
          } else if (field.type === 'email' && !isValidEmail(value)) {
            isValid = false;
            field.classList.add('error');
            if (fieldWrapper) {
              const error = document.createElement('span');
              error.className = 'field-error';
              error.textContent = 'Please enter a valid email address';
              error.setAttribute('role', 'alert');
              fieldWrapper.appendChild(error);
            }
          }
        });
        
        if (isValid) {
          // Show success message
          const success = document.createElement('div');
          success.className = 'form-success';
          success.innerHTML = '<strong>Thank you!</strong> Your message has been received. We\'ll get back to you soon.';
          success.setAttribute('role', 'alert');
          form.insertAdjacentElement('beforebegin', success);
          
          // Reset form
          form.reset();
          
          // Remove success message after 5 seconds
          setTimeout(() => success.remove(), 5000);
        } else {
          // Focus first error field
          const firstError = form.querySelector('.error');
          if (firstError) firstError.focus();
        }
      });
    });
  }
  
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
    
    // Scroll to top when clicked
    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
})();


