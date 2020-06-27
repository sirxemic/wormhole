import { PlayerControls } from './PlayerControls'
import { Player } from './Player'
import { WebGLRenderer, PerspectiveCamera, Vector3, Vector2, Quaternion } from 'three'
import { UnitZ } from './MathUtils'
import { VrController } from './VrController'

const v1 = new Vector3()
const v2 = new Vector3()
const q1 = new Quaternion()

// Hack to get the VR camera's position in updateVelocity
const dummyCamera = new PerspectiveCamera()

export class PlayerControlsVr extends PlayerControls {
  private session: any

  private controllers: VrController[] = []

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

  protected beforeUpdate (delta: number) {
    const camera = this.renderer.xr.getCamera(dummyCamera)
    this.player.eyes.position.copy(camera.position)
    this.player.eyes.quaternion.copy(camera.quaternion)
  }

  protected afterUpdate (delta: number) {
    this.controllers.forEach(controller => controller.update())
  }

  protected updateOrientation (delta: number) {
    for (let controller of this.controllers) {
      if (!controller.gamepad) {
        continue
      }
      const axes = new Vector2(controller.gamepad.axes[0], -controller.gamepad.axes[1])
      const previousAxes = new Vector2(controller.previousAxes[0], -controller.previousAxes[1])
      if (axes.lengthSq() > 0.6 * 0.6 && previousAxes.lengthSq() < 0.4 * 0.4) {
        this.player.applyQuaternion(q1.setFromUnitVectors(UnitZ, v1.set(axes.x, axes.y, 1)))
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
