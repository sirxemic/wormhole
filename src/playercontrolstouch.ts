import { Vector3, Quaternion } from 'three'
import { Player } from './player'
import { PlayerControls } from './playercontrols'

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

export class PlayerControlsTouch extends PlayerControls {
  currentTouches: Record<string, TouchData> = {}
  velocityTouches: Record<string, boolean> = {}

  targetVelocity = new Vector3()

  public constructor (player: Player, domElement: HTMLElement) {
    super(player, domElement)

    domElement.addEventListener('contextmenu', (event) => {
      event.preventDefault()
    }, false)
    domElement.addEventListener('touchstart', this.touchStart.bind(this), false)
    domElement.addEventListener('touchmove', this.touchMove.bind(this), false)
    domElement.addEventListener('touchend', this.touchEnd.bind(this), false)
    domElement.addEventListener('touchcancel', this.touchEnd.bind(this), false)
  }

  private touchStart (event: TouchEvent) {
    // Preventing default behavior so that the user doesn't accidentally scroll the viewport
    event.preventDefault()
    // A touch is a sign that touch controls can be used.
    this.active = true
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

  private addRotationSpeed (touch: Touch) {
    var touchInfo = this.currentTouches[touch.identifier]
    this.rotationSpeedX -= 6 * (touchInfo.current.x - touchInfo.previous.x) / this.domElement.clientHeight
  }

  private addVelocityTouch (touch: Touch) {
    var touchInfo = this.currentTouches[touch.identifier]
    var speed = -4 * (touchInfo.current.y - touchInfo.start.y) / this.domElement.clientHeight
    this.targetVelocity.set(0, 0, speed)
    this.velocityTouches[touch.identifier] = true
  }

  private removeVelocityTouch (touch: Touch) {
    delete this.velocityTouches[touch.identifier]
    if (Object.keys(this.velocityTouches).length === 0) {
      this.targetVelocity.set(0, 0, 0)
    }
  }

  private touchMove (event: TouchEvent) {
    for (let touch, touchInfo, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i]
      touchInfo = this.currentTouches[touch.identifier]
      touchInfo.previous = touchInfo.current
      touchInfo.current = {
        x: touch.clientX,
        y: touch.clientY
      }
      var dxTotal = touchInfo.current.x - touchInfo.start.x
      var dyTotal = touchInfo.current.y - touchInfo.start.y
      if (Math.abs(dxTotal) > Math.abs(dyTotal)) {
        this.addRotationSpeed(touch)
        // This touch is no longer moving the player forward
        this.removeVelocityTouch(touch)
      }
      else {
        this.addVelocityTouch(touch)
      }
    }
  }

  private touchEnd (event: TouchEvent) {
    for (let touch, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i]
      delete this.currentTouches[touch.identifier]
      this.removeVelocityTouch(touch)
    }
  }

  protected updateOrientation (delta: number) {
    var player = this.player
    // Update camera roll/pitch etc
    this.rotationSpeedX -= 4 * this.rotationSpeedX * delta
    this.rotationSpeedY -= 4 * this.rotationSpeedY * delta
    var movementVector = new Vector3(this.rotationSpeedX * delta, -this.rotationSpeedY * delta, 1.0)
    movementVector.normalize()
    var rotation = new Quaternion()
    rotation.setFromUnitVectors(new Vector3(0, 0, 1), movementVector)
    player.quaternion.multiply(rotation)
  }

  protected updateVelocity (delta: number) {
    this.velocity.copy(this.targetVelocity)
  }
}
