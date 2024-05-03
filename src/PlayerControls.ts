import { Player } from './Player'
import { Vector3 } from 'three'
import { Action } from './Action'

export abstract class PlayerControls {
  protected velocity = new Vector3()

  protected freeMovement = false

  enabled = false
  public enableAction = new Action()
  public disableAction = new Action()

  constructor(
    protected readonly player: Player
  ) {}

  protected abstract onEnable(): Promise<void> | void
  protected abstract onDisable(): Promise<void> | void

  public async enable () {
    if (this.enabled) {
      return
    }

    await this.onEnable()

    this.enabled = true
    this.enableAction.dispatch(undefined)
  }

  public async disable () {
    if (!this.enabled) {
      return
    }

    await this.onDisable()

    this.enabled = false
    this.disableAction.dispatch(undefined)
  }

  protected abstract updateOrientation (delta: number): void
  protected abstract updateVelocity (delta: number): void
  protected beforeUpdate (_delta: number) {}
  protected afterUpdate (_delta: number) {}

  public update (delta: number) {
    if (!this.enabled) {
      return
    }

    this.beforeUpdate(delta)
    this.updateOrientation(delta)
    this.updateVelocity(delta)
    this.afterUpdate(delta)

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
