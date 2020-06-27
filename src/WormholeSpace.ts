import { Vector3, Quaternion, Matrix3, Matrix4 } from 'three'
import { Matrix3Util } from './MathUtils'

const deltaPosition = new Vector3()
const deltaDirection = new Vector3()
const deltaTetrad = new Vector3()

const f = new Vector3()
const Dfv = new Matrix3()
const Dfx = new Matrix3()

const g = new Vector3()
const Dgv = new Matrix3()
const Dgx = new Matrix3()
const Dgt = new Matrix3()

const deltaT1 = new Vector3()
const deltaT2 = new Vector3()

const lhs = new Matrix3()
const lhsInverse = new Matrix3()

const rotationMatrix = new Matrix4()

interface Movable {
  position: Vector3
  quaternion: Quaternion
  __tetrad?: Vector3[]
}

export class WormholeSpace {
  constructor (
    public readonly radius: number,
    public readonly throatLength: number
  ) {}

  get radiusSquared () {
    return this.radius * this.radius
  }

  // Adjust direction to spherical coordinates
  adjustCartesianDirection (position: Vector3, direction: Vector3) {
    const distanceToWormhole = Math.max(0, Math.abs(position.x) - this.throatLength)

    const r = Math.sqrt(distanceToWormhole * distanceToWormhole + this.radiusSquared)
    direction.y /= r
    direction.z /= r * Math.sin(position.y)
  }

  // Adjust direction to cartesian coordinates
  adjustSphericalDirection (position: Vector3, direction: Vector3) {
    const distanceToWormhole = Math.max(0, Math.abs(position.x) - this.throatLength)

    const r = Math.sqrt(distanceToWormhole * distanceToWormhole + this.radiusSquared)
    direction.y *= r
    direction.z *= r * Math.sin(position.y)
  }

  step (object: Movable, direction: Vector3, delta: number) {
    const position = object.position
    const distanceToWormhole0 = Math.max(0, Math.abs(position.x) - this.throatLength)
    const radiusSquared = this.radiusSquared

    const
      x = position.x / Math.abs(position.x) * distanceToWormhole0,
      y = position.y,
      dx = direction.x,
      dy = direction.y,
      dz = direction.z,
      x2 = x * x,
      dy2 = dy * dy,
      dz2 = dz * dz,
      siny = Math.sin(y),
      cosy = Math.cos(y),
      sin2y = Math.sin(2 * y),
      cos2y = Math.cos(2 * y),
      siny2 = siny * siny,
      cosysiny = cosy * siny,
      coty = 1 / Math.tan(y),
      cscy = 1 / siny,
      b2 = radiusSquared,
      ib2r2 = 1 / (b2 + x * x),
      ib2r22 = ib2r2 * ib2r2

    // Integrate the position and direction
    f.set(
        x * (dy2 + siny2 * dz2),
        -2 * x * dx * dy * ib2r2 + cosysiny * dz2,
        -2 * x * dx * dz * ib2r2 - 2 * coty * dy * dz
    );

    Dfv.set(
                          0,          2 * dy * x,                  2 * dz * x * siny2,
        -2 * dy * x * ib2r2, -2 * dx * x * ib2r2,                          dz * sin2y,
        -2 * dz * x * ib2r2,      -2 * dz * coty, -2 * dx * x * ib2r2 - 2 * dy * coty
    );

    Dfx.set(
                      dy2 + dz2 * siny2,           dz2 * x * sin2y, 0,
        2 * dx * dy * (x2 - b2) * ib2r22,               dz2 * cos2y, 0,
        2 * dx * dz * (x2 - b2) * ib2r22, 2 * dy * dz * cscy * cscy, 0
    );

    lhs.identity();
    Matrix3Util.subtract(lhs, Dfv/*.clone()*/.multiplyScalar(delta));
    Matrix3Util.subtract(lhs, Dfx/*.clone()*/.multiplyScalar(delta * delta));
    Matrix3Util.getInverse(lhsInverse, lhs)

    deltaDirection.copy(f).addScaledVector(direction.clone().applyMatrix3(Dfx), delta).multiplyScalar(delta);
    deltaDirection.applyMatrix3(lhsInverse);

    deltaPosition.copy(direction.clone().add(deltaDirection).multiplyScalar(delta));

    // Integrate tetrad by using parallel transport
    if (object.__tetrad) {
      for (let i = 0; i < 2; i++) {
        const tetrad = object.__tetrad[i]

        const tx = tetrad.x
        const ty = tetrad.y
        const tz = tetrad.z

        g.set(
            x * (dy * ty + siny2 * dz * tz),
            -x * (dx * ty + tx * dy) * ib2r2 + cosysiny * dz * tz,
            -x * (dx * tz + tx * dz) * ib2r2 - coty * (dy * tz + ty * dz)
        );

        Dgv.set(
                          0,          x * ty,              x * tz * siny2,
            -x * ty * ib2r2, -x * tx * ib2r2,               tz * cosysiny,
            -x * tz * ib2r2,      -tz * coty, -x * tx * ib2r2 - ty * coty
        );

        Dgx.set(
                          dy * ty + dz * tz * siny2,               dz * x * tz * sin2y, 0,
            (dy * tx + dx * ty) * (x2 - b2) * ib2r22,                   dz * tz * cos2y, 0,
            (dz * tx + dx * tz) * (x2 - b2) * ib2r22, (dz * ty + dy * tz) * cscy * cscy, 0
        );

        Dgt.set(
                          0,          dy * x,              dz * x * siny2,
            -dy * x * ib2r2, -dx * x * ib2r2,               dz * cosysiny,
            -dz * x * ib2r2,      -dz * coty, -dx * x * ib2r2 - dy * coty
        );

        lhs.identity()
        Matrix3Util.subtract(lhs, Dgt/*.clone()*/.multiplyScalar(delta))
        Matrix3Util.getInverse(lhsInverse, lhs)

        deltaT1.copy(deltaPosition).applyMatrix3(Dgx)
        deltaT2.copy(deltaDirection).applyMatrix3(Dgv)

        deltaTetrad.copy(g).add(deltaT1).add(deltaT2).multiplyScalar(delta).applyMatrix3(lhsInverse)

        tetrad.add(deltaTetrad)
      }
    }

    direction.add(deltaDirection)
    position.add(deltaPosition)
  }

