import { WormholeSpace } from './wormholespace'
import { Player } from './player'
import { Renderer } from './renderer'
import { PlayerControlsKeyboard } from './playercontrolskeyboard'
import { PlayerControlsTouch } from './playercontrolstouch'
import { WebGLRenderer } from 'three'
import { UiManager } from './ui'
import { ControlsPicker } from './controlspicker'

const webglRenderer = new WebGLRenderer()
document.querySelector('#canvas-wrapper')!.appendChild(webglRenderer.domElement)

webglRenderer.setPixelRatio(window.devicePixelRatio)
webglRenderer.autoClear = false
webglRenderer.xr.enabled = true

const wormholeSpace = new WormholeSpace(1.5, 5)

const maxX = wormholeSpace.radius * 5.5 + wormholeSpace.throatLength
const playerX = wormholeSpace.radius * 2 + wormholeSpace.throatLength

const player = new Player(wormholeSpace)
player.position.set(playerX, Math.PI * 0.5, 0)
player.rotateY(Math.PI * 0.5)

const renderer = new Renderer(webglRenderer, wormholeSpace, maxX, player)

const controlsPicker = new ControlsPicker(
  new PlayerControlsKeyboard(player, webglRenderer.domElement),
  new PlayerControlsTouch(player, webglRenderer.domElement)
)

// A workaround for a bug in THREE.Clock.prototype.getDelta (only happening on older devices)
;(window as any).performance = window.performance || Date

let prevTime = 0
webglRenderer.setAnimationLoop((time: number) => {
  let delta = (time - prevTime) / 1000
  prevTime = time

  // First frame the delta will be close to zero
  if (delta < 0.001) return

  // If delta becomes too big we might get weird stuff happening
  if (delta > 0.1) {
    delta = 0.1
  }

  controlsPicker.getCurrentPlayerControls()?.update(delta)

  player.updateMatrixWorld()

  if (player.position.x > maxX) {
    player.position.x = maxX
  }
  else if (player.position.x < -maxX) {
    player.position.x = -maxX
  }

  renderer.render()
})

const manager = new UiManager({
  renderer,
  controlsPicker,
  player
})

manager.startListening()