import { PixelShaderRenderer } from './renderer/PixelShaderRenderer'

import { glProfile } from './util/glSupport'
import { WormholeSpace } from './WormholeSpace'
import {
  Vector2,
  Vector3,
  Matrix4,
  Quaternion,
  WebGLRenderTarget,
  CubeTexture,
  CubeTextureLoader,
  ClampToEdgeWrapping,
  RGBAFormat,
  RawShaderMaterial,
  WebGLRenderer,
  HalfFloatType,
  Mesh,
  PerspectiveCamera,
  Scene,
  Camera,
  Vector4,
  PlaneGeometry,
  MeshBasicMaterial
} from 'three'

import integrationVertexShader from './shaders/integration.vs.glsl'
import integrationFragmentShader from './shaders/integration.fs.glsl'
import renderVertexShader from './shaders/render.vs.glsl'
import renderFragmentShader from './shaders/render.fs.glsl'
import { generateMipmaps } from './util/mipmaps'
import { Player } from './Player'
import { UnitXNeg } from './MathUtils'

function loadSkybox(path: string) {
  const files = [
    'sky_pos_x', 'sky_neg_x',
    'sky_pos_y', 'sky_neg_y',
    'sky_pos_z', 'sky_neg_z'
  ].map(file => {
    return new URL(`./textures/${path}/${file}.jpg`, import.meta.url).href
  })

  const cubeTexture = new CubeTextureLoader()
    .load(files, async () => {
      const images = cubeTexture.images as HTMLImageElement[]
      const mipmapImageData = await Promise.all(images.map(generateMipmaps))
      const mipmapCount = mipmapImageData[0].length
      cubeTexture.mipmaps = []
      for (let i = 0; i < mipmapCount; i++) {
        cubeTexture.mipmaps.push((new CubeTexture([
          mipmapImageData[0][i],
          mipmapImageData[1][i],
          mipmapImageData[2][i],
          mipmapImageData[3][i],
          mipmapImageData[4][i],
          mipmapImageData[5][i]
        ]) as unknown) as ImageData)
      }
      cubeTexture.generateMipmaps = false
      cubeTexture.needsUpdate = true
    })
  return cubeTexture
}

const tempTranslation = new Vector3()
const tempQuaternion = new Quaternion()
const tempScale = new Vector3()
const inverseMatrix = new Matrix4()
const orientationMatrix = new Matrix4()
const aspectFixMatrix = new Matrix4()

export class World extends Mesh {
  commonUniforms: any
  integrationBuffer: WebGLRenderTarget
  integrationStep: PixelShaderRenderer
  renderResultBuffer: WebGLRenderTarget
  renderStep: PixelShaderRenderer

  constructor(
    readonly space: WormholeSpace,
    readonly player: Player
  ) {
    super()

    this.frustumCulled = false

    // Init skybox textures
    const skybox1 = loadSkybox('skybox1')
    const skybox2 = loadSkybox('skybox2')

    // Init uniforms
    this.commonUniforms = {
      uRadiusSquared: { type: 'f', value: space.radiusSquared },
      uThroatLength: { type: 'f', value: space.throatLength },
      uCameraPosition: { type: 'v3', value: new Vector3() },
      uCameraOrientation: { type: 'm4', value: new Matrix4() },
      uAngleRange: { type: 'v2', value: new Vector2() },
    }

    // Init defines
    const commonDefines = {
      RENDER_TO_FLOAT_TEXTURE: ~~(glProfile.renderTargetType === HalfFloatType)
    }

    // Init integration stuff
    // Quirk: some older GPUs do not support rendering to textures with a side of 1, 2, 4 or 8 pixels long.
    // To keep the performance high, we lower the resolution for those GPUs as well
    const width = glProfile.smallPotRendering ? 2048 : 1024
    const height = glProfile.smallPotRendering ? 1 : 3

    this.integrationBuffer = new WebGLRenderTarget(width, height, {
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      format: RGBAFormat,
      type: glProfile.renderTargetType,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false
    })

    const integrationShader = new RawShaderMaterial({
      uniforms: { ...this.commonUniforms },
      defines: commonDefines,
      vertexShader: integrationVertexShader,
      fragmentShader: integrationFragmentShader
    })

    this.integrationStep = new PixelShaderRenderer(integrationShader, this.integrationBuffer)

    // Init render stuff
    const renderShader = new RawShaderMaterial({
      uniforms: {
        uIntegrationBuffer: { type: 't', value: this.integrationBuffer.texture },
        uSkybox1: { type: 't', value: skybox1 },
        uSkybox2: { type: 't', value: skybox2 },
        ...this.commonUniforms
      },
      defines: commonDefines,
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader
    })

    this.renderResultBuffer = new WebGLRenderTarget(1024, 1024, {
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
      type: HalfFloatType
    })

    this.renderStep = new PixelShaderRenderer(renderShader, this.renderResultBuffer)

    this.onBeforeRender = this.beforeRender.bind(this)

    this.geometry = new PlaneGeometry( 2, 2, 32, 32 )
    this.material = new MeshBasicMaterial({
      map: this.renderResultBuffer.texture,
      depthWrite: false
    })

    this.renderOrder = -1
  }

  beforeRender (renderer: WebGLRenderer, _scene: Scene, currentCamera: Camera) {
    const camera = currentCamera as PerspectiveCamera

    // Gotta decompose, get the inverse and aspect manually because the matrices of "XR cameras" are changed
    // directly, without updating all these things
    camera.matrixWorld.decompose(tempTranslation, tempQuaternion, tempScale)
    inverseMatrix.copy(camera.projectionMatrix).invert()

    const e0 = inverseMatrix.elements[0]
    const e5 = inverseMatrix.elements[5]
    const aspect = e0 / e5

    aspectFixMatrix.elements[0] = e0
    aspectFixMatrix.elements[5] = e5

    this.position.copy(tempTranslation)
    this.quaternion.copy(tempQuaternion)
    this.scale.set(e0, e5, 1)
    this.translateZ(-1)
    this.updateMatrixWorld()

    // Only compute for the left eye and reuse for the right eye
    if (camera.layers.mask & 4) {
      return
    }

    // Update the angle range
    orientationMatrix.makeRotationFromQuaternion(tempQuaternion)

    const zAxis = new Vector3()
    zAxis.setFromMatrixColumn(orientationMatrix, 2)

    const angleFromZ = zAxis.angleTo(UnitXNeg)

    const halfDiagFov = Math.atan(e5 * Math.sqrt(aspect * aspect + 1))
    this.commonUniforms.uAngleRange.value.set(
      Math.max(0, angleFromZ - halfDiagFov),
      Math.min(Math.PI, angleFromZ + halfDiagFov)
    )

    // Update the camera-related uniforms
    this.commonUniforms.uCameraPosition.value.copy(this.player.position)
    this.commonUniforms.uCameraOrientation.value.copy(orientationMatrix)
    this.commonUniforms.uCameraOrientation.value.multiply(aspectFixMatrix)

    this.integrationStep.render(renderer)
    this.renderStep.render(renderer)

    // WebXR cameras have viewports which need to be restored
    const viewport = (currentCamera as any).viewport as Vector4
    if (viewport) {
      renderer.state.viewport(viewport)
    }
  }

  setSize (width: number, height: number) {
    this.renderResultBuffer.setSize(width, height)
  }
}
