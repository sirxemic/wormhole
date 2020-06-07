import {
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  RawShaderMaterial,
  RenderTarget
} from 'three'
import { FullScreenMesh } from './FullScreenMesh'

export class PixelShaderRenderer {
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private scene = new Scene()

  public constructor(
    shaderMaterial: RawShaderMaterial,
    readonly renderTarget: RenderTarget
  ) {
    this.scene.add(new FullScreenMesh(shaderMaterial))
  }

  public render(renderer: WebGLRenderer) {
    const previousRenderTarget = renderer.getRenderTarget()
    const previousXrEnabled = renderer.xr.enabled

    renderer.setRenderTarget(this.renderTarget)
    renderer.xr.enabled = false
    renderer.shadowMap.autoUpdate = false

		renderer.state.buffers.depth.setMask(true)

		if (renderer.autoClear === false) {
      renderer.clear()
    }

    renderer.render(this.scene, this.camera)

    renderer.xr.enabled = previousXrEnabled
    renderer.setRenderTarget(previousRenderTarget)
  }
}
