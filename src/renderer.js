var THREE = require("three");

var SceneRenderer = require("./renderer/scenerenderer");
var DiagramRenderer = require("./renderer/diagramrenderer");

function Renderer(container, space, diagramMax) {
  this._webglRenderer = new THREE.WebGLRenderer();

  this._webglRenderer.autoClear = false;

  this.showDiagram = true;

  container.appendChild(this._webglRenderer.domElement);

  this._container = container;
  this._space = space;

  this._sceneRenderer = new SceneRenderer(space, this._getWidth(), this._getHeight());
  this._diagramRenderer = new DiagramRenderer(space, diagramMax);

  this.resize();
}

Renderer.prototype = {

  _getWidth: function() {
    return this._container.clientWidth;
  },

  _getHeight: function() {
    return this._container.clientHeight;
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
