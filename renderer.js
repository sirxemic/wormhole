function Renderer(container, space) {
  var self = this;

  this._webglRenderer = new THREE.WebGLRenderer();
  container.appendChild(this._webglRenderer.domElement);

  this._container = container;
  this._space = space;

  this._sceneRenderer = new SceneRenderer(space, this._container.clientWidth, this._container.clientHeight);
  this._scaledRenderer = new ScaledRenderer(this._container.clientWidth, this._container.clientHeight, 4);

  this.resize();

  document.querySelector('.settings').addEventListener('change', function(event) {
    this._updateScale();

    event.target.blur();
  }.bind(this));
}

Renderer.prototype = {

  _updateScale: function() {
    var scale = parseInt(document.querySelector("[name=resolution]:checked").value);
    this._scaledRenderer.setScale(scale);
  },

  render: function(camera) {
    this._sceneRenderer.render(this._webglRenderer, camera, this._scaledRenderer.renderTarget);
    this._scaledRenderer.render(this._webglRenderer);
  },

  resize: function() {
    var width = this._container.clientWidth,
        height = this._container.clientHeight;

    this._webglRenderer.setSize(width, height);

    this._sceneRenderer.setSize(width, height);
    this._scaledRenderer.setSize(width, height);
  }
};
