// Personalise the greeting from URL parameter ?to=Name
// and swap the bureau paragraph + CTA cards when ?context=shepherd is present.
(function() {
  var params = new URLSearchParams(window.location.search);

  // Greeting from ?to=
  var toName = params.get('to');
  var greeting = document.getElementById('letterGreeting');
  if (greeting) {
    if (toName && toName.trim()) {
      var name = toName.trim().slice(0, 40);
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      // textContent escapes HTML, safe against injection.
      greeting.textContent = 'Dear ' + name + ',';
    } else {
      greeting.classList.add('letter__greeting--hidden');
    }
  }

  // Context swap from ?context=shepherd
  var context = (params.get('context') || '').trim().toLowerCase();
  if (context === 'shepherd') {
    var defaultPara  = document.querySelector('[data-letter-para="default"]');
    var shepherdPara = document.querySelector('[data-letter-para="shepherd"]');
    if (defaultPara && shepherdPara) {
      defaultPara.classList.add('letter__greeting--hidden');
      shepherdPara.classList.remove('letter__greeting--hidden');
    }

    var cardOne = document.getElementById('bureauCardOne');
    if (cardOne) {
      cardOne.setAttribute('href', '/bureau/operations/');
      var cardOneLabel = cardOne.querySelector('[data-card-label="one"]');
      var cardOneHint  = cardOne.querySelector('[data-card-hint="one"]');
      if (cardOneLabel) cardOneLabel.textContent = 'For operations';
      if (cardOneHint)  cardOneHint.textContent  = 'For operations leads and protection teams';
    }

    var cardTwo = document.getElementById('bureauCardTwo');
    if (cardTwo) {
      cardTwo.setAttribute('href', '/bureau/office/');
      var cardTwoLabel = cardTwo.querySelector('[data-card-label="two"]');
      var cardTwoHint  = cardTwo.querySelector('[data-card-hint="two"]');
      if (cardTwoLabel) cardTwoLabel.textContent = "For a principal's office";
      if (cardTwoHint)  cardTwoHint.textContent  = 'For EAs and chiefs of staff';
    }
  }
})();
