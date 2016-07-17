var THREE = require("three");

var PlayerControls = require('./playercontrols');

function PlayerControlsTouch(player, domElement)
{
  PlayerControls.apply(this, arguments);

  var self = this;

  var currentTouches = {};

  var velocityTouches = {};
  this._targetVelocity = new THREE.Vector3;

  domElement.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  }, false);

  domElement.addEventListener('touchstart', touchStart, false);
  domElement.addEventListener('touchmove', touchMove, false);
  domElement.addEventListener('touchend', touchEnd, false);
  domElement.addEventListener('touchcancel', touchEnd, false);

  function touchStart(event) {
    // A touch is a sign that touch controls can be used.
    self.active = true;

    for (var touch, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i];

      currentTouches[touch.identifier] = {
        start: {
          x: touch.clientX,
          y: touch.clientY
        },
        previous: {
          x: touch.clientX,
          y: touch.clientY
        },
        current: {
          x: touch.clientX,
          y: touch.clientY
        }
      };
    }
  }

  function addRotationSpeed(touch) {
    var touchInfo = currentTouches[touch.identifier];

    self.rotationSpeedX -= 4 * (touchInfo.current.x - touchInfo.previous.x) / domElement.clientHeight;
  }

  function addVelocityTouch(touch) {
    var touchInfo = currentTouches[touch.identifier];

    var speed = -4 * (touchInfo.current.y - touchInfo.start.y) / domElement.clientHeight;

    self._targetVelocity.set(0, 0, speed);

    velocityTouches[touch.identifier] = true;
  }

  function removeVelocityTouch(touch) {
    delete velocityTouches[touch.identifier];

    if (Object.keys(velocityTouches).length === 0) {
      self._targetVelocity.set(0, 0, 0);
    }
  }

  function touchMove(event) {
    for (var touch, touchInfo, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i];
      touchInfo = currentTouches[touch.identifier];

      touchInfo.previous = touchInfo.current;
      touchInfo.current = {
        x: touch.clientX,
        y: touch.clientY
      };

      var dxTotal = touchInfo.current.x - touchInfo.start.x;
      var dyTotal = touchInfo.current.y - touchInfo.start.y;

      if (Math.abs(dxTotal) > Math.abs(dyTotal)) {
        addRotationSpeed(touch);

        // This touch is no longer moving the player forward
        removeVelocityTouch(touch);
      }
      else {
        addVelocityTouch(touch);
      }
    }
  }

  function touchEnd(event) {
    for (var touch, i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i];

      delete currentTouches[touch.identifier];
      removeVelocityTouch(touch);
    }
  }
}

PlayerControlsTouch.prototype = Object.create(PlayerControls.prototype);

PlayerControlsTouch.prototype._updateOrientation = function(delta) {
  var player = this.player;

  // Update camera roll/pitch etc
  this.rotationSpeedX -= 4 * this.rotationSpeedX * delta;
  this.rotationSpeedY -= 4 * this.rotationSpeedY * delta;

  var movementVector = new THREE.Vector3(this.rotationSpeedX * delta, -this.rotationSpeedY * delta, 1.0);
  movementVector.normalize();

  var rotation = new THREE.Quaternion;

  rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movementVector);

  player.quaternion.multiply(rotation);
};

PlayerControlsTouch.prototype._updateVelocity = function(delta) {
  this.velocity.copy(this._targetVelocity);
};

module.exports = PlayerControlsTouch;
