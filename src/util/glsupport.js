var canvas = document.createElement('canvas');
var gl = canvas.getContext('webgl');
var texture = gl.createTexture();
var framebuffer = gl.createFramebuffer();

/**
 *  Returns whether rendering to floating point textures is supported.
 */
function floatRenderTargetSupported() {
  if (!gl.getExtension('OES_texture_float')) {
    return false;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16, 0, gl.RGBA, gl.FLOAT, null);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
    return false;
  }

  return true;
}

/**
 *  Returns whether rendering to textures with a side which is 1, 2, 4 or 8 pixels long is supported.
 */
function smallPOTRenderingSupported() {
  var texture = gl.createTexture();
  var framebuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
    return false;
  }

  return true;
}

module.exports = {
  floatRenderTargetSupported: floatRenderTargetSupported(),
  smallPOTRenderingSupported: smallPOTRenderingSupported()
};
