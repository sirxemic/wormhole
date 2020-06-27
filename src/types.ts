import { PlayerControls } from './PlayerControls'
import { Renderer } from './Renderer'
import { Player } from './Player'

export type ControlScheme = 'desktop' | 'mobile' | 'vr'

export interface MainInterface {
  renderer: Renderer
  player: Player
  canvas: HTMLCanvasElement
  allControls: Record<ControlScheme, PlayerControls>
  currentControls?: PlayerControls
  setControls (scheme: ControlScheme): void
}
