import { WormholeSpace } from './WormholeSpace'
import { Player } from './Player'
import { Renderer } from './Renderer'
import { PlayerControls } from './PlayerControls'
import { PlayerControlsKeyboard } from './PlayerControlsDesktop'
import { PlayerControlsTouch } from './PlayerControlsMobile'
import { PlayerControlsVr } from './PlayerControlsVr'
import { WebGLRenderer } from 'three'
import { UiManager } from './UiManager'
import { ControlScheme, MainInterface } from './types'

class Main implements MainInterface {
  canvas: HTMLCanvasElement
  allControls: Record<ControlScheme, PlayerControls>
  currentControls?: PlayerControls

  wormholeSpace = new WormholeSpace(1.5, 5)
  player: Player
  renderer: Renderer
  ui: UiManager
  maxX: number
  prevTime = 0

  constructor () {
    const webglRenderer = new WebGLRenderer()
    this.canvas = webglRenderer.domElement
    document.querySelector('#canvas-wrapper')!.appendChild(this.canvas)

    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.xr.enabled = true

    this.maxX = this.wormholeSpace.radius * 5.5 + this.wormholeSpace.throatLength
    const playerX = this.wormholeSpace.radius * 2 + this.wormholeSpace.throatLength

    this.player = new Player(this.wormholeSpace)
    this.player.position.set(playerX, Math.PI * 0.5, 0)
    this.player.rotateY(Math.PI * 0.5)

    this.renderer = new Renderer(webglRenderer, this.wormholeSpace, this.maxX, this.player)

    this.allControls = {
      desktop: new PlayerControlsKeyboard(this.player, this.canvas),
      mobile: new PlayerControlsTouch(this.player, this.canvas),
      vr: new PlayerControlsVr(this.player, webglRenderer)
    }

    this.allControls.vr.disableAction.addListener(() => this.clearControls())

    webglRenderer.setAnimationLoop(this.loop.bind(this))

    this.ui = new UiManager(this)
    this.ui.startListening()
  }

  async setControls (scheme: ControlScheme) {
    if (this.currentControls === this.allControls[scheme]) {
      return
    }

    await this.currentControls?.disable()
    this.currentControls = this.allControls[scheme]
    await this.currentControls.enable()
  }

  clearControls () {
    this.currentControls?.disable()
    this.currentControls = undefined
  }

  loop (time: number) {
    let delta = (time - this.prevTime) / 1000
    this.prevTime = time

    // First frame the delta will be close to zero
    if (delta < 0.001) return

    // If delta becomes too big we might get weird stuff happening
    if (delta > 0.1) {
      delta = 0.1
    }

    this.currentControls?.update(delta)

    this.player.updateMatrixWorld()

    if (this.player.position.x > this.maxX) {
      this.player.position.x = this.maxX
    }
    else if (this.player.position.x < -this.maxX) {
      this.player.position.x = -this.maxX
    }

    this.renderer.update(delta)
    this.renderer.render()
  }
}

// WebXR only works in secure contexts
if (location.protocol === 'http:') {
  location.replace(location.href.replace('http:', 'https:'))
} else {
  new Main()
}
