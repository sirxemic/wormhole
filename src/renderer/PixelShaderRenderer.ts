import {
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  RawShaderMaterial,
  WebGLRenderTarget
} from 'three'
import { FullScreenMesh } from './FullScreenMesh'

export class PixelShaderRenderer {
  private camera = new OrthographicCamera()
  private scene = new Scene()

  public constructor(
    shaderMaterial: RawShaderMaterial,
    readonly renderTarget: WebGLRenderTarget
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

		if (!renderer.autoClear) {
      renderer.clear()
    }

    renderer.render(this.scene, this.camera)

    renderer.xr.enabled = previousXrEnabled
    renderer.setRenderTarget(previousRenderTarget)
  }
}
