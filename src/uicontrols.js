function UIControls(options) {
  var uiToggle = document.querySelector('[name=hide-ui]');

  function uiVisible() {
    return uiToggle.checked;
  }

  function resizeRenderer() {
    options.renderer.resize();
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

  function removeIntroduction(event) {
    // Ignore clicks on links
    if (event.target.href) {
      return;
    }

    document.querySelector('#introduction').classList.add('hidden');

    // When a scrollbar is removed, a resize has to be triggered manually
    resizeRenderer();

    document.removeEventListener('click', removeIntroduction, false);
    document.removeEventListener('touch', removeIntroduction, false);
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

  // Bind all kinds of events
  uiToggle.addEventListener('change', toggleUI, false);
  window.addEventListener('resize', resizeRenderer, false);
  document.addEventListener('click', removeIntroduction, false);
  document.addEventListener('touch', removeIntroduction, false);

  toggleUI();
}

module.exports = UIControls;
