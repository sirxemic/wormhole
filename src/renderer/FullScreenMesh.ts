import { Mesh, PlaneBufferGeometry, Material } from 'three'

const geometry = new PlaneBufferGeometry(2, 2)
geometry.deleteAttribute('normal')

export class FullScreenMesh extends Mesh {
  constructor (material: Material) {
    super(geometry, material)
    this.frustumCulled = false
  }
}
