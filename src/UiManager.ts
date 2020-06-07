import { Renderer } from './Renderer'
import { ControlsPicker } from './ControlsPicker'
import { Player } from './Player'

export interface UiManagerOptions {
  renderer: Renderer
  controlsPicker: ControlsPicker
  player: Player
}

export class UiManager {
  renderer: Renderer
  controlsPicker: ControlsPicker
  player: Player
  canvas: HTMLCanvasElement

  constructor (
    options: UiManagerOptions
  ) {
    this.renderer = options.renderer
    this.controlsPicker = options.controlsPicker
    this.player = options.player
    this.canvas = this.renderer.webglRenderer.domElement
  }

  startListening () {
    this.removeSplashScreen = this.removeSplashScreen.bind(this)

    document.body.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'A') {
        return
      }
      this.removeSplashScreen()
    }, false)

    const uiToggle = document.querySelector('[name=hide-ui]') as HTMLInputElement

    uiToggle.addEventListener('click', async (e) => {
      if (uiToggle.checked) {
        try {
          await this.requestFreeMovement()
          this.renderer.showDiagram = false
        } catch (e) {
          uiToggle.checked = false
        }
      } else {
        this.renderer.showDiagram = true
        this.clearFreeMovement()
      }

      document.querySelector('.ui')!.classList.toggle('hidden', uiToggle.checked)
    }, false)

    this.startListeningForMobileControls()
    this.startListeningForDesktopControls()
    this.startListeningForVrControls()

    this.controlsPicker.addEventListener('pick', e => {
      if (e.controls === 'mobile') {
        this.showMobileControls()
      }
    })
  }

  startListeningForMobileControls () {
    document.addEventListener('touchstart', e => {
      if ((e.target as HTMLElement).tagName === 'A') {
        return
      }

      this.controlsPicker.pickControls('mobile')
    })
  }

  startListeningForDesktopControls () {
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock()
    }, false)

    document.addEventListener('pointerlockchange', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.controlsPicker.pickControls('desktop')
      }
    }, false)
  }

  startListeningForVrControls () {
    const startVrButton = document.querySelector('.start-vr')!
    if ((navigator as any).xr) {
      startVrButton.classList.remove('hidden')
      startVrButton.addEventListener('click', () => this.controlsPicker.pickControls('vr'))
    }
  }

  removeSplashScreen () {
    document.querySelector('.splash')!.classList.add('hidden')

    document.body.removeEventListener('click', this.removeSplashScreen, false)
  }

  showMobileControls () {
    this.removeSplashScreen()

    const element = document.querySelector('.mobile-instructions')!
    element.classList.remove('hidden')
    function dismiss () {
      element.classList.add('hidden')

      document.removeEventListener('touchstart', dismiss, false)
    }

    document.addEventListener('touchstart', dismiss, false)
  }

  requestFreeMovement() {
    return this.controlsPicker.getCurrentPlayerControls()?.requestFreeMovement()
  }

  clearFreeMovement() {
    const player = this.player

    player.position.y = Math.PI * 0.5

    player.quaternion.x = 0
    player.quaternion.z = 0
    player.quaternion.normalize()

    player.eyes.quaternion.x = 0
    player.eyes.quaternion.z = 0
    player.eyes.quaternion.normalize()

    this.controlsPicker.getCurrentPlayerControls()?.stopFreeMovement()
  }
}
