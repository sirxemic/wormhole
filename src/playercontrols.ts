import { Player } from './player'
import { Vector3 } from 'three';

export abstract class PlayerControls {
  protected velocity = new Vector3()

  protected freeMovement = false

  constructor(
    protected readonly player: Player
  ) {}

  public abstract enable (): void
  public abstract disable (): void

  protected abstract updateOrientation (delta: number): void
  protected abstract updateVelocity (delta: number): void

  public update (delta: number) {
    this.updateOrientation(delta)
    this.updateVelocity(delta)

    if (this.velocity.lengthSq() > 0) {
      this.player.move(this.velocity.clone().multiplyScalar(delta))
    }
  }

  public async requestFreeMovement () {
    this.freeMovement = true
  }

  public stopFreeMovement () {
    this.freeMovement = false
  }
}
