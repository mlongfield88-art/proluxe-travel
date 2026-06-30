(function(){
  var lb = document.getElementById('villaLightbox');
  var img = document.getElementById('lbImg');
  var counter = document.getElementById('lbCounter');
  var closeBtn = document.getElementById('lbClose');
  var prevBtn = document.getElementById('lbPrev');
  var nextBtn = document.getElementById('lbNext');
  if(!lb || !img) return;

  var imgs = Array.prototype.slice.call(document.querySelectorAll('.villa-gallery__item img'));
  if(!imgs.length) return;
  var current = 0;

  function show(i){
    current = (i + imgs.length) % imgs.length;
    img.src = imgs[current].src;
    img.alt = imgs[current].alt;
    counter.textContent = (current+1) + ' / ' + imgs.length;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  imgs.forEach(function(el, i){
    el.addEventListener('click', function(){ show(i); });
  });
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function(){ show(current - 1); });
  nextBtn.addEventListener('click', function(){ show(current + 1); });
  lb.addEventListener('click', function(e){
    if(e.target === lb || e.target === img) close();
  });
  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('is-open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') show(current - 1);
    if(e.key === 'ArrowRight') show(current + 1);
  });
})();
