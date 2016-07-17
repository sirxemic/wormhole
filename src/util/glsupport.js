function floatRenderTargetSupported() {
  var canvas = document.createElement('canvas');
  var gl = canvas.getContext('webgl');

  if (!gl.getExtension('OES_texture_float')) {
    return false;
  }

  var texture = gl.createTexture();
  var framebuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
    return false;
  }

  return true;
}

module.exports = {
  floatRenderTargetSupported: floatRenderTargetSupported()
};
