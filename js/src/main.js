var WormholeSpace   = require("./wormholespace");
var Player          = require("./player");
var PlayerControls  = require("./playercontrols");
var Renderer        = require("./renderer");
var UIControls      = require("./uicontrols");

var container = document.querySelector('#container');

var wormholeSpace = new WormholeSpace(1.4, 5);

var player = new Player(wormholeSpace);

var maxX = wormholeSpace.radius * 4 + wormholeSpace.throatLength;

var playerX = wormholeSpace.radius * 2 + wormholeSpace.throatLength;

player.position.set(playerX, Math.PI * 0.5, 0);
player.rotateY(-Math.PI * 0.5);

var playerControls = new PlayerControls(player, container);

var clock = new THREE.Clock();

var renderer = new Renderer(container, wormholeSpace, maxX);

function animate() {
  requestAnimationFrame(animate);

  var delta = clock.getDelta();
  if (delta < 0.001) return;

  playerControls.update(delta);

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

animate();

new UIControls(renderer);
