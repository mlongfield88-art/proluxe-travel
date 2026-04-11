/* ============================================================
   ProLuxe Travel — Main JS
   Nav scroll, off-canvas menu, scroll reveals, form handling
   ============================================================ */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- NAV SCROLL ---------- */
  const header = document.querySelector('.header');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    if (y > 60) {
      header.classList.add('nav--scrolled');
    } else {
      header.classList.remove('nav--scrolled');
    }
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- OFF-CANVAS NAV ---------- */
  const offcanvas = document.getElementById('offcanvas');
  const navToggle = document.getElementById('navToggle');
  const offcanvasClose = document.getElementById('offcanvasClose');
  const offcanvasOverlay = document.getElementById('offcanvasOverlay');
  const offcanvasLinks = offcanvas ? offcanvas.querySelectorAll('.offcanvas__link') : [];

  function openNav() {
    offcanvas.classList.add('is-open');
    offcanvas.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    offcanvas.classList.remove('is-open');
    offcanvas.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle) navToggle.addEventListener('click', openNav);
  if (offcanvasClose) offcanvasClose.addEventListener('click', closeNav);
  if (offcanvasOverlay) offcanvasOverlay.addEventListener('click', closeNav);
  offcanvasLinks.forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && offcanvas.classList.contains('is-open')) {
      closeNav();
    }
  });

  /* ---------- SMOOTH SCROLL FOR ANCHOR LINKS ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  if (!reducedMotion) {
    // Hero elements — staggered
    const heroEls = document.querySelectorAll('.reveal-hero');
    heroEls.forEach(function (el, i) {
      el.style.transitionDelay = (i * 0.15) + 's';
    });
    // Trigger hero reveals on load
    requestAnimationFrame(function () {
      setTimeout(function () {
        heroEls.forEach(function (el) {
          el.classList.add('is-visible');
        });
      }, 300);
    });

    // General reveal observer
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });

    // Card reveals — staggered per row
    var cardObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal-card').forEach(function (el, i) {
      el.style.transitionDelay = (i * 0.1) + 's';
      cardObserver.observe(el);
    });

    // Pillar reveals — staggered
    var pillarObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          pillarObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal-pillar').forEach(function (el, i) {
      el.style.transitionDelay = (i * 0.12) + 's';
      pillarObserver.observe(el);
    });
  } else {
    // Reduced motion — just show everything
    document.querySelectorAll('.reveal, .reveal-hero, .reveal-card, .reveal-pillar').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- VIDEO PLAY/PAUSE ON VISIBILITY ---------- */
  var heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.play().catch(function () {});
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.25 });
    videoObserver.observe(heroVideo);
  }

  /* ---------- CONTACT FORM ---------- */
  var form = document.getElementById('contactForm');
  var submitBtn = document.getElementById('formSubmit');

  if (form) {
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action');

      // If Formspree not configured, use mailto fallback
      if (!action || action.indexOf('YOUR_FORM_ID') !== -1) {
        e.preventDefault();
        var name = form.querySelector('#name').value;
        var email = form.querySelector('#email').value;
        var company = form.querySelector('#company').value;
        var message = form.querySelector('#message').value;
        var subject = encodeURIComponent('ProLuxe Travel Enquiry from ' + name);
        var body = encodeURIComponent(
          'Name: ' + name + '\n' +
          'Email: ' + email + '\n' +
          'Company: ' + company + '\n\n' +
          message
        );
        window.location.href = 'mailto:info@proluxetravels.com?subject=' + subject + '&body=' + body;
        return;
      }

      // Formspree handling
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    });
  }

})();
