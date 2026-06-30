(function(){
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) document.body.classList.add('reduced');

    // mobile nav
    var burger=document.getElementById('burger'), mnav=document.getElementById('mobileNav');
    function closeNav(){ mnav.classList.remove('open'); burger.setAttribute('aria-expanded','false'); mnav.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    burger.addEventListener('click', function(){
      var open=mnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open?'true':'false');
      mnav.setAttribute('aria-hidden', open?'false':'true');
      document.body.style.overflow = open?'hidden':'';
    });
    mnav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeNav); });

    // reveals
    if (!reduced && 'IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      },{threshold:0.12, rootMargin:'0px 0px -8% 0px'});
      document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    }

    // smooth scroll (Lenis on its own rAF loop, never gsap.ticker)
    if (!reduced && typeof Lenis !== 'undefined'){
      var lenis=new Lenis({lerp:0.085, smoothWheel:true});
      function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      document.querySelectorAll('a[href^="#"]').forEach(function(a){
        a.addEventListener('click', function(e){
          var id=a.getAttribute('href'); if(id.length>1){ var t=document.querySelector(id); if(t){ e.preventDefault(); lenis.scrollTo(t,{offset:-10}); } }
        });
      });
    }
  })();
