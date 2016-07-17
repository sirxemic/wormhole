var THREE = require("three");

var WormholeGeometry = require("./wormholegeometry");

function DiagramRenderer(space, limit)
{
  this._scene = new THREE.Scene;
  this._camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
  this._camera.up.set(0, 0, 1);

  this._limit = limit;

  this._geometry = new WormholeGeometry(space, -limit, limit);

  var playerMaterial = new THREE.MeshBasicMaterial;

  this._player = new THREE.Object3D;

  this._dotMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    playerMaterial
  );
  this._player.add(this._dotMesh);
  this._directionMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.4),
    playerMaterial
  );
  this._directionMesh.position.z = -0.2;
  this._player.add(this._directionMesh);
  this._scene.add(this._player);

  var loader = new THREE.TextureLoader();
  var gridTexture = loader.load("textures/grid.png");

  gridTexture.anisotropy = 4;
  gridTexture.wrapS = THREE.MirroredRepeatWrapping;
  gridTexture.wrapT = THREE.MirroredRepeatWrapping;

  var material = new THREE.ShaderMaterial({
    uniforms: {
      map: {
        type: "t",
        value: gridTexture
      }
    },
    vertexShader: require("../shaders/diagram.vs.glsl"),
    fragmentShader: require("../shaders/diagram.fs.glsl"),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false
  });

  this._wormholeMesh = new THREE.Mesh(this._geometry, material);

  this._scene.add(this._wormholeMesh);
}

DiagramRenderer.prototype = {

  setRatio: function(ratio) {
    this._camera.aspect = ratio;
    this._camera.updateProjectionMatrix();
  },

  render: function(renderer, object) {
    var point = this._geometry.getPoint(object.position.x, object.position.z);

    var radius = Math.sqrt(point.x * point.x + point.y * point.y);

    var scale = this._limit + 1;
    this._camera.position.set(point.x / radius * scale, point.y / radius * scale, 0);
    this._camera.lookAt(point);

    this._player.position.copy(point);

    // Create and set a base rotation matrix
    var normal = this._geometry.getNormal(object.position.x, object.position.z);
    var tangent = this._geometry.getXTangent(object.position.x, object.position.z);
    var bitangent = (new THREE.Vector3).crossVectors(normal, tangent);

    var rotationMatrix = new THREE.Matrix4;
    rotationMatrix.elements[0] = normal.x;
    rotationMatrix.elements[1] = normal.y;
    rotationMatrix.elements[2] = normal.z;

    rotationMatrix.elements[4] = tangent.x;
    rotationMatrix.elements[5] = tangent.y;
    rotationMatrix.elements[6] = tangent.z;

    rotationMatrix.elements[8] = bitangent.x;
    rotationMatrix.elements[9] = bitangent.y;
    rotationMatrix.elements[10] = bitangent.z;

    this._player.quaternion.setFromRotationMatrix(rotationMatrix);

    // Rotate player visualization accordingly
    this._player.rotateY(object.rotation.x);
    this._player.rotateX(object.rotation.y);

    renderer.render(this._scene, this._camera, null, false);
  }

};

module.exports = DiagramRenderer;
