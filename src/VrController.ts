import { WebXRManager, XRGripSpace, XRTargetRaySpace } from 'three'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'
import { Action } from './Action'

const factory = new XRControllerModelFactory()

export class VrController {
  readonly controller: XRTargetRaySpace
  readonly grip: XRGripSpace

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

  private onControllerConnect (e: { data: XRInputSource }) {
    if (!e.data.gamepad) {
      return
    }
    this.gamepad = e.data.gamepad
  }

  private onControllerDisconnect (e: { data: XRInputSource }) {
    if (!e.data.gamepad) {
      return
    }
    this.disconnectAction.dispatch(undefined)
  }

  private onSelectStart () {
    this.triggerPressed = true
  }

  private onSelectEnd () {
    this.triggerPressed = false
  }
}
