import { HalfFloatType, UnsignedByteType } from 'three'

const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')!
const texture = gl.createTexture()
const framebuffer = gl.createFramebuffer()

const OES_texture_half_float = gl.getExtension('OES_texture_half_float')

/**
 * Returns whether rendering to floating point textures is supported.
 */
function getSupporedRenderTargetType() {
  const configs = [
    {
      extension: OES_texture_half_float,
      test: OES_texture_half_float?.HALF_FLOAT_OES,
      type: HalfFloatType
    }
  ]

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

  for (let config of configs) {
    if (!config.extension || !config.test) {
      continue
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16, 0, gl.RGBA, config.test, null)

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      return config.type
    }
  }

  return UnsignedByteType
}

/**
 * Returns whether rendering to textures with a side which is 1, 2, 4 or 8 pixels long is supported.
 */
function getSmallPOTRenderingSupported() {
  var texture = gl.createTexture()
  var framebuffer = gl.createFramebuffer()

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
    return false
  }

  return true
}

export const glProfile = {
  renderTargetType: getSupporedRenderTargetType(),
  smallPotRendering: getSmallPOTRenderingSupported()
}
