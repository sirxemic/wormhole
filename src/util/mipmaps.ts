import MipmapWorker from './mipmapWorker.ts?worker'

const mipmapCanvas = document.createElement('canvas')
const ctx = mipmapCanvas.getContext('2d')!

export async function generateMipmaps (image: HTMLImageElement): Promise<ImageData[]> {
  mipmapCanvas.width = mipmapCanvas.height = image.naturalWidth

  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, mipmapCanvas.width, mipmapCanvas.width)

  return new Promise<ImageData[]>((resolve) => {
    const worker = new MipmapWorker()
    worker.onmessage = (event) => {
      resolve(event.data as ImageData[])
    }
    worker.postMessage(imageData, [imageData.data.buffer])
  })
}
