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
  /* 1. Lenis smooth scroll — integrate with GSAP ticker                 */
  /* ------------------------------------------------------------------ */

  var lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

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

  /* [removed — see dist/js/cumbria-map.js]

  function initCumbriaMap() {
    var stage = document.getElementById('cumbriaMapStage');
    if (!stage) return;

    var card     = document.getElementById('cumbriaMapCard');
    var closeBtn = document.getElementById('cumbriaMapClose');
    var cardPhoto  = document.getElementById('cmapCardPhoto');
    var cardValley = document.getElementById('cmapCardValley');
    var cardTitle  = document.getElementById('cmapCardTitle');
    var cardText1  = document.getElementById('cmapCardText1');
    var cardText2  = document.getElementById('cmapCardText2');
    var cardMeta   = document.getElementById('cmapCardMeta');

    /* ----- Destination data ----- */
    var destinations = [
      {
        id: 1,
        name: 'Askham Hall',
        valley: 'Ullswater Valley, Penrith',
        photo: 'img/cumbria/waypoint-01-askham.jpg',
        photoAlt: 'Askham Hall, a medieval country house in the Ullswater valley, Cumbria',
        body: [
          'A fourteenth-century castle gatehouse, still in Lowther family hands. The kitchen gardens feed Allium straight from the bed, and the dining has the kind of precision that wears its age lightly.',
          'Set east of Ullswater, with the Lowther Estate behind and the lake valley unfolding in front. A proper place to begin a week.'
        ],
        meta: 'One Michelin star \u00b7 Allium at Askham Hall \u00b7 Estate kitchen and garden'
      },
      {
        id: 2,
        name: 'Forest Side',
        valley: 'Grasmere, Central Lakes',
        photo: 'img/cumbria/waypoint-02-grasmere.jpg',
        photoAlt: 'Grasmere lake looking across the still water toward the surrounding fells, Cumbria',
        body: [
          'A Victorian hunting lodge on the edge of Grasmere, fells rising directly behind it, the lake five minutes down the hill. The kitchen is properly serious. Tasting menus built from what is in season on the land and the shoreline right outside.',
          'Small enough to hold a group on its own terms, rather than absorb it into something larger. Quiet in a way you notice after a day or so, and then find difficult to leave.'
        ],
        meta: 'One Michelin star \u00b7 Country-house dining \u00b7 Grasmere valley'
      },
      {
        id: 3,
        name: 'Linthwaite House + Gilpin',
        valley: 'Windermere, Western Shores',
        photo: 'img/cumbria/waypoint-03-windermere.jpg',
        photoAlt: 'Windermere seen from Gummer\'s How fell, with the lake stretching north through the valley',
        body: [
          'Two properties within a few miles of each other on Windermere\'s quieter western flank. Linthwaite sits directly above the lake; the Gilpin and its Lake House sit back, in their own grounds. Three kitchens between them: Henrock, SOURCE, and HRiSHi.',
          'Together, they comfortably hold a larger party without anyone losing sight of the water.'
        ],
        meta: 'Henrock: One Michelin star, Simon Rogan \u00b7 SOURCE and HRiSHi: Michelin-recommended'
      },
      {
        id: 4,
        name: 'Coniston and Heft',
        valley: 'Southern Lakes, High Newton',
        photo: 'img/cumbria/waypoint-04-coniston.jpg',
        photoAlt: 'Coniston Water in the southern Lake District, looking along the length of the lake toward the Old Man of Coniston',
        body: [
          'Coniston Water sits south of the central fells, wider and quieter than its neighbours, with less of a crowd. The village inn at High Newton nearby wears its Michelin star as lightly as anywhere in the country. Regional produce, cooked without ceremony.',
          'The southern lakes give you the landscape without the Windermere footfall. Quieter in register, and often the right answer for a smaller group.'
        ],
        meta: 'Heft: One Michelin star \u00b7 Village inn \u00b7 Regional produce'
      },
      {
        id: 5,
        name: 'L\'Enclume',
        valley: 'Cartmel, Southern Cumbria',
        photo: 'img/cumbria/waypoint-05-cartmel.jpg',
        photoAlt: 'Cartmel village square, the historic market square that L\'Enclume\'s dining rooms open onto, southern Cumbria',
        body: [
          'Simon Rogan\'s flagship. Three Michelin stars, inside a twelfth-century smithy in Cartmel village. The kitchen runs straight from the farm, and anything on the plate can be walked to in under an hour.',
          'A private dinner here is the kind of evening a Cumbrian week quietly builds towards. Getting the room is the hard part. That side we look after for you.'
        ],
        meta: 'Three Michelin stars \u00b7 Simon Rogan flagship \u00b7 Farm-to-table, Cartmel'
      }
    ];

    var activeId = null;
    var cardAnim = null; /* current GSAP tween */
    var isMobileCard = function () { return window.innerWidth <= 900; };

    /* ----- Populate card with destination data ----- */
    function populateCard(dest) {
      cardPhoto.src      = dest.photo;
      cardPhoto.alt      = dest.photoAlt;
      cardValley.textContent = dest.valley;
      cardTitle.textContent  = dest.name;
      cardText1.textContent  = dest.body[0];
      cardText2.textContent  = dest.body[1];
      cardMeta.textContent   = dest.meta;
    }

    /* ----- Open card ----- */
    function openCard(dest) {
      /* Mark pin active */
      document.querySelectorAll('.cmap-pin-group').forEach(function (g) {
        g.classList.remove('is-active');
      });
      var pinGroup = document.getElementById('cmap-pin-' + dest.id);
      if (pinGroup) pinGroup.classList.add('is-active');

      /* Populate content */
      populateCard(dest);
      card.setAttribute('aria-hidden', 'false');

      /* Kill any running animation */
      if (cardAnim) cardAnim.kill();

      /* Animate in */
      if (prefersReduced) {
        gsap.set(card, { opacity: 1, x: 0, y: 0 });
      } else if (isMobileCard()) {
        /* Bottom sheet: slides up */
        gsap.set(card, { opacity: 0, yPercent: 100 });
        cardAnim = gsap.to(card, { opacity: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' });
      } else {
        /* Desktop: slides in from right */
        gsap.set(card, { opacity: 0, x: 300 });
        cardAnim = gsap.to(card, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' });
      }

      /* Pulse the pin */
      var pinDot = pinGroup ? pinGroup.querySelector('.cmap-pin-dot') : null;
      if (pinDot && !prefersReduced) {
        gsap.fromTo(pinDot,
          { scale: 0.7 },
          { scale: 1, duration: 0.45, ease: 'back.out(1.7)', transformOrigin: 'center' }
        );
      }

      activeId = dest.id;
    }

    /* ----- Close card ----- */
    function closeCard() {
      if (activeId === null) return;
      document.querySelectorAll('.cmap-pin-group').forEach(function (g) {
        g.classList.remove('is-active');
      });

      if (cardAnim) cardAnim.kill();

      var finishClose = function () {
        card.setAttribute('aria-hidden', 'true');
        activeId = null;
      };

      if (prefersReduced) {
        gsap.set(card, { opacity: 0 });
        finishClose();
      } else if (isMobileCard()) {
        cardAnim = gsap.to(card, {
          opacity: 0, yPercent: 100, duration: 0.3, ease: 'power2.in',
          onComplete: finishClose
        });
      } else {
        cardAnim = gsap.to(card, {
          opacity: 0, x: 300, duration: 0.3, ease: 'power2.in',
          onComplete: finishClose
        });
      }
    }

    /* ----- Pin click / keyboard handler ----- */
    function handlePinActivate(e) {
      var group = e.currentTarget;
      var destId = parseInt(group.getAttribute('data-dest'), 10);
      var dest = destinations.find(function (d) { return d.id === destId; });
      if (!dest) return;

      if (activeId === destId) {
        closeCard();
        return;
      }
      openCard(dest);
    }

    /* Bind clickable pins */
    document.querySelectorAll('.cmap-pin-group').forEach(function (group) {
      group.addEventListener('click', handlePinActivate);
      group.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePinActivate(e);
        }
      });
    });

    /* Bind mobile fallback buttons */
    document.querySelectorAll('.cumbria-map__fallback-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var destId = parseInt(btn.getAttribute('data-dest'), 10);
        var dest = destinations.find(function (d) { return d.id === destId; });
        if (!dest) return;
        /* Sync active state on fallback buttons */
        document.querySelectorAll('.cumbria-map__fallback-btn').forEach(function (b) {
          b.classList.remove('is-active');
        });
        if (activeId === destId) {
          closeCard();
          return;
        }
        btn.classList.add('is-active');
        openCard(dest);
      });
    });

    /* Close button */
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCard);
    }

    /* Escape closes */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeId !== null) closeCard();
    });

    /* Click outside card closes (desktop only: stage contains the card) */
    stage.addEventListener('click', function (e) {
      if (activeId === null) return;
      if (!card.contains(e.target) && !e.target.closest('.cmap-pin-group')) {
        closeCard();
      }
    });

    /* On mobile, tapping outside the bottom-sheet card also closes it */
    document.addEventListener('click', function (e) {
      if (activeId === null) return;
      if (window.innerWidth > 900) return; /* desktop handled by stage click */
      if (!card.contains(e.target) && !e.target.closest('.cmap-pin-group') && !e.target.closest('.cumbria-map__fallback-btn')) {
        closeCard();
      }
    });
  }

  */ /* end removed initCumbriaMap */

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
    var blocks = gsap.utils.toArray('.about-full, .cumbria-food, .section--olive .pillars');
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

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    /* Map now handled by cumbria-map.js (Leaflet) */

    if (prefersReduced) {
      initReducedMotion();
      return;
    }

    initHeroParallax();
    initSectionReveals();

    if (isMobile()) {
      initMobile();
    } else {
      initDesktop();
    }

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
