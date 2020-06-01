import { Geometry, Vector2, Face3, Vector3 } from 'three'
import { WormholeSpace } from '../WormholeSpace'

export class WormholeGeometry extends Geometry {
  constructor (
    private readonly space: WormholeSpace,
    min: number,
    max: number
  ) {
    super()

    this.build(min, max)
  }

  private build (min: number, max: number) {
    const xSegments = 80
    const ySegments = 32
    const xSegmentSize = (max - min) / xSegments
    const ySegmentSize = Math.PI * 2 / ySegments

    const uvs = [], normals = []

    let arrayIndex = 0
    for (let j = 0; j <= ySegments; j++) {
      for (let i = 0; i <= xSegments; i++) {
        const u = min + i * xSegmentSize
        const v = max + j * ySegmentSize

        uvs[arrayIndex] = new Vector2(u, v)
        normals[arrayIndex] = this.getNormal(u, v)
        this.vertices[arrayIndex] = this.getPoint(u, v)

        arrayIndex++;
      }
    }

    arrayIndex = 0;
    for (let j = 1; j <= ySegments; j++) {
      for (let i = 1; i <= xSegments; i++) {
        const a = (xSegments + 1) * j + i - 1
        const b = (xSegments + 1) * (j - 1) + i - 1
        const c = (xSegments + 1) * (j - 1) + i
        const d = (xSegments + 1) * j + i

        this.faces[arrayIndex] = new Face3(
          b, a, d,
          [
            normals[b].clone(),
            normals[a].clone(),
            normals[d].clone()
          ]
        )
        this.faceVertexUvs[0][arrayIndex] = [
          uvs[b].clone(),
          uvs[a].clone(),
          uvs[d].clone()
        ];

        arrayIndex++

        this.faces[arrayIndex] = new Face3(
          b, d, c,
          [
            normals[b].clone(),
            normals[d].clone(),
            normals[c].clone()
          ]
        )
        this.faceVertexUvs[0][arrayIndex] = [
          uvs[b].clone(),
          uvs[d].clone(),
          uvs[c].clone()
        ]

        arrayIndex++
      }
    }

    this.computeFaceNormals()

    this.verticesNeedUpdate = true
    this.normalsNeedUpdate = true
    this.uvsNeedUpdate = true
  }

  public getPoint (x: number, y: number, target = new Vector3()) {
    const distanceToThroat = Math.abs(x) - this.space.throatLength

    if (distanceToThroat < 0) {
      return target.set(
        this.space.radius * Math.cos(y),
        this.space.radius * Math.sin(y),
        x
      )
    }

    const distance = Math.sqrt(distanceToThroat * distanceToThroat + this.space.radiusSquared)
    const ratio = distance / this.space.radius

    target.set(
      distance * Math.cos(y),
      distance * Math.sin(y),
      this.space.throatLength + this.space.radius * Math.log(ratio + Math.sqrt(ratio * ratio - 1))
    )

    if (x < 0) {
      target.z *= -1
    }

    return target
  }

  public getXTangent (x: number, y: number, target = new Vector3()) {
    const distanceToThroat = Math.max(Math.abs(x) - this.space.throatLength, 0)

    target.set(
      distanceToThroat * Math.cos(y) * (x < 0.0 ? -1.0 : 1.0),
      distanceToThroat * Math.sin(y) * (x < 0.0 ? -1.0 : 1.0),
      this.space.radius
    )

    return target.normalize()
  }

  public getNormal (x: number, y: number, target = new Vector3()) {
    const distanceToThroat = Math.abs(x) - this.space.throatLength

    if (distanceToThroat < 0) {
      return target.set(
        Math.cos(y),
        Math.sin(y),
        0.0
      )
    }

    const distance = Math.sqrt(distanceToThroat * distanceToThroat + this.space.radiusSquared)

    const derivX = new Vector3(
      distanceToThroat * Math.cos(y) * (x < 0.0 ? -1.0 : 1.0),
      distanceToThroat * Math.sin(y) * (x < 0.0 ? -1.0 : 1.0),
      this.space.radius
    )

    derivX.divideScalar(distance)

    const derivY = new Vector3(
      -distance * Math.sin(y),
      distance * Math.cos(y),
      0.0
    )

    return target.crossVectors(derivY, derivX).normalize()
  }
}