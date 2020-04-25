import { WormholeSpace } from './wormholespace'
import { Player } from './player'
import { Renderer } from './renderer'
import { PlayerControlsKeyboard } from './playercontrolskeyboard'
import { PlayerControlsTouch } from './playercontrolstouch'
import { Clock } from 'three'
import { setupUiToggle, setupIntroductionModal } from './ui'

var container = document.querySelector('#main')!

var wormholeSpace = new WormholeSpace(1.4, 5)

var player = new Player(wormholeSpace)

var maxX = wormholeSpace.radius * 4 + wormholeSpace.throatLength

var playerX = wormholeSpace.radius * 2 + wormholeSpace.throatLength

player.position.set(playerX, Math.PI * 0.5, 0)
player.rotateY(-Math.PI * 0.5)

// A workaround for a bug in THREE.Clock.prototype.getDelta (only happening for older devices)
;(window as any).performance = window.performance || Date

var clock = new Clock()

var renderer = new Renderer(wormholeSpace, maxX)

container.appendChild(renderer.canvas)

var playerControls = [
  new PlayerControlsKeyboard(player, renderer.canvas),
  new PlayerControlsTouch(player, renderer.canvas)
]

function animate() {
  requestAnimationFrame(animate)

  var delta = clock.getDelta()
  if (delta < 0.001) return

  // If delta becomes too big we might get weird stuff happening
  if (delta > 0.1) {
    delta = 0.1
  }

  playerControls.forEach((playerControl) => {
    playerControl.update(delta)
  })

  if (player.position.x > maxX) {
    player.position.x = maxX
  }
  else if (player.position.x < -maxX) {
    player.position.x = -maxX
  }

  render()
}

function render() {
  renderer.render(player)
}

animate()

setupUiToggle({
  renderer: renderer,
  playerControls: playerControls,
  resetPlayer: function resetPlayer() {
    player.position.y = Math.PI * 0.5
    player.quaternion.x = 0
    player.quaternion.z = 0
    player.quaternion.normalize()
  }
})

setupIntroductionModal()
