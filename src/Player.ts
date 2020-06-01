import { WormholeSpace } from './WormholeSpace'
import { Object3D, Vector3, PerspectiveCamera } from 'three'

export class Player extends Object3D
{
  public readonly eyes = new PerspectiveCamera(60, 1, 0.1, 100)

  public constructor (private readonly space: WormholeSpace) {
    super()

    this.add(this.eyes)
  }

  public move (velocity: Vector3) {
    const distance = velocity.length()
    velocity = velocity.clone().normalize()
    this.space.move(this, velocity, distance)
  }
}
