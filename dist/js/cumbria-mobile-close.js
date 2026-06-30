(function(){
  var isMob = window.innerWidth <= 900;
  if(isMob){
    var mobileClose = document.querySelector('.journey__close--mobile-only');
    if(mobileClose) mobileClose.style.display = '';
    /* The closing frame inside .journey__track is already display:flex via CSS;
       on mobile hide it since the track is hidden and the duplicate is shown. */
    var trackClose = document.querySelector('.journey__track .journey__close');
    if(trackClose) trackClose.style.display = 'none';
  }
})();
