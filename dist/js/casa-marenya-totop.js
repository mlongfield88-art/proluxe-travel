(function(){
  var btn = document.getElementById('villaToTop');
  if(!btn) return;
  var threshold = window.innerHeight * 1.2;
  function update(){
    if(window.scrollY > threshold) btn.classList.add('is-visible');
    else btn.classList.remove('is-visible');
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function(){ threshold = window.innerHeight * 1.2; update(); });
  btn.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  update();
})();
