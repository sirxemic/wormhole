import { WormholeGeometry } from './wormholegeometry'
import { WormholeSpace } from '../wormholespace'
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
  TextureLoader,
  MirroredRepeatWrapping,
  ShaderMaterial,
  DoubleSide,
  AdditiveBlending
} from 'three'

import vertexShader from '../shaders/diagram.vs.glsl'
import fragmentShader from '../shaders/diagram.fs.glsl'

const normal = new Vector3()
const tangent = new Vector3()
const bitangent = new Vector3()

export class DiagramRenderer {
  scene = new Scene()
  camera = new PerspectiveCamera(60, 1, 1, 1000)
  geometry: WormholeGeometry
  player = new Object3D()

  wormholeMesh: Mesh
  dotMesh: Mesh
  directionMesh: Mesh

  constructor (
    private readonly space: WormholeSpace,
    private readonly limit: number
  ) {
    this.camera.up.set(0, 0, 1)

    this.geometry = new WormholeGeometry(space, -limit, limit)

    const playerMaterial = new MeshBasicMaterial()

    this.dotMesh = new Mesh(
      new SphereGeometry(0.1, 32, 32),
      playerMaterial
    )
    this.player.add(this.dotMesh);
    this.directionMesh = new Mesh(
      new BoxGeometry(0.1, 0.1, 0.4),
      playerMaterial
    )
    this.directionMesh.position.z = -0.2
    this.player.add(this.directionMesh)
    this.scene.add(this.player)

    const loader = new TextureLoader()
    const gridTexture = loader.load('textures/grid.png')

    gridTexture.anisotropy = 4
    gridTexture.wrapS = MirroredRepeatWrapping
    gridTexture.wrapT = MirroredRepeatWrapping

    const material = new ShaderMaterial({
      uniforms: {
        map: {
          type: "t",
          value: gridTexture
        }
      },
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false
    });

    this.wormholeMesh = new Mesh(this.geometry, material);

    this.scene.add(this.wormholeMesh);
  }

  setRatio (ratio: number) {
    this.camera.aspect = ratio;
    this.camera.updateProjectionMatrix();
  }

  render (renderer: WebGLRenderer, object: Object3D) {
    const point = this.geometry.getPoint(object.position.x, object.position.z)

    const radius = Math.sqrt(point.x * point.x + point.y * point.y)

    const scale = this.limit + 1
    this.camera.position.set(point.x / radius * scale, point.y / radius * scale, 0)
    this.camera.lookAt(point)

    this.player.position.copy(point)

    // Create and set a base rotation matrix
    this.geometry.getNormal(object.position.x, object.position.z, normal)
    this.geometry.getXTangent(object.position.x, object.position.z, tangent)
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

    this.player.quaternion.setFromRotationMatrix(rotationMatrix)

    // Rotate player visualization accordingly
    this.player.rotateY(object.rotation.x)
    this.player.rotateX(object.rotation.y)

    renderer.render(this.scene, this.camera)
  }
}
