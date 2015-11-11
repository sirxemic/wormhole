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
