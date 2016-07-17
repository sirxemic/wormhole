var THREE = require("three");
var MathUtil = require("./mathutil");

function WormholeSpace(radius, throatLength)
{
  this.radius = radius;
  this.radiusSquared = radius * radius;
  this.throatLength = throatLength;
}

WormholeSpace.prototype = {

  // Adjust direction to spherical coordinates
  adjustCartesianDirection: function(position, direction) {
    var distanceToWormhole = Math.max(0, Math.abs(position.x) - this.throatLength);

    var r = Math.sqrt(distanceToWormhole * distanceToWormhole + this.radiusSquared);
    direction.y /= r;
    direction.z /= r * Math.sin(position.y);
  },

  // Adjust direction to cartesian coordinates
  adjustSphericalDirection: function(position, direction) {
    var distanceToWormhole = Math.max(0, Math.abs(position.x) - this.throatLength);

    var r = Math.sqrt(distanceToWormhole * distanceToWormhole + this.radiusSquared);
    direction.y *= r;
    direction.z *= r * Math.sin(position.y);
  },

  step: (function() {
    var deltaPosition = new THREE.Vector3;
    var deltaDirection = new THREE.Vector3;
    var deltaTetrad = new THREE.Vector3;

    var f = new THREE.Vector3;
    var Dfv = new THREE.Matrix3;
    var Dfx = new THREE.Matrix3;

    var g = new THREE.Vector3;
    var Dgv = new THREE.Matrix3;
    var Dgx = new THREE.Matrix3;
    var Dgt = new THREE.Matrix3;

    var deltaT1 = new THREE.Vector3,
        deltaT2 = new THREE.Vector3;

    var lhs = new THREE.Matrix3;
    var lhsInverse = new THREE.Matrix3;

    return function(object, direction, delta) {
      var position = object.position;
      var distanceToWormhole0 = Math.max(0, Math.abs(position.x) - this.throatLength);
      var radiusSquared = this.radiusSquared;

      var x = position.x / Math.abs(position.x) * distanceToWormhole0,
          y = position.y,
          dx = direction.x,
          dy = direction.y,
          dz = direction.z,
          x2 = x * x,
          dy2 = dy * dy,
          dz2 = dz * dz,
          siny = Math.sin(y),
          cosy = Math.cos(y),
          sin2y = Math.sin(2 * y),
          cos2y = Math.cos(2 * y),
          siny2 = siny * siny,
          cosysiny = cosy * siny,
          coty = 1 / Math.tan(y),
          cscy = 1 / siny,
          b2 = radiusSquared,
          ib2r2 = 1 / (b2 + x * x),
          ib2r22 = ib2r2 * ib2r2;

      // Integrate the position and direction
      f.set(
          x * (dy2 + siny2 * dz2),
          -2 * x * dx * dy * ib2r2 + cosysiny * dz2,
          -2 * x * dx * dz * ib2r2 - 2 * coty * dy * dz
      );

      Dfv.set(
                            0,          2 * dy * x,                  2 * dz * x * siny2,
          -2 * dy * x * ib2r2, -2 * dx * x * ib2r2,                          dz * sin2y,
          -2 * dz * x * ib2r2,      -2 * dz * coty, -2 * dx * x * ib2r2 - 2 * dy * coty
      );

      Dfx.set(
                         dy2 + dz2 * siny2,           dz2 * x * sin2y, 0,
          2 * dx * dy * (x2 - b2) * ib2r22,               dz2 * cos2y, 0,
          2 * dx * dz * (x2 - b2) * ib2r22, 2 * dy * dz * cscy * cscy, 0
      );

      lhs.identity();
      MathUtil.Matrix3.subtract(lhs, Dfv/*.clone()*/.multiplyScalar(delta));
      MathUtil.Matrix3.subtract(lhs, Dfx/*.clone()*/.multiplyScalar(delta * delta));
      MathUtil.Matrix3.getInverse(lhsInverse, lhs)

      deltaDirection.copy(f).addScaledVector(direction.clone().applyMatrix3(Dfx), delta).multiplyScalar(delta);
      deltaDirection.applyMatrix3(lhsInverse);

      deltaPosition.copy(direction.clone().add(deltaDirection).multiplyScalar(delta));

      // Integrate tetrad by using parallel transport
      if (object.__tetrad) {
        for (var i = 0; i < 2; i++) {
          var tetrad = object.__tetrad[i];

          var tx = tetrad.x,
              ty = tetrad.y,
              tz = tetrad.z;

          g.set(
              x * (dy * ty + siny2 * dz * tz),
              -x * (dx * ty + tx * dy) * ib2r2 + cosysiny * dz * tz,
              -x * (dx * tz + tx * dz) * ib2r2 - coty * (dy * tz + ty * dz)
          );

          Dgv.set(
                            0,          x * ty,              x * tz * siny2,
              -x * ty * ib2r2, -x * tx * ib2r2,               tz * cosysiny,
              -x * tz * ib2r2,      -tz * coty, -x * tx * ib2r2 - ty * coty
          );

          Dgx.set(
                             dy * ty + dz * tz * siny2,               dz * x * tz * sin2y, 0,
              (dy * tx + dx * ty) * (x2 - b2) * ib2r22,                   dz * tz * cos2y, 0,
              (dz * tx + dx * tz) * (x2 - b2) * ib2r22, (dz * ty + dy * tz) * cscy * cscy, 0
          );

          Dgt.set(
                            0,          dy * x,              dz * x * siny2,
              -dy * x * ib2r2, -dx * x * ib2r2,               dz * cosysiny,
              -dz * x * ib2r2,      -dz * coty, -dx * x * ib2r2 - dy * coty
          );

          lhs.identity();
          MathUtil.Matrix3.subtract(lhs, Dgt/*.clone()*/.multiplyScalar(delta));
          MathUtil.Matrix3.getInverse(lhsInverse, lhs)

          deltaT1.copy(deltaPosition).applyMatrix3(Dgx);
          deltaT2.copy(deltaDirection).applyMatrix3(Dgv);

          deltaTetrad.copy(g).add(deltaT1).add(deltaT2).multiplyScalar(delta).applyMatrix3(lhsInverse);

          tetrad.add(deltaTetrad);
        }
      }

      direction.add(deltaDirection);
      position.add(deltaPosition);
    };
  })(),

  quaternionToTetrad: (function() {
    var rotationMatrix = new THREE.Matrix4;

    return function(quaternion, tetrad) {
      rotationMatrix.makeRotationFromQuaternion(quaternion);

      tetrad[0].set(rotationMatrix.elements[0], rotationMatrix.elements[1], rotationMatrix.elements[2]);
      tetrad[1].set(rotationMatrix.elements[4], rotationMatrix.elements[5], rotationMatrix.elements[6]);
    };
  })(),

  tetradToQuaternion: (function() {
    var rotationMatrix = new THREE.Matrix4;

    return function(tetrad, quaternion) {
      tetrad[2].crossVectors(tetrad[0], tetrad[1]);
      //tetrad[1].crossVectors(tetrad[2], tetrad[0]);

      for (var i = 0; i < 3; i++) {
        tetrad[i].normalize();
      }

      rotationMatrix.elements[0] = tetrad[0].x;
      rotationMatrix.elements[1] = tetrad[0].y;
      rotationMatrix.elements[2] = tetrad[0].z;

      rotationMatrix.elements[4] = tetrad[1].x;
      rotationMatrix.elements[5] = tetrad[1].y;
      rotationMatrix.elements[6] = tetrad[1].z;

      rotationMatrix.elements[8] = tetrad[2].x;
      rotationMatrix.elements[9] = tetrad[2].y;
      rotationMatrix.elements[10] = tetrad[2].z;

      quaternion.setFromRotationMatrix(rotationMatrix).normalize();
    };
  })(),

  move: function(object, direction, distance)
  {
    this.adjustCartesianDirection(object.position, direction);

    if (object.quaternion) {
      if (!object.__tetrad) {
        object.__tetrad = [
          new THREE.Vector3,
          new THREE.Vector3,
          new THREE.Vector3
        ];
      }
      this.quaternionToTetrad(object.quaternion, object.__tetrad);

      this.adjustCartesianDirection(object.position, object.__tetrad[0]);
      this.adjustCartesianDirection(object.position, object.__tetrad[1]);
    }

    this.step(object, direction, distance);

    this.adjustSphericalDirection(object.position, direction);

    if (object.quaternion) {
      this.adjustSphericalDirection(object.position, object.__tetrad[0]);
      this.adjustSphericalDirection(object.position, object.__tetrad[1]);

      this.tetradToQuaternion(object.__tetrad, object.quaternion);
    }

    // Restrict polar coordinates
    object.position.z = object.position.z % (Math.PI * 2);
  }

};

module.exports = WormholeSpace;
