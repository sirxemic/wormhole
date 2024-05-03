import { WormholeGeometry } from './WormholeGeometry'
import { WormholeSpace } from '../WormholeSpace'
import {
  Scene,
  PerspectiveCamera,
  Object3D,
  MeshBasicMaterial,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  WebGLRenderer,
  Vector3,
  Matrix4,
  Quaternion,
  Euler,
  TextureLoader,
  MirroredRepeatWrapping,
  ShaderMaterial,
  DoubleSide,
  AdditiveBlending
} from 'three'

import vertexShader from '../shaders/diagram.vs.glsl'
import fragmentShader from '../shaders/diagram.fs.glsl'
import { Player } from '../Player'

const normal = new Vector3()
const tangent = new Vector3()
const bitangent = new Vector3()

export class DiagramRenderer {
  limit: number
  scene = new Scene()
  camera = new PerspectiveCamera(60, 1, 1, 1000)
  geometry: WormholeGeometry
  playerMesh = new Object3D()

  dotMesh: Mesh
  directionMesh: Mesh

  constructor (
    space: WormholeSpace,
    limit: number
  ) {
    this.limit = limit
    this.camera.up.set(0, 0, 1)

    this.geometry = new WormholeGeometry(space, -limit, limit)

    const playerMaterial = new MeshBasicMaterial()

    this.dotMesh = new Mesh(
      new SphereGeometry(0.1, 32, 32),
      playerMaterial
    )
    this.playerMesh.add(this.dotMesh);
    this.directionMesh = new Mesh(
      new BoxGeometry(0.1, 0.1, 0.4),
      playerMaterial
    )
    this.directionMesh.position.z = 0.2
    this.playerMesh.add(this.directionMesh)
    this.scene.add(this.playerMesh)

    const loader = new TextureLoader()
    const gridTexture = loader.load(new URL('../textures/grid.png', import.meta.url).href)

    gridTexture.anisotropy = 4
    gridTexture.wrapS = MirroredRepeatWrapping
    gridTexture.wrapT = MirroredRepeatWrapping

    const material = new ShaderMaterial({
      uniforms: {
        map: {
          // @ts-ignore
          type: 't',
          value: gridTexture
        }
      },
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false
    })

    this.scene.add(new Mesh(this.geometry, material))
  }

  setRatio (ratio: number) {
    this.camera.aspect = ratio
    this.camera.updateProjectionMatrix()
  }

  render (renderer: WebGLRenderer, player: Player) {
    const position = player.position
    const rotation = new Euler().setFromQuaternion(player.eyes.getWorldQuaternion(new Quaternion()))
    const point = this.geometry.getPoint(position.x, position.z)

    const radius = Math.sqrt(point.x * point.x + point.y * point.y)

    const scale = this.limit + 1
    this.camera.position.set(point.x / radius * scale, point.y / radius * scale, 0)
    this.camera.lookAt(point)

    this.playerMesh.position.copy(point)

    // Create and set a base rotation matrix
    this.geometry.getNormal(position.x, position.z, normal)
    this.geometry.getXTangent(position.x, position.z, tangent)
    bitangent.crossVectors(normal, tangent)

    const rotationMatrix = new Matrix4()
    rotationMatrix.elements[0] = normal.x
    rotationMatrix.elements[1] = normal.y
    rotationMatrix.elements[2] = normal.z

    rotationMatrix.elements[4] = tangent.x
    rotationMatrix.elements[5] = tangent.y
    rotationMatrix.elements[6] = tangent.z

    rotationMatrix.elements[8] = bitangent.x
    rotationMatrix.elements[9] = bitangent.y
    rotationMatrix.elements[10] = bitangent.z

    this.playerMesh.quaternion.setFromRotationMatrix(rotationMatrix)

    // Rotate player visualization accordingly
    this.playerMesh.rotateY(rotation.x)
    this.playerMesh.rotateX(rotation.y)

    renderer.render(this.scene, this.camera)
  }
}
