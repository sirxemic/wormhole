function setupUiToggle(options) {
  var uiToggle = document.querySelector('[name=hide-ui]');

  // Free movement is not supported on touch devices
  document.addEventListener('touchstart', function() {
    document.body.classList.add('no-ui');
  }, false);

  function uiVisible() {
    return uiToggle.checked;
  }

  function toggleUI(event) {
    uiToggle.blur();

    if (uiVisible()) {
      document.body.classList.add('no-ui');
    }
    else {
      document.body.classList.remove('no-ui');
    }

    updateDiagramVisibility();
    updateFreeMovement();
  }

  function updateFreeMovement() {
    var freeMovement = uiVisible();

    if (!freeMovement) {
      // Reset the player
      options.resetPlayer();
    }

    options.playerControls.forEach(function(playerControl) {
      playerControl.freeMovement = freeMovement
    });
  }

  function updateDiagramVisibility() {
    options.renderer.showDiagram = !uiVisible();
  }

  uiToggle.addEventListener('change', toggleUI, false);

  toggleUI();
}

function setupIntroductionModal(options) {
  var main = document.querySelector('#main');

  function removeIntroduction(event) {
    // Ignore clicks on links
    if (event.target.href) {
      return;
    }

    document.querySelector('#introduction').classList.add('hidden');

    main.removeEventListener('click', removeIntroduction, false);
  }

  main.addEventListener('click', removeIntroduction, false);
}

module.exports = {
  setupUiToggle: setupUiToggle,
  setupIntroductionModal: setupIntroductionModal
};
