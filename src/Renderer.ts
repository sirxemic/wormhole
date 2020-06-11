import { WebGLRenderer, MathUtils, Scene } from 'three'
import { WormholeSpace } from './WormholeSpace'
import { World } from './World'
import { DiagramRenderer } from './renderer/DiagramRenderer'
import { Player } from './Player'

export class Renderer {
  showDiagram = true
  world: World
  diagramRenderer: DiagramRenderer

  scene = new Scene()

  isXr = false

  constructor(
    readonly webglRenderer: WebGLRenderer,
    readonly space: WormholeSpace,
    readonly diagramMax: number,
    readonly player: Player
  ) {
    this.showDiagram = true

    this.world = new World(space, player)
    this.diagramRenderer = new DiagramRenderer(space, diagramMax)

    this.scene.add(this.world)

    this.resize()
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  getWidth () {
    return this.webglRenderer.xr.isPresenting ? 1024 : window.innerWidth
  }

  getHeight () {
    return this.webglRenderer.xr.isPresenting ? 1024 : window.innerHeight
  }

  render () {
    if (this.webglRenderer.xr.isPresenting) {
      if (!this.isXr) {
        this.resize()
        this.isXr = true
      }

      this.renderVr()
    } else {
      if (this.isXr) {
        this.resize()
        this.isXr = false
      }

      this.renderNormal()
    }
  }

  renderNormal () {
    this.webglRenderer.setViewport(0, 0, this.getWidth(), this.getHeight())
    this.webglRenderer.render(this.scene, this.player.eyes)

    if (this.showDiagram) {
      this.webglRenderer.setViewport(0, 0, this.getWidth() / 3, this.getHeight() / 3)
      this.webglRenderer.clearDepth()

      this.diagramRenderer.render(this.webglRenderer, this.player)
    }
  }

  renderVr () {
    this.webglRenderer.render(this.scene, this.player.eyes)
  }

  resize () {
    const width = this.getWidth()
    const height = this.getHeight()
    const pixelRatio = this.webglRenderer.getPixelRatio()
    const aspectRatio = width / height

    this.webglRenderer.setSize(width, height)
    this.world.setSize(width * pixelRatio, height * pixelRatio)
    this.diagramRenderer.setRatio(aspectRatio)

    this.player.eyes.aspect = aspectRatio

    // When the screen is vertical, the horizontal fov needs to be 60 degrees instead
    const minFov = 60
    this.player.eyes.fov = this.player.eyes.aspect < 1
      ? 2 * MathUtils.RAD2DEG * Math.atan(Math.tan(minFov * 0.5 * MathUtils.DEG2RAD) / this.player.eyes.aspect)
      : minFov
    this.player.eyes.updateProjectionMatrix()
  }
}
