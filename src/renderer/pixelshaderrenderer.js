var THREE = require("three");

function PixelShaderRenderer(shaderMaterial) {
  this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  this._scene = new THREE.Scene();

  function initGeometry() {
    var geometry = new THREE.BufferGeometry();

    var vertices = new THREE.BufferAttribute(new Float32Array([
      -1.0, -1.0,
      +1.0, +1.0,
      -1.0, +1.0,

      -1.0, -1.0,
      +1.0, -1.0,
      +1.0, +1.0,
    ]), 2);

    geometry.addAttribute('position', vertices);

    return geometry;
  }

  // Geometry never changes, so cache it.
  PixelShaderRenderer.__geometry = PixelShaderRenderer.__geometry || initGeometry();

  var mesh = new THREE.Mesh(PixelShaderRenderer.__geometry, shaderMaterial);
  mesh.frustumCulled = false;
  this._scene.add(mesh);
}

PixelShaderRenderer.prototype.render = function(renderer, renderTarget) {
  renderer.render(this._scene, this._camera, renderTarget);
};

module.exports = PixelShaderRenderer;
