import { PlayerControls } from './PlayerControls'
import { Player } from './Player'
import { WebGLRenderer } from 'three'

export class PlayerControlsVr extends PlayerControls {
  private session: any

  public constructor (
    player: Player,
    readonly renderer: WebGLRenderer
  ) {
    super(player)

    this.disable = this.disable.bind(this)
  }

  public async enable () {
    const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] }
    this.session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit)
    this.session.addEventListener('end', this.disable)
    this.renderer.xr.setSession(this.session)
  }

  public disable () {
    if (!this.session) {
      return
    }

    this.session.removeEventListener('end', this.disable)
    this.session = null
  }

  protected updateOrientation (delta: number) {
  }

  protected updateVelocity (delta: number) {
  }
}
