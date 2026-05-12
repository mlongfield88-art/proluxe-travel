/* ============================================================
   ProLuxe Travel — GSAP + Lenis Animation System
   Smooth scroll, parallax, staggered reveals, split text
   ============================================================ */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================
     LENIS SMOOTH SCROLL
     ========================================================== */
  let lenis;
  if (!reducedMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ==========================================================
     GSAP + SCROLLTRIGGER SETUP
     ========================================================== */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- HERO ENTRANCE ---------- */
    var heroTl = gsap.timeline({ delay: 0.3 });

    if (!reducedMotion) {
      // Parallax zoom on hero background
      gsap.to('.hero__bg', {
        scale: 1.18,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      });

      // Hero content fade out on scroll
      gsap.to('.hero__content', {
        opacity: 0,
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: '60% top',
          end: 'bottom top',
          scrub: true,
        }
      });

      // Staggered hero entrance
      heroTl
        .fromTo('.hero__eyebrow',
          { opacity: 0, y: 30 },
          { opacity: 0.7, y: 0, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo('.hero__title',
          { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' },
          { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'power4.out' },
          '-=0.5'
        )
        .fromTo('.hero__subtitle',
          { opacity: 0, y: 25 },
          { opacity: 0.8, y: 0, duration: 0.8, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo('.hero__cta .btn',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo('.hero__scroll-hint',
          { opacity: 0 },
          { opacity: 1, duration: 1, ease: 'power2.out' },
          '-=0.2'
        );

      /* ---------- SECTION REVEALS ---------- */

      // About section — text slides in from left, image from right
      gsap.fromTo('#about .split__text .section__eyebrow',
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 75%' }
        }
      );
      gsap.fromTo('#about .split__text .section__title',
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 75%' },
          delay: 0.1
        }
      );
      gsap.fromTo('#about .split__text .section__body',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 70%' },
          delay: 0.2
        }
      );
      gsap.fromTo('#about .link-arrow',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 65%' }
        }
      );
      gsap.fromTo('#about .split__image',
        { opacity: 0, x: 60, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 70%' }
        }
      );

      // About image parallax
      gsap.to('#about .split__image img', {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: '#about',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });

      /* ---------- SERVICES CARDS ---------- */
      gsap.fromTo('#services .section__eyebrow',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '#services', start: 'top 75%' }
        }
      );
      gsap.fromTo('#services .section__title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '#services', start: 'top 75%' },
          delay: 0.08
        }
      );
      gsap.fromTo('#services .section__intro',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '#services', start: 'top 70%' },
          delay: 0.15
        }
      );

      // Service pillars — text fades up, image fades in
      document.querySelectorAll('.service-pillar').forEach(function (pillar) {
        gsap.fromTo(pillar.querySelector('.service-pillar__text'),
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: pillar, start: 'top 75%' }
          }
        );
        gsap.fromTo(pillar.querySelector('.service-pillar__image'),
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: pillar, start: 'top 75%' },
            delay: 0.1
          }
        );
        // Subtle image parallax
        var img = pillar.querySelector('.service-pillar__image img');
        if (img) {
          gsap.fromTo(img,
            { y: -16 },
            { y: 16, ease: 'none',
              scrollTrigger: { trigger: pillar, start: 'top bottom', end: 'bottom top', scrub: true }
            }
          );
        }
      });

      /* ---------- APPROACH PILLARS ---------- */
      gsap.fromTo('#approach .section__eyebrow',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '#approach', start: 'top 75%' }
        }
      );
      gsap.fromTo('#approach .section__title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '#approach', start: 'top 75%' },
          delay: 0.08
        }
      );

      gsap.fromTo('.pillar',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.pillars',
            start: 'top 80%',
          }
        }
      );

      /* ---------- CONTACT SECTION ---------- */
      gsap.fromTo('#contact .section__eyebrow',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '#contact', start: 'top 75%' }
        }
      );
      gsap.fromTo('#contact .section__title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '#contact', start: 'top 75%' },
          delay: 0.08
        }
      );
      gsap.fromTo('#contact .section__body',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '#contact', start: 'top 70%' },
          delay: 0.15
        }
      );
      gsap.fromTo('.info-block',
        { opacity: 0, x: 30 },
        {
          opacity: 1, x: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.split__info', start: 'top 80%' }
        }
      );

      /* ---------- FOOTER ---------- */
      gsap.fromTo('.footer__inner > *',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.footer', start: 'top 90%' }
        }
      );

    } // end !reducedMotion

  } else {
    /* Fallback: CSS class-based reveals if GSAP didn't load */
    if (reducedMotion) {
      document.querySelectorAll('.reveal, .reveal-hero, .reveal-pillar').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  /* ==========================================================
     NAV SCROLL (always active regardless of GSAP)
     ========================================================== */
  var header = document.querySelector('.header');

  function onScroll() {
    if (window.scrollY > 60) {
      header.classList.add('nav--scrolled');
    } else {
      header.classList.remove('nav--scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     OFF-CANVAS NAV
     ========================================================== */
  var offcanvas = document.getElementById('offcanvas');
  var navToggle = document.getElementById('navToggle');
  var offcanvasClose = document.getElementById('offcanvasClose');
  var offcanvasOverlay = document.getElementById('offcanvasOverlay');
  var offcanvasLinks = offcanvas ? offcanvas.querySelectorAll('.offcanvas__link') : [];

  function openNav() {
    offcanvas.classList.add('is-open');
    offcanvas.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeNav() {
    offcanvas.classList.remove('is-open');
    offcanvas.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  if (navToggle) navToggle.addEventListener('click', openNav);
  if (offcanvasClose) offcanvasClose.addEventListener('click', closeNav);
  if (offcanvasOverlay) offcanvasOverlay.addEventListener('click', closeNav);
  offcanvasLinks.forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && offcanvas.classList.contains('is-open')) {
      closeNav();
    }
  });

  /* ==========================================================
     SMOOTH SCROLL FOR ANCHOR LINKS (use Lenis if available)
     ========================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -80, duration: 1.4 });
        } else {
          var top = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      }
    });
  });

  /* ==========================================================
     COOKIE CONSENT
     ========================================================== */
  var cookieBanner = document.getElementById('cookieBanner');
  var cookieAccept = document.getElementById('cookieAccept');
  var cookieDecline = document.getElementById('cookieDecline');

  if (cookieBanner) {
    var consent = localStorage.getItem('proluxe_cookie_consent');

    if (!consent) {
      // Show banner after a short delay
      setTimeout(function () {
        cookieBanner.classList.add('is-visible');
      }, 1500);
    }

    function hideBanner() {
      cookieBanner.classList.remove('is-visible');
    }

    if (cookieAccept) {
      cookieAccept.addEventListener('click', function () {
        localStorage.setItem('proluxe_cookie_consent', 'accepted');
        hideBanner();
      });
    }

    if (cookieDecline) {
      cookieDecline.addEventListener('click', function () {
        localStorage.setItem('proluxe_cookie_consent', 'declined');
        hideBanner();
      });
    }
  }

  /* ==========================================================
     OFF-CANVAS FOCUS TRAP
     ========================================================== */
  if (offcanvas) { // offcanvas declared above at line 326
    offcanvas.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = offcanvas.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

})();