  quaternionToTetrad (quaternion: Quaternion, tetrad: Vector3[]) {
    rotationMatrix.makeRotationFromQuaternion(quaternion);

    tetrad[0].set(rotationMatrix.elements[0], rotationMatrix.elements[1], rotationMatrix.elements[2])
    tetrad[1].set(rotationMatrix.elements[4], rotationMatrix.elements[5], rotationMatrix.elements[6])
  }

  tetradToQuaternion (tetrad: Vector3[], quaternion: Quaternion) {
    tetrad[2].crossVectors(tetrad[0], tetrad[1]);

    for (let i = 0; i < 3; i++) {
      tetrad[i].normalize();
    }

    rotationMatrix.elements[0] = tetrad[0].x
    rotationMatrix.elements[1] = tetrad[0].y
    rotationMatrix.elements[2] = tetrad[0].z

    rotationMatrix.elements[4] = tetrad[1].x
    rotationMatrix.elements[5] = tetrad[1].y
    rotationMatrix.elements[6] = tetrad[1].z

    rotationMatrix.elements[8] = tetrad[2].x
    rotationMatrix.elements[9] = tetrad[2].y
    rotationMatrix.elements[10] = tetrad[2].z

    quaternion.setFromRotationMatrix(rotationMatrix).normalize()
  }

  move (object: Movable, direction: Vector3, distance: number) {
    this.adjustCartesianDirection(object.position, direction)

    if (object.quaternion) {
      if (!object.__tetrad) {
        object.__tetrad = [
          new Vector3(),
          new Vector3(),
          new Vector3()
        ]
      }

      this.quaternionToTetrad(object.quaternion, object.__tetrad)

      this.adjustCartesianDirection(object.position, object.__tetrad[0])
      this.adjustCartesianDirection(object.position, object.__tetrad[1])
    }

    for (let i = 0; i < 10; i++) {
      this.step(object, direction, distance / 10)
    }

    this.adjustSphericalDirection(object.position, direction)

    if (object.quaternion) {
      this.adjustSphericalDirection(object.position, object.__tetrad![0])
      this.adjustSphericalDirection(object.position, object.__tetrad![1])

      this.tetradToQuaternion(object.__tetrad!, object.quaternion)
    }

    // Restrict polar coordinates
    object.position.z = object.position.z % (Math.PI * 2)
  }
}
