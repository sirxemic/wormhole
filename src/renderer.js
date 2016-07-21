var THREE = require("three");

var SceneRenderer = require("./renderer/scenerenderer");
var DiagramRenderer = require("./renderer/diagramrenderer");

function Renderer(space, diagramMax) {
  this._webglRenderer = new THREE.WebGLRenderer();
  this._webglRenderer.setPixelRatio(window.devicePixelRatio);

  this._webglRenderer.autoClear = false;

  this.showDiagram = true;

  this.canvas = this._webglRenderer.domElement

  this._space = space;

  this._sceneRenderer = new SceneRenderer(space, this._getWidth(), this._getHeight());
  this._diagramRenderer = new DiagramRenderer(space, diagramMax);

  this.resize();

  window.addEventListener('resize', this.resize.bind(this), false);
}

Renderer.prototype = {

  _getWidth: function() {
    return window.innerWidth;
  },

  _getHeight: function() {
    return window.innerHeight;
  },

  render: function(camera) {
    this._webglRenderer.setViewport(0, 0, this._getWidth(), this._getHeight());
    this._sceneRenderer.render(this._webglRenderer, camera);

    if (this.showDiagram) {
      this._webglRenderer.setViewport(0, 0, this._getWidth() / 3, this._getHeight() / 3);
      this._webglRenderer.clearDepth();

      this._diagramRenderer.render(this._webglRenderer, camera);
    }
  },

  resize: function() {
    var width = this._getWidth(),
        height = this._getHeight();

    this._webglRenderer.setSize(width, height);

    this._sceneRenderer.setSize(width, height);

    this._diagramRenderer.setRatio(width / height);
  }
};

module.exports = Renderer;
