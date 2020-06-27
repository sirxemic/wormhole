import { Group, Event } from 'three'
import { WebXRManager } from 'three/src/renderers/webxr/WebXRManager'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
import { Action } from './Action'

const factory = new XRControllerModelFactory()

export class VrController {
  readonly controller: Group
  readonly grip: Group

  public disconnectAction = new Action()

  gamepad?: Gamepad
  previousAxes: number[] = []
  triggerPressed = false

  constructor (xr: WebXRManager, index: number) {
    this.controller = xr.getController(index)

    this.onSelectStart = this.onSelectStart.bind(this)
    this.onSelectEnd = this.onSelectEnd.bind(this)
    this.onControllerConnect = this.onControllerConnect.bind(this)
    this.onControllerDisconnect = this.onControllerDisconnect.bind(this)

    this.controller.addEventListener('selectstart', this.onSelectStart)
    this.controller.addEventListener('selectend', this.onSelectEnd)
    this.controller.addEventListener('connected', this.onControllerConnect)
    this.controller.addEventListener('disconnected', this.onControllerDisconnect)

    this.grip = xr.getControllerGrip(index)
    this.grip.add(factory.createControllerModel(this.grip))
  }

  delete () {
    this.controller.removeEventListener('selectstart', this.onSelectStart)
    this.controller.removeEventListener('selectend', this.onSelectEnd)
    this.controller.removeEventListener('connected', this.onControllerConnect)
    this.controller.removeEventListener('disconnected', this.onControllerDisconnect)
  }

  update () {
    if (!this.gamepad) {
      return
    }
    this.previousAxes = [...this.gamepad.axes]
  }

  private onControllerConnect (e: Event) {
    if (!e.data.gamepad) {
      return
    }
    this.gamepad = e.data.gamepad
  }

  private onControllerDisconnect (e: Event) {
    if (!e.data.gamepad) {
      return
    }
    this.disconnectAction.dispatch(undefined)
  }

  private onSelectStart (e: Event) {
    this.triggerPressed = true
  }

  private onSelectEnd (e: Event) {
    this.triggerPressed = false
  }
}
