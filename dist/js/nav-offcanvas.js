(function(){
  var toggle = document.getElementById('navToggle');
  var offcanvas = document.getElementById('offcanvas');
  var overlay = document.getElementById('offcanvasOverlay');
  var closeBtn = document.getElementById('offcanvasClose');
  if(!toggle || !offcanvas) return;
  function openNav(){ offcanvas.classList.add('is-open'); offcanvas.setAttribute('aria-hidden','false'); toggle.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; }
  function closeNav(){ offcanvas.classList.remove('is-open'); offcanvas.setAttribute('aria-hidden','true'); toggle.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
  toggle.addEventListener('click', openNav);
  if(closeBtn) closeBtn.addEventListener('click', closeNav);
  if(overlay) overlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeNav(); });
  offcanvas.querySelectorAll('.offcanvas__link').forEach(function(a){ a.addEventListener('click', closeNav); });
})();
