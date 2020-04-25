import { WebGLRenderer, Camera, Object3D } from 'three'
import { WormholeSpace } from './wormholespace'
import { SceneRenderer } from './renderer/scenerenderer'
import { DiagramRenderer } from './renderer/diagramrenderer'

export class Renderer
{
  webglRenderer = new WebGLRenderer
  showDiagram = true
  canvas: HTMLCanvasElement
  sceneRenderer: SceneRenderer
  diagramRenderer: DiagramRenderer

  constructor(space: WormholeSpace, diagramMax: number) {
    this.webglRenderer.setPixelRatio(window.devicePixelRatio)
    this.webglRenderer.autoClear = false

    this.showDiagram = true
    this.canvas = this.webglRenderer.domElement

    this.sceneRenderer = new SceneRenderer(space)
    this.diagramRenderer = new DiagramRenderer(space, diagramMax)
    this.resize()
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  getWidth () {
    return window.innerWidth
  }

  getHeight () {
    return window.innerHeight
  }

  render (camera: Object3D) {
    this.webglRenderer.setViewport(0, 0, this.getWidth(), this.getHeight())
    this.sceneRenderer.render(this.webglRenderer, camera)

    if (this.showDiagram) {
      this.webglRenderer.setViewport(0, 0, this.getWidth() / 3, this.getHeight() / 3)
      this.webglRenderer.clearDepth()

      this.diagramRenderer.render(this.webglRenderer, camera)
    }
  }

  resize () {
    const width = this.getWidth()
    const height = this.getHeight()

    this.webglRenderer.setSize(width, height)
    this.sceneRenderer.setSize(width, height)
    this.diagramRenderer.setRatio(width / height)
  }
}
