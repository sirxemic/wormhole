/// <reference lib="webworker" />

function getMipmappedColor (factor: number, c00: number, c01: number, c10: number, c11: number) {
  let result = 0
  result += (c00 / 255) ** factor
  result += (c01 / 255) ** factor
  result += (c10 / 255) ** factor
  result += (c11 / 255) ** factor
  result /= 4
  return (result ** (1 / factor)) * 255
}

onmessage = (event) => {
  let sourceImageData = event.data as ImageData

  const result: ImageData[] = []

  let factor = 5

  while (sourceImageData.width > 1) {
    const size = sourceImageData.width / 2

    const newImageData = new ImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = x + y * size
        const j00 = x * 2 + y * 2 * size * 2
        const j01 = x * 2 + (y * 2 + 1) * size * 2
        const j10 = (x * 2 + 1) + y * 2 * size * 2
        const j11 = (x * 2 + 1) + (y * 2 + 1) * size * 2
        for (let c = 0; c < 3; c++) {
          newImageData.data[i * 4 + c] = getMipmappedColor(
            factor,
            sourceImageData.data[j00 * 4 + c],
            sourceImageData.data[j01 * 4 + c],
            sourceImageData.data[j10 * 4 + c],
            sourceImageData.data[j11 * 4 + c]
          )
        }

        newImageData.data[i * 4 + 3] = 255
      }
    }

    factor *= 0.75

    result.push(newImageData)

    sourceImageData = newImageData
  }

  postMessage(result, result.map(data => data.data.buffer))
}
