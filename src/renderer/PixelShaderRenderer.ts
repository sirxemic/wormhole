import {
  OrthographicCamera,
  Scene,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  Renderer,
  Material
} from 'three'

export class PixelShaderRenderer
{
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private scene = new Scene()

  public constructor(shaderMaterial: Material)
  {
    PixelShaderRenderer.initGeometry()

    var mesh = new Mesh(PixelShaderRenderer.geometry, shaderMaterial)
    mesh.frustumCulled = false
    this.scene.add(mesh)
  }

  public render(renderer: Renderer)
  {
    renderer.render(this.scene, this.camera)
  }

  private static geometry: BufferGeometry

  private static initGeometry () {
    if (this.geometry) {
      return
    }
    this.geometry = new BufferGeometry()
    const vertices = new BufferAttribute(new Float32Array([
      -1, -1,
      +1, +1,
      -1, +1,
      -1, -1,
      +1, -1,
      +1, +1
    ]), 2)
    this.geometry.addAttribute('position', vertices)
  }
}
