import { WormholeSpace } from './wormholespace'
import { Object3D, Vector3 } from 'three'

export class Player extends Object3D
{
  public constructor (private readonly space: WormholeSpace) {
    super()
  }

  public move (velocity: Vector3) {
    var distance = velocity.length()
    velocity = velocity.clone().normalize().applyQuaternion(this.quaternion)
    this.space.move(this, velocity, distance)
  }
}
