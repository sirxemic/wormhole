import { PlayerControls } from './playercontrols'
import { Renderer } from './renderer'

export interface UiToggleOptions {
  renderer: Renderer
  playerControls: PlayerControls[]
  resetPlayer: () => void
}

export function setupUiToggle (options: UiToggleOptions) {
  const uiToggle = document.querySelector('[name=hide-ui]') as HTMLInputElement

  // Free movement is not supported on touch devices
  document.addEventListener('touchstart', function() {
    document.body.classList.add('no-ui');
  }, false);

  function uiVisible() {
    return uiToggle.checked;
  }

  function toggleUI () {
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

  toggleUI()
}

export function setupIntroductionModal() {
  const main = document.querySelector('#main')!

  function removeIntroduction (event: Event) {
    // Ignore clicks on links
    if ('href' in event.target!) {
      return;
    }

    document.querySelector('#introduction')!.classList.add('hidden');

    main.removeEventListener('click', removeIntroduction, false);
  }

  main.addEventListener('click', removeIntroduction, false);
}
