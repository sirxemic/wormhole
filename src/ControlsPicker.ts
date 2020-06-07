import { PlayerControls } from './PlayerControls'
import { EventDispatcher } from './EventDispatcher'

type ControlType = 'desktop' | 'mobile' | 'vr'

export class ControlsPicker extends EventDispatcher<{ controls: ControlType }> {
  currentType?: ControlType
  currentControls?: PlayerControls

  allControls: Record<ControlType, PlayerControls>

  constructor (
    desktopControls: PlayerControls,
    mobileControls: PlayerControls,
    vrControls: PlayerControls
  ) {
    super()

    this.allControls = {
      'desktop': desktopControls,
      'mobile': mobileControls,
      'vr': vrControls
    }
  }

  getCurrentPlayerControls () {
    return this.currentControls
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
