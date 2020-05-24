import { PlayerControls } from './playercontrols'
import { EventDispatcher } from './EventDispatcher'

type ControlType = 'keyboard' | 'touch'

export class ControlsPicker extends EventDispatcher<{ controls: ControlType }> {
  currentType?: ControlType
  currentControls?: PlayerControls

  allControls: Record<ControlType, PlayerControls>

  constructor (
    keyboardControls: PlayerControls,
    touchControls: PlayerControls
  ) {
    super()

    this.allControls = {
      'keyboard': keyboardControls,
      'touch': touchControls
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
    this.pickControls('keyboard')
  }

  pickTouchControls () {
    this.pickControls('touch')
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
