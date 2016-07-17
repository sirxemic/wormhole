var THREE = require("three");

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

module.exports = WormholeGeometry;
