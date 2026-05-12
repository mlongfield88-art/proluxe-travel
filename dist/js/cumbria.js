/**
 * cumbria.js
 * Scroll-driven journey through Cumbria — horizontal pin on desktop,
 * vertical timeline on mobile (<=900px). Respects prefers-reduced-motion.
 *
 * Dependencies (already in dist/lib/):
 *   gsap.min.js
 *   ScrollTrigger.min.js
 *   lenis.min.js
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 0. Utilities                                                         */
  /* ------------------------------------------------------------------ */

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = function () { return window.innerWidth <= 900; };

  /* ------------------------------------------------------------------ */
  /* 1. Lenis smooth scroll on its own rAF loop                          */
  /*    Group standing rule: never connect Lenis to gsap.ticker          */
  /*    (causes ticker freeze on HMR reload).                            */
  /* ------------------------------------------------------------------ */

  var lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

  function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  }
  requestAnimationFrame(lenisRaf);

  /* ------------------------------------------------------------------ */
  /* 2. Route path animation helper                                      */
  /*    Drives stroke-dashoffset on a path whose total length is cached  */
  /* ------------------------------------------------------------------ */

  function animateRoute(pathEl, trigger, scrubValue) {
    if (!pathEl) return;
    var length = pathEl.getTotalLength();
    gsap.set(pathEl, { strokeDasharray: length, strokeDashoffset: length });

    ScrollTrigger.create({
      trigger: trigger,
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: scrubValue || 1.2,
      onUpdate: function (self) {
        gsap.set(pathEl, { strokeDashoffset: length * (1 - self.progress) });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. Waypoint pulse animation (olive dot throb on arrival)            */
  /* ------------------------------------------------------------------ */

  function pulseMarker(dotEl) {
    if (!dotEl || prefersReduced) return;
    gsap.fromTo(dotEl,
      { scale: 0.6, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.7)',
        onComplete: function () {
          gsap.to(dotEl, {
            scale: 1.18, duration: 0.9, ease: 'sine.inOut',
            yoyo: true, repeat: -1
          });
        }
      }
    );
  }

  /* ------------------------------------------------------------------ */
  /* 4. Desktop: horizontal scroll-pin journey                           */
  /* ------------------------------------------------------------------ */

  function initDesktop() {
    var track = document.querySelector('.journey__track');
    var section = document.querySelector('.journey');
    var panels = gsap.utils.toArray('.journey__panel');
    var routePathDesktop = document.querySelector('#journey-route-desktop');
    var markers = gsap.utils.toArray('.journey-marker');

    if (!track || !panels.length) return;

    /* Total horizontal distance to travel */
    var totalWidth = function () {
      return track.scrollWidth - window.innerWidth;
    };

    /* Pin the section and drive translateX */
    /* GSAP pin retained: horizontal-translate scroll, not card-stack; CSS sticky cannot drive horizontal pan from vertical scroll. */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: 'top top',
        end: function () { return '+=' + (totalWidth() * 1.15); },
        scrub: 1.4,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          /* Route draws as horizontal scroll progresses */
          if (routePathDesktop) {
            var len = routePathDesktop.getTotalLength();
            gsap.set(routePathDesktop, {
              strokeDashoffset: len * (1 - self.progress)
            });
          }
        }
      }
    });

    tl.to(track, {
      x: function () { return -totalWidth(); },
      ease: 'none',
      duration: 1
    }, 0);

    /* Route init */
    if (routePathDesktop) {
      var len = routePathDesktop.getTotalLength();
      gsap.set(routePathDesktop, { strokeDasharray: len, strokeDashoffset: len });
    }

    /* Waypoint panels: fade + lift as the scroll reaches each one */
    panels.forEach(function (panel, i) {
      var photo = panel.querySelector('.journey__photo');
      var text = panel.querySelector('.journey__text');
      var marker = markers[i] || null;

      /* Entry animation tied to percentage progress through the track */
      var startPct = i === 0 ? 0 : (i / panels.length) - 0.04;
      var endPct = startPct + 0.14;

      tl.fromTo(
        [photo, text],
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out', stagger: 0.06 },
        startPct
      );

      /* Marker pulse at the same moment */
      if (marker && !prefersReduced) {
        tl.add(function () { pulseMarker(marker); }, startPct);
      }
    });

    /* Closing frame fades in at the very end */
    var closeFrame = document.querySelector('.journey__close');
    if (closeFrame) {
      tl.fromTo(closeFrame,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' },
        0.88
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* 5. Mobile: vertical timeline with drawing route                     */
  /* ------------------------------------------------------------------ */

  function initMobile() {
    var routePathMobile = document.querySelector('#journey-route-mobile');
    var section = document.querySelector('.journey');
    var cards = gsap.utils.toArray('.journey__card');

    /* Draw the vertical route as user scrolls down */
    if (routePathMobile) {
      var len = routePathMobile.getTotalLength();
      gsap.set(routePathMobile, { strokeDasharray: len, strokeDashoffset: len });

      ScrollTrigger.create({
        trigger: section,
        start: 'top 90%',
        end: 'bottom 10%',
        scrub: 1.4,
        onUpdate: function (self) {
          gsap.set(routePathMobile, { strokeDashoffset: len * (1 - self.progress) });
        }
      });
    }

    /* Cards fade in on scroll */
    if (!prefersReduced) {
      cards.forEach(function (card) {
        gsap.fromTo(card,
          { opacity: 0, y: 32 },
          {
            opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 82%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    }

    /* Closing frame */
    var closeFrame = document.querySelector('.journey__close');
    if (closeFrame && !prefersReduced) {
      gsap.fromTo(closeFrame,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: {
            trigger: closeFrame,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* 6. Reduced-motion fallback: simple reveal, no pin or translate      */
  /* ------------------------------------------------------------------ */

  function initReducedMotion() {
    var items = gsap.utils.toArray('.journey__panel, .journey__card, .journey__close');
    items.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    var paths = document.querySelectorAll('#journey-route-desktop, #journey-route-mobile');
    paths.forEach(function (p) {
      p.style.strokeDasharray = 'none';
      p.style.strokeDashoffset = '0';
    });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Interactive Cumbria Map                                          */
  /* Moved to cumbria-map.js (Leaflet implementation).                  */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* 8. Hero parallax (subtle, desktop only)                            */
  /* ------------------------------------------------------------------ */

  function initHeroParallax() {
    if (prefersReduced || isMobile()) return;
    var heroBg = document.querySelector('.cumbria-hero__bg');
    if (!heroBg) return;
    gsap.to(heroBg, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: '.cumbria-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 8. Staggered reveal for sections outside the journey                */
  /* ------------------------------------------------------------------ */

  function initSectionReveals() {
    if (prefersReduced) return;
    var blocks = gsap.utils.toArray('.about-full, .cumbria-food');
    blocks.forEach(function (block) {
      gsap.fromTo(block,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 84%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* 9. Init on DOM ready                                                */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* 9b. Panel reveals: vertical stacked panels, all viewports            */
  /* ------------------------------------------------------------------ */

  function initPanelReveals() {
    var panels = gsap.utils.toArray('.journey__panel');
    var introPanel = document.querySelector('.journey__intro-panel');
    var closeFrame = document.querySelector('.journey__close');

    panels.forEach(function (panel) {
      gsap.fromTo(panel,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.75, ease: 'power2.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 84%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    if (introPanel) {
      gsap.fromTo(introPanel,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: {
            trigger: introPanel,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    if (closeFrame) {
      gsap.fromTo(closeFrame,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: {
            trigger: closeFrame,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    /* Map now handled by cumbria-map.js (Leaflet) */

    if (prefersReduced) {
      initReducedMotion();
      return;
    }

    initHeroParallax();
    initSectionReveals();
    initPanelReveals();

    /* Refresh on resize (debounced) */
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        ScrollTrigger.refresh();
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
