import { MainInterface, ControlScheme } from './types'

export class UiManager {
  vrButton = document.querySelector('.start-vr') as HTMLButtonElement
  movementToggle = document.querySelector('[name=hide-ui]') as HTMLInputElement

  constructor (
    readonly main: MainInterface
  ) {}

  showElement (el: Element) {
    el.classList.remove('hidden')
  }

  hideElement (el: Element) {
    el.classList.add('hidden')
  }

  toggleElement (el: Element, force?: boolean) {
    el.classList.toggle('hidden', force)
  }

  startListening () {
    this.removeSplashScreen = this.removeSplashScreen.bind(this)
    this.updateFreeMovement = this.updateFreeMovement.bind(this)
    this.showVrButton = this.showVrButton.bind(this)
    this.hideVrButton = this.hideVrButton.bind(this)

    document.body.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'A') {
        return
      }
      this.removeSplashScreen()
    }, false)

    this.movementToggle.checked = false
    this.movementToggle.addEventListener('click', this.updateFreeMovement, false)

    this.startListeningForMobileControls()
    this.startListeningForDesktopControls()
    this.startListeningForVrControls()

    this.main.allControls.vr.disableAction.addListener(() => {
      this.showVrButton()
    })
  }

  startListeningForMobileControls () {
    document.addEventListener('touchstart', e => {
      if ((e.target as HTMLElement).tagName === 'A') {
        return
      }

      this.setControls('mobile')
    })
  }

  startListeningForDesktopControls () {
    const canvas = this.main.canvas
    canvas.addEventListener('click', () => {
      if (this.main.currentControls !== this.main.allControls.vr) {
        canvas.requestPointerLock()
      }
    }, false)

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        this.setControls('desktop')
      }
    }, false)
  }

  async startListeningForVrControls () {
    if (!(navigator as any).xr) {
      const { default: WebXRPolyfill } = await import('webxr-polyfill')
      new WebXRPolyfill({ cardboard: false })
    }

    const xr = (navigator as any).xr
    if (!xr) {
      return
    }

    const supported = await xr.isSessionSupported('immersive-vr')
    if (supported) {
      this.showElement(this.vrButton)
      this.vrButton.addEventListener('click', () => this.setControls('vr'))
    }
  }

  setControls (controls: ControlScheme) {
    this.main.setControls(controls)
    this.updateFreeMovement()
    switch (controls) {
      case 'mobile':
        this.showMobileControls()
        break
      case 'vr':
        this.hideVrButton()
        break
    }
  }

  removeSplashScreen () {
    this.hideElement(document.querySelector('.splash')!)

    document.body.removeEventListener('click', this.removeSplashScreen, false)
  }

  showVrButton () {
    this.showElement(this.vrButton)
  }

  hideVrButton () {
    this.hideElement(this.vrButton)
  }

  showMobileControls () {
    this.removeSplashScreen()

    const element = document.querySelector('.mobile-instructions')!
    this.showElement(element)
    const dismiss = () => {
      this.hideElement(element)

      document.removeEventListener('touchstart', dismiss, false)
    }

    document.addEventListener('touchstart', dismiss, false)
  }

  async updateFreeMovement () {
    if (this.movementToggle.checked) {
      try {
        await this.requestFreeMovement()
        this.main.renderer.showDiagram = false
      } catch (e) {
        this.movementToggle.checked = false
      }
    } else {
      this.main.renderer.showDiagram = true
      this.clearFreeMovement()
    }

    this.toggleElement(document.querySelector('.ui')!, this.movementToggle.checked)
  }

  requestFreeMovement() {
    return this.main.currentControls?.requestFreeMovement()
  }

  clearFreeMovement() {
    const player = this.main.player

    player.position.y = Math.PI * 0.5

    player.quaternion.x = 0
    player.quaternion.z = 0
    player.quaternion.normalize()

    player.eyes.quaternion.x = 0
    player.eyes.quaternion.z = 0
    player.eyes.quaternion.normalize()

    this.main.currentControls?.stopFreeMovement()
  }
}
