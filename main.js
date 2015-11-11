var container = document.querySelector('#container');

var wormholeSpace = new WormholeSpace(1.4, 5);

var renderer = new Renderer(container, wormholeSpace);

var player = new Player(wormholeSpace);

var playerX = wormholeSpace.radius * 2 + wormholeSpace.throatLength;

player.position.set(playerX, Math.PI * 0.5, 0);
player.rotateY(-Math.PI * 0.5);

var playerControls = new PlayerControls(player, container);

var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  var delta = clock.getDelta();
  if (delta < 0.001) return;

  playerControls.update(delta);

  var maxX = wormholeSpace.throatLength + wormholeSpace.radius * 4;

  if (player.position.x > maxX) {
    player.position.x = maxX;
  }
  else if (player.position.x < -maxX) {
    player.position.x = -maxX;
  }

  render();
}

function render() {
  renderer.render(player);
}

window.addEventListener('resize', resizeRenderer, false);

function resizeRenderer() {
  renderer.resize();
}

animate();

var uiToggle = document.querySelector('[name=hide-ui]');
uiToggle.addEventListener('change', toggleUI, false);

function toggleUI() {
  if (uiToggle.checked) {
    document.body.classList.add('no-ui');
  }
  else {
    document.body.classList.remove('no-ui');
  }
}

toggleUI();

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

document.addEventListener('click', removeIntroduction, false)
