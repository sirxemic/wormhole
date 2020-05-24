import { Vector3, Quaternion } from 'three'
import { PlayerControls } from './playercontrols'
import { Player } from './player'
import { UnitZ, UnitZNeg, UnitXNeg, UnitX, UnitY, UnitYNeg } from './mathutil'

export class PlayerControlsKeyboard extends PlayerControls {
  private moveForward = false
  private moveBackward = false
  private moveLeft = false
  private moveRight = false
  private moveUp = false
  private moveDown = false
  private rotateLeft = false
  private rotateRight = false

  private rotationSpeedX = 0
  private rotationSpeedY = 0

  public constructor (
    player: Player,
    readonly domElement: HTMLElement
  ) {
    super(player)

    this.requestPointerLock = this.requestPointerLock.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onPointerLockChange = this.onPointerLockChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
  }

  public enable () {
    this.moveForward = false
    this.moveBackward = false
    this.moveLeft = false
    this.moveRight = false
    this.moveUp = false
    this.moveDown = false
    this.rotateLeft = false
    this.rotateRight = false

    this.rotationSpeedX = 0
    this.rotationSpeedY = 0

    this.domElement.addEventListener('click', this.requestPointerLock, false)
    document.addEventListener('pointerlockchange', this.onPointerLockChange, false)
    document.addEventListener('keydown', this.onKeyDown, false)
    document.addEventListener('keyup', this.onKeyUp, false)
  }

  public disable () {
    this.domElement.removeEventListener('click', this.requestPointerLock, false)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange, false)
    document.removeEventListener('keydown', this.onKeyDown, false)
    document.removeEventListener('keyup', this.onKeyUp, false)

  }

  protected updateOrientation (delta: number) {
    // Update camera roll/pitch etc
    this.rotationSpeedX -= 4 * this.rotationSpeedX * delta
    this.rotationSpeedY -= 4 * this.rotationSpeedY * delta
    var movementVector = new Vector3(this.rotationSpeedX * delta, -this.rotationSpeedY * delta, 100.0)
    movementVector.normalize()

    const rotation = new Quaternion()
    rotation.setFromUnitVectors(UnitZ, movementVector)
    this.player.quaternion.multiply(rotation)
    if (this.freeMovement) {
      if (this.rotateLeft) {
        rotation.setFromAxisAngle(UnitZ, delta)
        this.player.quaternion.multiply(rotation)
      }
      if (this.rotateRight) {
        rotation.setFromAxisAngle(UnitZ, -delta)
        this.player.quaternion.multiply(rotation)
      }
    }
  }

  protected updateVelocity (delta: number) {
    const targetVelocity = new Vector3()
    if (this.moveForward) {
      targetVelocity.add(UnitZNeg)
    }
    if (this.moveBackward) {
      targetVelocity.add(UnitZ)
    }
    if (this.moveLeft) {
      targetVelocity.add(UnitXNeg)
    }
    if (this.moveRight) {
      targetVelocity.add(UnitX)
    }
    if (this.freeMovement) {
      if (this.moveUp) {
        targetVelocity.add(UnitY)
      }
      if (this.moveDown) {
        targetVelocity.add(UnitYNeg)
      }
    }
    if (targetVelocity.lengthSq() > 0) {
      targetVelocity.normalize().applyQuaternion(this.player.quaternion)
    }
    this.velocity.lerp(targetVelocity, 1 - Math.exp(-delta * 10))
  }

  private requestPointerLock () {
    this.domElement.requestPointerLock()
  }

  private onMouseMove (e: MouseEvent) {
    this.rotationSpeedX -= 4 * (e.movementX || 0)
    if (this.freeMovement) {
      this.rotationSpeedY -= 4 * (e.movementY || 0)
    }
  }

  private onKeyDown (e: KeyboardEvent) {
    switch (e.keyCode) {
      case 37:
      case 65:
        this.moveLeft = true
        break
      case 39:
      case 68:
        this.moveRight = true
        break
      case 38:
      case 87:
      case 90: // Z for AZERTY keyboards
        this.moveForward = true
        break
      case 40:
      case 83:
        this.moveBackward = true
        break
      case 82:
        this.moveUp = true
        break
      case 70:
        this.moveDown = true
        break
      case 81:
        this.rotateLeft = true
        break
      case 69:
        this.rotateRight = true
        break
    }
  }

  private onKeyUp (e: KeyboardEvent) {
    switch (e.keyCode) {
      case 37:
      case 65:
        this.moveLeft = false
        break
      case 39:
      case 68:
        this.moveRight = false
        break
      case 38:
      case 87:
      case 90: // Z for AZERTY keyboards
        this.moveForward = false
        break
      case 40:
      case 83:
        this.moveBackward = false
        break
      case 82:
        this.moveUp = false
        break
      case 70:
        this.moveDown = false
        break
      case 81:
        this.rotateLeft = false
        break
      case 69:
        this.rotateRight = false
        break
    }
  }

  private onPointerLockChange() {
    if (document.pointerLockElement === this.domElement) {
      document.addEventListener('mousemove', this.onMouseMove, false)
    }
    else {
      document.removeEventListener('mousemove', this.onMouseMove, false)
    }
  }
}
