(function(){
  var panel = document.getElementById('propertiesFilter');
  var resetBtn = document.getElementById('propertiesFilterReset');
  var cards = document.querySelectorAll('.property-card');
  if(!panel || !cards.length) return;

  function selectedValues(filterType){
    var inputs = panel.querySelectorAll('input[data-filter="' + filterType + '"]:checked');
    return Array.from(inputs).map(function(i){ return i.value; });
  }

  function apply(){
    var regions = selectedValues('region');
    var caps = selectedValues('capacity');
    var michelin = selectedValues('michelin');
    cards.forEach(function(card){
      var r = card.getAttribute('data-region');
      var c = card.getAttribute('data-capacity');
      var m = card.getAttribute('data-michelin');
      var passes = true;
      if(regions.length && regions.indexOf(r) === -1) passes = false;
      if(caps.length && caps.indexOf(c) === -1) passes = false;
      if(michelin.length && michelin.indexOf(m) === -1) passes = false;
      card.classList.toggle('is-hidden', !passes);
    });
  }

  panel.addEventListener('change', apply);
  if(resetBtn){
    resetBtn.addEventListener('click', function(){
      panel.querySelectorAll('input[type="checkbox"]').forEach(function(i){ i.checked = false; });
      apply();
    });
  }
})();
