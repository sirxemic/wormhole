import { Vector3, BufferGeometry, Float32BufferAttribute } from 'three'
import { WormholeSpace } from '../WormholeSpace'

export class WormholeGeometry extends BufferGeometry {
  constructor (
    private readonly space: WormholeSpace,
    min: number,
    max: number
  ) {
    super()

    this.build(min, max)
  }

  private build (min: number, max: number) {
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indexArray: number[] = []

    const xSegments = 80
    const ySegments = 32
    const xSegmentSize = (max - min) / xSegments
    const ySegmentSize = Math.PI * 2 / ySegments

    for (let j = 0; j <= ySegments; j++) {
      for (let i = 0; i <= xSegments; i++) {
        const u = min + i * xSegmentSize
        const v = max + j * ySegmentSize

        const normal = this.getNormal(u, v)
        const vertex = this.getPoint(u, v)

        uvs.push(u, v)
        normals.push(normal.x, normal.y, normal.z)
        vertices.push(vertex.x, vertex.y, vertex.z)
      }
    }

    for (let j = 1; j <= ySegments; j++) {
      for (let i = 1; i <= xSegments; i++) {
        const a = (xSegments + 1) * j + i - 1
        const b = (xSegments + 1) * (j - 1) + i - 1
        const c = (xSegments + 1) * (j - 1) + i
        const d = (xSegments + 1) * j + i

        indexArray.push(b, a, d)
        indexArray.push(b, d, c)
      }
    }

    this.setIndex(indexArray)
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3))
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
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
