function ScaledRenderer(width, height, pixelSize) {
  this._width = width;
  this._height = height;
  this._pixelSize = pixelSize;

  this.renderTarget = new THREE.WebGLRenderTarget(
    Math.floor(width / pixelSize),
    Math.floor(height / pixelSize),
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat
    }
  );

  this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  this._scene = new THREE.Scene();

  var geometry = new THREE.BufferGeometry();
  var vertices = new THREE.BufferAttribute(new Float32Array([
    -1.0, -1.0,
    -1.0, +1.0,
    +1.0, +1.0,
    -1.0, -1.0,
    +1.0, +1.0,
    +1.0, -1.0,
  ]), 2);

  geometry.addAttribute('position', vertices);

  var material = new THREE.RawShaderMaterial({
    uniforms: {
      tRendered: {
        type: "t",
        value: this.renderTarget
      }
    },
		vertexShader: [
      "precision highp float;",
      "attribute vec2 position;",
      "varying vec2 vUv;",
			"void main() {",
				"vUv = position * 0.5 + 0.5;",
				"gl_Position = vec4(position, 0.0, 1.0);",
			"}",
    ].join("\n"),

		fragmentShader: [
      "precision highp float;",
      "varying vec2 vUv;",
			"uniform sampler2D tRendered;",
			"void main() {",
				"gl_FragColor = texture2D(tRendered, vUv);",
			"}",
    ].join("\n"),
    side: THREE.DoubleSide,
  });

  var mesh = new THREE.Mesh(geometry, material);
  this._scene.add(mesh);
}

ScaledRenderer.prototype = {

  setSize: function(width, height) {
    this._width = width;
    this._height = height;

    this.renderTarget.setSize(
      Math.floor(this._width / this._pixelSize),
      Math.floor(this._height / this._pixelSize)
    );
  },

  setPixelSize: function(pixelSize) {
    this._pixelSize = pixelSize;

    this.renderTarget.setSize(
      Math.floor(this._width / this._pixelSize),
      Math.floor(this._height / this._pixelSize)
    );
  },

  render: function(renderer) {
    renderer.render(this._scene, this._camera);
  }

};

module.exports = ScaledRenderer;
