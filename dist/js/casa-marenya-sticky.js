(function(){
  var bar = document.getElementById('villaStickybar');
  var hero = document.querySelector('.cumbria-hero');
  if(!bar || !hero) return;
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          bar.classList.remove('is-visible');
        } else {
          bar.classList.add('is-visible');
        }
      });
    }, { rootMargin: '-80px 0px 0px 0px' });
    io.observe(hero);
  } else {
    // Fallback: show on any scroll past 320px
    window.addEventListener('scroll', function(){
      if(window.scrollY > 320) bar.classList.add('is-visible');
      else bar.classList.remove('is-visible');
    });
  }
})();
