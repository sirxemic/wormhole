function UIControls(renderer) {
  var uiToggle = document.querySelector('[name=hide-ui]');

  toggleUI();

  // Bind all kinds of events
  uiToggle.addEventListener('change', toggleUI, false);
  window.addEventListener('resize', resizeRenderer, false);
  document.addEventListener('click', removeIntroduction, false);
  document.querySelector('.renderer-settings').addEventListener('change', updatePixelSize, false);

  function resizeRenderer() {
    renderer.resize();
  }

  function toggleUI(event) {
    uiToggle.blur();

    if (uiToggle.checked) {
      document.body.classList.add('no-ui');
      renderer.showDiagram = false;
    }
    else {
      document.body.classList.remove('no-ui');
      renderer.showDiagram = true;
    }
  }

  function removeIntroduction(event) {
    // Ignore clicks on links
    if (event.target.href) {
      return;
    }

    document.querySelector('#introduction').classList.add('hidden');

    // When a scrollbar is removed, a resize has to be triggered manually
    resizeRenderer();

    document.removeEventListener('click', removeIntroduction, false)
  }

  function updatePixelSize(event) {
    renderer.updatePixelSize();

    event.target.blur();
  }
}

module.exports = UIControls;
