import { Vector3, Quaternion } from 'three'
import { PlayerControls } from './playercontrols'
import { Player } from './player'

export class PlayerControlsKeyboard extends PlayerControls
{
  private moveForward = false
  private moveBackward = false
  private moveLeft = false
  private moveRight = false
  private moveUp = false
  private moveDown = false
  private rotateLeft = false
  private rotateRight = false

  public constructor (player: Player, domElement: HTMLElement)
  {
    super(player, domElement)

    domElement.onclick = () => {
      (domElement as any).requestPointerLock =
        (domElement.requestPointerLock ||
        (domElement as any).mozRequestPointerLock ||
        (domElement as any).webkitRequestPointerLock)
      domElement.requestPointerLock()
    }

    this.onMouseMove = this.onMouseMove.bind(this)
    this.lockChange = this.lockChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)

    // Hook pointer lock state change events for different browsers
    document.addEventListener('pointerlockchange', this.lockChange, false)
    document.addEventListener('mozpointerlockchange', this.lockChange, false)
    document.addEventListener('webkitpointerlockchange', this.lockChange, false)
    document.addEventListener('keydown', this.onKeyDown, false)
    document.addEventListener('keyup', this.onKeyUp, false)
  }

  protected updateOrientation (delta: number) {
    // Update camera roll/pitch etc
    this.rotationSpeedX -= 4 * this.rotationSpeedX * delta
    this.rotationSpeedY -= 4 * this.rotationSpeedY * delta
    var movementVector = new Vector3(this.rotationSpeedX * delta, -this.rotationSpeedY * delta, 100.0)
    movementVector.normalize()
    var rotation = new Quaternion()
    rotation.setFromUnitVectors(new Vector3(0, 0, 1), movementVector)
    this.player.quaternion.multiply(rotation)
    if (this.freeMovement) {
      if (this.rotateLeft) {
        rotation.setFromAxisAngle(new Vector3(0, 0, 1), delta)
        this.player.quaternion.multiply(rotation)
      }
      if (this.rotateRight) {
        rotation.setFromAxisAngle(new Vector3(0, 0, 1), -delta)
        this.player.quaternion.multiply(rotation)
      }
    }
  }

  protected updateVelocity (delta: number) {
    this.velocity.set(0, 0, 0)
    if (this.moveForward) {
      this.velocity.add(new Vector3(0, 0, 1))
    }
    if (this.moveBackward) {
      this.velocity.add(new Vector3(0, 0, -1))
    }
    if (this.moveLeft) {
      this.velocity.add(new Vector3(-1, 0, 0))
    }
    if (this.moveRight) {
      this.velocity.add(new Vector3(1, 0, 0))
    }
    if (this.freeMovement) {
      if (this.moveUp) {
        this.velocity.add(new Vector3(0, 1, 0))
      }
      if (this.moveDown) {
        this.velocity.add(new Vector3(0, -1, 0))
      }
    }
    if (this.velocity.lengthSq() > 0) {
      this.velocity.normalize()
    }
  }

  private onMouseMove (e: MouseEvent) {
    this.rotationSpeedX += 4 * (e.movementX || (e as any).mozMovementX || (e as any).webkitMovementX || 0)
    if (this.freeMovement) {
      this.rotationSpeedY += 4 * (e.movementY || (e as any).mozMovementY || (e as any).webkitMovementY || 0)
    }
  }

  private onKeyDown (e: KeyboardEvent) {
    this.active = true
    switch (e.keyCode) {
      case 65:
        this.moveLeft = true
        break
      case 68:
        this.moveRight = true
        break
      case 87:
        this.moveForward = true
        break
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
      case 65:
        this.moveLeft = false
        break
      case 68:
        this.moveRight = false
        break
      case 87:
        this.moveForward = false
        break
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

  private lockChange() {
    if (document.pointerLockElement === this.domElement ||
      (document as any).mozPointerLockElement === this.domElement ||
      (document as any).webkitPointerLockElement === this.domElement) {
      document.addEventListener('mousemove', this.onMouseMove, false)
    }
    else {
      document.removeEventListener('mousemove', this.onMouseMove, false)
    }

    this.active = true
  }
}
