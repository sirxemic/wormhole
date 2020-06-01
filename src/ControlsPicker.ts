import { PlayerControls } from './PlayerControls'
import { EventDispatcher } from './EventDispatcher'

type ControlType = 'desktop' | 'mobile'

export class ControlsPicker extends EventDispatcher<{ controls: ControlType }> {
  currentType?: ControlType
  currentControls?: PlayerControls

  allControls: Record<ControlType, PlayerControls>

  constructor (
    desktopControls: PlayerControls,
    mobileControls: PlayerControls
  ) {
    super()

    this.allControls = {
      'desktop': desktopControls,
      'mobile': mobileControls
    }

    this.pickKeyboardControls = this.pickKeyboardControls.bind(this)
    this.pickTouchControls = this.pickTouchControls.bind(this)

    if ('requestPointerLock' in document.body) {
      document.addEventListener('mousemove', this.pickKeyboardControls)
      document.addEventListener('keydown', this.pickKeyboardControls)
    }

    document.addEventListener('touchstart', e => {
      if ((e.target as HTMLElement).tagName === 'A') {
        return
      }

      this.pickTouchControls()
    })
  }

  getCurrentPlayerControls () {
    return this.currentControls
  }

  pickKeyboardControls () {
    this.pickControls('desktop')
  }

  pickTouchControls () {
    this.pickControls('mobile')
  }

  pickControls (type: ControlType) {
    if (this.currentType === type) {
      return
    }

    this.currentType = type
    this.currentControls = this.allControls[type]

    Object.values(this.allControls).forEach(controls => {
      if (controls === this.currentControls) {
        controls.enable()
      } else {
        controls.disable()
      }
    })

    this.dispatchEvent({ type: 'pick', controls: type })
  }
}
