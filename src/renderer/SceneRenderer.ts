import { PixelShaderRenderer } from './PixelShaderRenderer'

import { glProfile } from '../util/glSupport'
import { WormholeSpace } from '../WormholeSpace'
import {
  Vector2,
  Vector3,
  Matrix4,
  Quaternion,
  MathUtils,
  WebGLRenderTarget,
  CubeTexture,
  CubeTextureLoader,
  ClampToEdgeWrapping,
  RGBAFormat,
  FloatType,
  RawShaderMaterial,
  WebGLRenderer,
  HalfFloatType
} from 'three'

import integrationVertexShader from '../shaders/integration.vs.glsl'
import integrationFragmentShader from '../shaders/integration.fs.glsl'
import renderVertexShader from '../shaders/render.vs.glsl'
import renderFragmentShader from '../shaders/render.fs.glsl'
import { generateMipmaps } from '../util/mipmaps'
import { Player } from '../Player'
import { UnitXNeg } from '../MathUtils'

function loadSkybox(path: string, ext: string = 'jpg') {
  const files = [
    'sky_pos_x', 'sky_neg_x',
    'sky_pos_y', 'sky_neg_y',
    'sky_pos_z', 'sky_neg_z'
  ].map(file => file + '.' + ext)

  const cubeTexture = new CubeTextureLoader()
    .setPath(path)
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

const tempQuaternion = new Quaternion()
const orientationMatrix = new Matrix4()
const aspectFixMatrix = new Matrix4()

export class SceneRenderer {
  commonUniforms: any
  integrationBuffer: WebGLRenderTarget
  integrationStep: PixelShaderRenderer
  renderStep: PixelShaderRenderer

  constructor(space: WormholeSpace) {
    // Init skybox textures
    const skybox1 = loadSkybox('textures/skybox1/')
    const skybox2 = loadSkybox('textures/skybox2/')

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
      RENDER_TO_FLOAT_TEXTURE: ~~(glProfile.renderTargetType === FloatType || glProfile.renderTargetType === HalfFloatType)
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
      type: glProfile.renderTargetType
    })

    const integrationShader = new RawShaderMaterial({
      uniforms: { ...this.commonUniforms },
      defines: commonDefines,
      // Prepend with a newline as a workaround due to a js bug
      vertexShader: '\n' + integrationVertexShader,
      fragmentShader: '\n' + integrationFragmentShader
    })

    this.integrationStep = new PixelShaderRenderer(integrationShader)

    // Init render stuff
    const renderShader = new RawShaderMaterial({
      uniforms: {
        uIntegrationBuffer: { type: 't', value: this.integrationBuffer.texture },
        uSkybox1: { type: 't', value: skybox1 },
        uSkybox2: { type: 't', value: skybox2 },
        ...this.commonUniforms
      },
      defines: commonDefines,
      // Prepend with a newline as a workaround due to a js bug
      vertexShader: '\n' + renderVertexShader,
      fragmentShader: '\n' + renderFragmentShader
    })

    this.renderStep = new PixelShaderRenderer(renderShader)
  }

  render (renderer: WebGLRenderer, player: Player) {
    const camera = player.eyes

    aspectFixMatrix.elements[0] = camera.projectionMatrixInverse.elements[0]
    aspectFixMatrix.elements[5] = camera.projectionMatrixInverse.elements[5]

    // Update the angle range
    orientationMatrix.makeRotationFromQuaternion(camera.getWorldQuaternion(tempQuaternion))

    const zAxis = new Vector3()
    zAxis.setFromMatrixColumn(orientationMatrix, 2)

    const angleFromZ = zAxis.angleTo(UnitXNeg)

    const halfDiagFov = Math.atan(Math.tan(MathUtils.DEG2RAD * camera.fov / 2) * Math.sqrt(camera.aspect * camera.aspect + 1))
    this.commonUniforms.uAngleRange.value.set(
      Math.max(0, angleFromZ - halfDiagFov),
      Math.min(Math.PI, angleFromZ + halfDiagFov)
    )

    // Update the camera-related uniforms
    this.commonUniforms.uCameraPosition.value.copy(player.position)
    this.commonUniforms.uCameraOrientation.value.copy(orientationMatrix)
    this.commonUniforms.uCameraOrientation.value.multiply(aspectFixMatrix)

    // Integrate...
    renderer.setRenderTarget(this.integrationBuffer)
    this.integrationStep.render(renderer)
    renderer.setRenderTarget(null)

    // And render.
    this.renderStep.render(renderer)
  }

  setSize (width: number, height: number) {

  }
}
