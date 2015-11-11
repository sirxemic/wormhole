function Renderer(container, space) {
  var self = this;

  this._webglRenderer = new THREE.WebGLRenderer();
  container.appendChild(this._webglRenderer.domElement);

  this._container = container;
  this._space = space;

  this._sceneRenderer = new SceneRenderer(space, this._getWidth(), this._getHeight());
  this._scaledRenderer = new ScaledRenderer(this._getWidth(), this._getHeight(), this._getPixelSize());

  this.resize();

  document.querySelector('.renderer-settings').addEventListener('change', function(event) {
    this._updatePixelSize();

    event.target.blur();
  }.bind(this));
}

Renderer.prototype = {

  _getWidth: function() {
    return this._container.clientWidth;
  },

  _getHeight: function() {
    return this._container.clientHeight;
  },

  _getPixelSize: function() {
    return parseInt(document.querySelector("[name=resolution]:checked").value);
  },

  _updatePixelSize: function() {
    this._scaledRenderer.setPixelSize(this._getPixelSize());
  },

  render: function(camera) {
    this._sceneRenderer.render(this._webglRenderer, camera, this._scaledRenderer.renderTarget);
    this._scaledRenderer.render(this._webglRenderer);
  },

  resize: function() {
    var width = this._getWidth(),
        height = this._getHeight();

    this._webglRenderer.setSize(width, height);

    this._sceneRenderer.setSize(width, height);
    this._scaledRenderer.setSize(width, height);
  }
};
