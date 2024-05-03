import { Object3D, Mesh, MeshBasicMaterial, CanvasTexture, PlaneGeometry, DoubleSide, Quaternion, Vector3 } from 'three'
import { Player } from './Player'

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, lineWidth: number, lineHeight: number) {
  let line = ''
  const paragraphs = text.split('\n')
  for (let i = 0; i < paragraphs.length; i++) {
    const words = paragraphs[i].split(' ')
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      if (testWidth > lineWidth && n > 0) {
        ctx.fillText(line, x, y)
        line = words[n] + ' '
        y += lineHeight
      }
      else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)
    y += lineHeight
    line = ''
  }
}

const q1 = new Quaternion()
const v1 = new Vector3()

export class VRInstructions extends Object3D {
  mesh: Mesh

  material: MeshBasicMaterial
  targetOpacity: number
  resetPosition = true

  constructor (private player: Player) {
    super()
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    const ctx = canvas.getContext('2d')!
    ctx.font = '48px -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.beginPath()
    wrapText(ctx, 'Press the trigger button to move yourself towards the controller.', canvas.width / 2, 50, canvas.width, 50)

    this.material = new MeshBasicMaterial({
      map: new CanvasTexture(canvas),
      color: 0xffffff,
      transparent: true,
      side: DoubleSide
    })
    this.mesh = new Mesh(
      new PlaneGeometry(canvas.width / canvas.height * 2, 2),
      this.material
    )

    this.material.opacity = this.targetOpacity = 0

    this.add(this.mesh)

    this.mesh.position.set(0, 0, -10)
  }

  hide () {
    this.targetOpacity = 0
  }

  show () {
    this.resetPosition = true
    this.targetOpacity = 1
  }

  update (delta: number) {
    this.player.eyes.getWorldPosition(v1)
    this.player.eyes.getWorldQuaternion(q1)

    const amount = this.resetPosition ? 1 : 1 - Math.exp(-delta)
    this.position.lerp(v1, amount)
    this.quaternion.slerp(q1, amount)
    this.material.opacity += (this.targetOpacity - this.material.opacity) * (1 - Math.exp(-delta * 10))

    this.resetPosition = false
  }
}
