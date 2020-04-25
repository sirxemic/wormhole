import { Player } from './player'
import { Vector3 } from 'three';

export abstract class PlayerControls
{
  protected velocity = new Vector3()
  protected rotationSpeedX = 0
  protected rotationSpeedY = 0
  protected active = false

  public freeMovement = false

  constructor(
    protected readonly player: Player,
    protected readonly domElement: HTMLElement
  ) {}

  protected abstract updateOrientation (delta: number): void
  protected abstract updateVelocity (delta: number): void

  public update (delta: number) {
    if (!this.active) {
      return
    }

    this.updateOrientation(delta)
    this.updateVelocity(delta)

    if (this.velocity.lengthSq() > 0) {
      this.player.move(this.velocity.clone().multiplyScalar(delta))
    }
  }
}
