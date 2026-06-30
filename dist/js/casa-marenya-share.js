(function(){
  var shareBtn = document.getElementById('shareBtn');

  // Share: Web Share API where supported, fall back to copying URL.
  if(shareBtn){
    shareBtn.addEventListener('click', async function(){
      var url = window.location.href;
      var data = {
        title: 'Casa Marenya | ProLuxe Travel',
        text: 'Casa Marenya, Cap de Formentor, Mallorca. 300m from the Four Seasons.',
        url: url
      };
      if(navigator.share){
        try { await navigator.share(data); return; } catch(e){ /* user cancelled */ }
      }
      // Fallback: copy URL to clipboard, show transient label change.
      try {
        await navigator.clipboard.writeText(url);
        var label = shareBtn.querySelector('.villa-action__label');
        var prev = label.textContent;
        label.textContent = 'Link copied';
        setTimeout(function(){ label.textContent = prev; }, 2000);
      } catch(e){
        window.prompt('Copy this link to share:', url);
      }
    });
  }
})();
