var THREE = require("three");

var PixelShaderRenderer = require('./pixelshaderrenderer');

function SceneRenderer(space) {

  // Init skybox textures
  function loadSkybox(path, ext) {
    ext = ext || "jpg";
    var files = [
      "sky_pos_x", "sky_neg_x",
      "sky_pos_y", "sky_neg_y",
      "sky_pos_z", "sky_neg_z"
    ].map(function(file) {
      return file + "." + ext;
    });

    return new THREE.CubeTextureLoader()
      .setPath(path)
      .load(files);
  }

  var skybox1 = loadSkybox("textures/skybox1/"),
      skybox2 = loadSkybox("textures/skybox2/");

  this.commonUniforms = {
    uRadiusSquared: { type: "f", value: space.radiusSquared },
    uThroatLength: { type: "f", value: space.throatLength },
    uCameraPosition: { type: "v3", value: new THREE.Vector3() },
    uCameraOrientation: { type: "m4", value: new THREE.Matrix4() },
  };

  this._integrationBuffer = new THREE.WebGLRenderTarget(2048, 1, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  });

  var integrationShader = new THREE.RawShaderMaterial({
    uniforms: Object.assign({}, this.commonUniforms),
    vertexShader: require('../shaders/integration.vs.glsl'),
    fragmentShader: require('../shaders/integration.fs.glsl')
  });

  this._integrationStep = new PixelShaderRenderer(integrationShader);

  var renderShader = new THREE.RawShaderMaterial({
    uniforms: Object.assign({
      uIntegrationBuffer: { type: "t", value: this._integrationBuffer },
      uSkybox1: { type: "t", value: skybox1 },
      uSkybox2: { type: "t", value: skybox2 }
    }, this.commonUniforms),
    vertexShader: require('../shaders/render.vs.glsl'),
    fragmentShader: require('../shaders/render.fs.glsl')
  });

  this._renderStep = new PixelShaderRenderer(renderShader);

  // Init variables required for rendering
  this._aspectFix = new THREE.Matrix4();
}

SceneRenderer.prototype = {

  render: function(renderer, camera) {
    this.commonUniforms.uCameraPosition.value.copy(camera.position);

    this.commonUniforms.uCameraOrientation.value.makeRotationFromQuaternion(camera.quaternion);
    this.commonUniforms.uCameraOrientation.value.multiply(this._aspectFix);

     this._integrationStep.render(renderer, this._integrationBuffer);

    this._renderStep.render(renderer);
  },

  setSize: function(width, height) {
    this._renderWidth = width;
    this._renderHeight = height;

    var vx, vy;
    if (width > height)
    {
      vx = width / height;
      vy = 1;
    }
    else
    {
      vx = 1;
      vy = height / width;
    }

    this._aspectFix.set(vx,  0, 0, 0,
                        0, vy, 0, 0,
                        0,  0, 2, 0,
                        0,  0, 0, 1);
  }

};

module.exports = SceneRenderer;
