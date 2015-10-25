var container = document.querySelector('#container');
var debugElement = document.querySelector('#debug');

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
  
  updateDebugInfo();

  render();
}

function updateDebugInfo()
{
  var y = player.position.y;
  while (y > Math.PI) y -= Math.PI;
  while (y < 0) y += Math.PI;
  var z = player.position.z;
  while (z > 2 * Math.PI) z -= 2 * Math.PI;
  while (z < 0) z += 2 * Math.PI;
  
  debugElement.textContent = 'Coordinates: (' + player.position.x.toFixed(3) + ', ' + y.toFixed(3) + ', ' + z.toFixed(3) + ')';
}

function render() {
  renderer.render(player);
}

window.addEventListener('resize', resizeRenderer, false);

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type == 'attributes' && mutation.attributeName == 'style') {
      resizeRenderer();
    }
  });
});

observer.observe(container, {
  attributes: true,
  childList: false,
  characterData: false
});

function resizeRenderer() {
  renderer.resize();
}

animate();
