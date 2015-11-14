function WormholeGeometry(space, min, max)
{
  THREE.Geometry.call(this);

  this._space = space;

  this._build(min, max);
}

WormholeGeometry.prototype = Object.create(THREE.Geometry.prototype);

WormholeGeometry.prototype._build = function(min, max) {
  var xSegments = 80,
      ySegments = 32,
      xSegmentSize = (max - min) / xSegments,
      ySegmentSize = Math.PI * 2 / ySegments;

  var arrayIndex, i, j, uvs = [], normals = [];

  arrayIndex = 0;
  for (j = 0; j <= ySegments; j++) {
    for (i = 0; i <= xSegments; i++) {
      var u = min + i * xSegmentSize;
      var v = max + j * ySegmentSize;

      uvs[arrayIndex] = new THREE.Vector2(u, v);

      var vertex = this.getPoint(u, v, vertex);
      this.vertices[arrayIndex] = vertex;

      var normal = this.getNormal(u, v, normal);
      normals[arrayIndex] = normal;

      arrayIndex++;
    }
  }

  arrayIndex = 0;
  for (j = 1; j <= ySegments; j++) {
    for (i = 1; i <= xSegments; i++) {
      var a = (xSegments + 1) * j + i - 1;
      var b = (xSegments + 1) * (j - 1) + i - 1;
      var c = (xSegments + 1) * (j - 1) + i;
      var d = (xSegments + 1) * j + i;

      this.faces[arrayIndex] = new THREE.Face3(b, a, d, [normals[ b ].clone(), normals[ a ].clone(), normals[ d ].clone()]);
      this.faceVertexUvs[ 0 ][arrayIndex] = [uvs[ b ].clone(), uvs[ a ].clone(), uvs[ d ].clone()];

      arrayIndex++

      this.faces[arrayIndex] = new THREE.Face3(b, d, c, [normals[ b ].clone(), normals[ d ].clone(), normals[ c ].clone()]);
      this.faceVertexUvs[ 0 ][arrayIndex] = [uvs[ b ].clone(), uvs[ d ].clone(), uvs[ c ].clone()];

      arrayIndex++;
    }
  }

  this.computeFaceNormals();

  this.verticesNeedUpdate = true;
  this.normalsNeedUpdate = true;
  this.uvsNeedUpdate = true;
};

WormholeGeometry.prototype.getPoint = function(x, y) {
  var distanceToThroat = Math.abs(x) - this._space.throatLength;

  if (distanceToThroat >= 0.0) {
    var distance = Math.sqrt(distanceToThroat * distanceToThroat + this._space.radiusSquared),
        ratio = distance / this._space.radius;

    var result = new THREE.Vector3(
      distance * Math.cos(y),
      distance * Math.sin(y),
      this._space.throatLength + this._space.radius * Math.log(ratio + Math.sqrt(ratio * ratio - 1.0))
    );

    if (x < 0) {
      result.z *= -1.0;
    }

    return result;
  }
  else {
    return new THREE.Vector3(
      this._space.radius * Math.cos(y),
      this._space.radius * Math.sin(y),
      x
    );
  }
};

WormholeGeometry.prototype.getXTangent = function(x, y) {
  var distanceToThroat = Math.max(Math.abs(x) - this._space.throatLength, 0);

  var derivX = new THREE.Vector3(
    distanceToThroat * Math.cos(y) * (x < 0.0 ? -1.0 : 1.0),
    distanceToThroat * Math.sin(y) * (x < 0.0 ? -1.0 : 1.0),
    this._space.radius
  );

  return derivX.normalize();
};

WormholeGeometry.prototype.getNormal = function(x, y) {
  var distanceToThroat = Math.abs(x) - this._space.throatLength;

  if (distanceToThroat >= 0.0) {
    var distance = Math.sqrt(distanceToThroat * distanceToThroat + this._space.radiusSquared);

    var derivX = new THREE.Vector3(
      distanceToThroat * Math.cos(y) * (x < 0.0 ? -1.0 : 1.0),
      distanceToThroat * Math.sin(y) * (x < 0.0 ? -1.0 : 1.0),
      this._space.radius
    );

    derivX.divideScalar(distance);

    var derivY = new THREE.Vector3(
      -distance * Math.sin(y),
      distance * Math.cos(y),
      0.0
    );

    return (new THREE.Vector3).crossVectors(derivY, derivX).normalize();
  }
  else {
    return new THREE.Vector3(
      Math.cos(y),
      Math.sin(y),
      0.0
    );
  }
};

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
    vertexShader: [
      "varying vec2 vCoordinate;",
      "varying float vPixelPos;",
      "void main() {",
        "vCoordinate = uv;",
        "vec4 vertex = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "vPixelPos = length(vertex.xy) / vertex.w;",
        "gl_Position = vertex;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D map;",
      "varying vec2 vCoordinate;",
      "varying float vPixelPos;",
      "void main() {",
        "vec2 uv = vec2(",
          "vCoordinate.x * 0.8,",
          "vCoordinate.y * 4.0 * 0.15915494309",
        ");",
        "vec4 color = texture2D(map, uv);",
        "color.rgb *= (1.0 - vPixelPos);",
        "gl_FragColor = color;",
      "}",
    ].join("\n"),
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
