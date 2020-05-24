import { WebGLRenderer, MathUtils } from 'three'
import { WormholeSpace } from './wormholespace'
import { SceneRenderer } from './renderer/scenerenderer'
import { DiagramRenderer } from './renderer/diagramrenderer'
import { Player } from './player'

export class Renderer
{
  showDiagram = true
  sceneRenderer: SceneRenderer
  diagramRenderer: DiagramRenderer

  constructor(
    readonly webglRenderer: WebGLRenderer,
    readonly space: WormholeSpace,
    readonly diagramMax: number,
    readonly player: Player
  ) {
    this.showDiagram = true

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

  render () {
    this.webglRenderer.setViewport(0, 0, this.getWidth(), this.getHeight())
    this.sceneRenderer.render(this.webglRenderer, this.player)

    if (this.showDiagram) {
      this.webglRenderer.setViewport(0, 0, this.getWidth() / 3, this.getHeight() / 3)
      this.webglRenderer.clearDepth()

      this.diagramRenderer.render(this.webglRenderer, this.player)
    }
  }

  resize () {
    const width = this.getWidth()
    const height = this.getHeight()

    this.webglRenderer.setSize(width, height)
    this.sceneRenderer.setSize(width, height)
    this.diagramRenderer.setRatio(width / height)

    this.player.eyes.aspect = width / height

    // When the screen is vertical, the horizontal fov needs to be 60 degrees instead
    const minFov = 60
    this.player.eyes.fov = this.player.eyes.aspect < 1
      ? 2 * MathUtils.RAD2DEG * Math.atan(Math.tan(minFov * 0.5 * MathUtils.DEG2RAD) / this.player.eyes.aspect)
      : minFov
    this.player.eyes.updateProjectionMatrix()
  }
}
