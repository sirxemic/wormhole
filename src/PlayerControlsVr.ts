import { PlayerControls } from './PlayerControls'
import { Player } from './Player'
import { WebGLRenderer, Vector3, Vector2, Quaternion } from 'three'
import { UnitZ } from './MathUtils'
import { VrController } from './VrController'

const v1 = new Vector3()
const v2 = new Vector3()
const q1 = new Quaternion()

export class PlayerControlsVr extends PlayerControls {
  private session: any

  private controllers: VrController[] = []
  private controllerJoystickTriggered: Map<VrController, boolean> = new Map()

  public constructor (
    player: Player,
    readonly renderer: WebGLRenderer
  ) {
    super(player)

    this.disable = this.disable.bind(this)
  }

  protected async onEnable () {
    const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] }
    this.session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit)
    this.session.addEventListener('end', this.disable)
    this.renderer.xr.setSession(this.session)

    for (let i = 0; i < 2; i++) {
      this.controllers[i] = new VrController(this.renderer.xr, i)
      this.player.add(this.controllers[i].grip)
    }
  }

  protected onDisable () {
    if (!this.session) {
      return
    }

    this.controllers.forEach(controller => {
      controller.delete()
    })

    this.controllers.length = 0

    this.session.removeEventListener('end', this.disable)
    this.session = null
  }

  protected beforeUpdate () {
    const camera = this.renderer.xr.getCamera()
    this.player.eyes.position.copy(camera.position)
    this.player.eyes.quaternion.copy(camera.quaternion)
  }

  protected afterUpdate () {
    this.controllers.forEach(controller => controller.update())
  }

  protected updateOrientation () {
    for (let controller of this.controllers) {
      if (!controller.gamepad) {
        continue
      }

      const axes = new Vector2(-controller.gamepad.axes[2], controller.gamepad.axes[3])
      const length = axes.length()

      if (length < 0.4) {
        this.controllerJoystickTriggered.set(controller, false)
        continue
      }

      if (length > 0.8 && !this.controllerJoystickTriggered.get(controller)) {
        v1.copy(UnitZ).applyQuaternion(this.player.eyes.quaternion)
        v2.set(axes.x, axes.y, 3).normalize().applyQuaternion(this.player.eyes.quaternion)
        q1.setFromUnitVectors(v1, v2)
        this.player.quaternion.multiply(q1)

        this.controllerJoystickTriggered.set(controller, true)
      }
    }
  }

  protected updateVelocity (delta: number) {
    const targetVelocity = v1.set(0, 0, 0)

    for (let controller of this.controllers) {
      if (!controller.triggerPressed) {
        continue
      }

      v2.subVectors(controller.grip.position, this.player.eyes.position).normalize().applyQuaternion(this.player.quaternion)
      targetVelocity.add(v2)
    }

    this.velocity.lerp(targetVelocity, 1 - Math.exp(-delta * 10))
  }
}
