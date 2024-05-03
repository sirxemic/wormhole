import { Vector3, Quaternion, MathUtils, Euler } from 'three'
import { Player } from './Player'
import { PlayerControls } from './PlayerControls'
import { UnitZ } from './MathUtils'

interface TouchData {
  start: {
    x: number
    y: number
  },
  previous: {
    x: number
    y: number
  },
  current: {
    x: number
    y: number
  }
}

const q0 = new Quaternion()
const minusPiOverTwoAroundX = new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2) // - PI/2 around the x-axis

export class PlayerControlsTouch extends PlayerControls {
  private currentTouches: Record<string, TouchData> = {}
  private velocityTouches: Record<string, boolean> = {}
  private deviceOrientation?: DeviceOrientationEvent
  private screenOrientation = 0

  private forwardSpeed = 0
  private rotationSpeedX = 0

  public constructor (
    player: Player,
    readonly domElement: HTMLElement
  ) {
    super(player)

    this.onContextMenu = this.onContextMenu.bind(this)
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)

    this.onScreenOrientationChange = this.onScreenOrientationChange.bind(this)
    this.onDeviceOrientationChange = this.onDeviceOrientationChange.bind(this)
  }

  protected onEnable () {
    this.currentTouches = {}
    this.velocityTouches = {}
    this.forwardSpeed = 0
    this.rotationSpeedX = 0

    this.domElement.addEventListener('contextmenu', this.onContextMenu, false)
    this.domElement.addEventListener('touchstart', this.onTouchStart, false)
    this.domElement.addEventListener('touchmove', this.onTouchMove, false)
    this.domElement.addEventListener('touchend', this.onTouchEnd, false)
    this.domElement.addEventListener('touchcancel', this.onTouchEnd, false)
  }

  protected onDisable () {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu, false)
    this.domElement.removeEventListener('touchstart', this.onTouchStart, false)
    this.domElement.removeEventListener('touchmove', this.onTouchMove, false)
    this.domElement.removeEventListener('touchend', this.onTouchEnd, false)
    this.domElement.removeEventListener('touchcancel', this.onTouchEnd, false)
  }

  public async requestFreeMovement () {
    if (window.DeviceOrientationEvent && (window.DeviceOrientationEvent as any).requestPermission) {
      await (window.DeviceOrientationEvent as any).requestPermission()
    }

    window.addEventListener('orientationchange', this.onScreenOrientationChange, false)
    window.addEventListener('deviceorientation', this.onDeviceOrientationChange, false)

    this.freeMovement = true
  }

  public stopFreeMovement () {
    window.removeEventListener('orientationchange', this.onScreenOrientationChange, false)
    window.removeEventListener('deviceorientation', this.onDeviceOrientationChange, false)

    this.freeMovement = false
  }

  private onContextMenu (event: Event) {
    event.preventDefault()
  }

  private onTouchStart (event: TouchEvent) {
    // Preventing default behavior so that the user doesn't accidentally scroll the viewport
    event.preventDefault()

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      this.currentTouches[touch.identifier] = {
        start: {
          x: touch.clientX,
          y: touch.clientY
        },
        previous: {
          x: touch.clientX,
          y: touch.clientY
        },
        current: {
          x: touch.clientX,
          y: touch.clientY
        }
      }
    }
  }

  private setRotationSpeed (touch: Touch) {
    const touchInfo = this.currentTouches[touch.identifier]
    const cameraFovX = 2 * Math.atan(Math.tan(this.player.eyes.fov * MathUtils.DEG2RAD * 0.5) * this.player.eyes.aspect)
    this.rotationSpeedX = cameraFovX * (touchInfo.current.x - touchInfo.previous.x) / this.domElement.clientWidth
  }

  private addVelocityTouch (touch: Touch) {
    const touchInfo = this.currentTouches[touch.identifier]
    this.forwardSpeed = 4 * (touchInfo.current.y - touchInfo.start.y) / this.domElement.clientHeight
    this.velocityTouches[touch.identifier] = true
  }

  private removeVelocityTouch (touch: Touch) {
    delete this.velocityTouches[touch.identifier]
    if (Object.keys(this.velocityTouches).length === 0) {
      this.forwardSpeed = 0
    }
  }

  private onTouchMove (event: TouchEvent) {
    for (let touch, touchInfo, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i]
      touchInfo = this.currentTouches[touch.identifier]
      touchInfo.previous = touchInfo.current
      touchInfo.current = {
        x: touch.clientX,
        y: touch.clientY
      }
      const dxTotal = touchInfo.current.x - touchInfo.start.x
      const dyTotal = touchInfo.current.y - touchInfo.start.y
      if (Math.abs(dxTotal) > Math.abs(dyTotal)) {
        this.setRotationSpeed(touch)
        // This touch is no longer moving the player forward
        this.removeVelocityTouch(touch)
      }
      else {
        this.addVelocityTouch(touch)
      }
    }
  }

  private onTouchEnd (event: TouchEvent) {
    for (let touch, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i]
      delete this.currentTouches[touch.identifier]
      this.removeVelocityTouch(touch)
    }
  }

  private onDeviceOrientationChange (event: DeviceOrientationEvent) {
    this.deviceOrientation = event
  }

  private onScreenOrientationChange () {
    this.screenOrientation = Number(window.orientation) || 0
  }

  private updateEyeOrientation () {
    if (!this.deviceOrientation || this.deviceOrientation.alpha === null) {
      return
    }

    const alpha = this.deviceOrientation.alpha ? MathUtils.DEG2RAD * this.deviceOrientation.alpha : 0
    const beta = this.deviceOrientation.beta ? MathUtils.DEG2RAD * this.deviceOrientation.beta : 0
    const gamma = this.deviceOrientation.gamma ? MathUtils.DEG2RAD * this.deviceOrientation.gamma : 0
    const orient = this.screenOrientation ? MathUtils.DEG2RAD * this.screenOrientation : 0

    const euler = new Euler(beta, alpha, -gamma, 'YXZ') // 'ZXY' for the device, but 'YXZ' for us

    this.player.eyes.quaternion.setFromEuler(euler) // orient the device
    this.player.eyes.quaternion.multiply(minusPiOverTwoAroundX) // camera looks out the back of the device, not the top
    this.player.eyes.quaternion.multiply(q0.setFromAxisAngle(UnitZ, -orient)) // adjust for screen orientation
  }

  protected updateOrientation (delta: number) {
    const player = this.player

    const movementVector = new Vector3(this.rotationSpeedX, 0, 1)
    movementVector.normalize()

    player.quaternion.multiply(q0.setFromUnitVectors(UnitZ, movementVector))

    this.rotationSpeedX -= 4 * this.rotationSpeedX * delta

    if (this.freeMovement) {
      this.updateEyeOrientation()
    }
  }

  protected updateVelocity () {
    this.velocity
      .set(0, 0, this.forwardSpeed)
      .applyQuaternion(this.player.eyes.getWorldQuaternion(q0))
  }
}
