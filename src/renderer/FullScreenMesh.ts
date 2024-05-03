import { Mesh, PlaneGeometry, Material } from 'three'

const geometry = new PlaneGeometry(2, 2)
geometry.deleteAttribute('normal')

export class FullScreenMesh extends Mesh {
  constructor (material: Material) {
    super(geometry, material)
    this.frustumCulled = false
  }
}
