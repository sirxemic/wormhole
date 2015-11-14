var PlayerControls = require('./playercontrols');

function PlayerControlsKeyboard(player, domElement)
{
  PlayerControls.apply(this, arguments);

  var self = this;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.moveUp = false;
  this.moveDown = false;
  this.rotateLeft = false;
  this.rotateRight = false;

  function onMouseMove(e) {
    self.rotationSpeedX += 4 * (e.movementX || e.mozMovementX || e.webkitMovementX || 0);
  }

  function onKeyDown(e) {
    self.active = true;

    switch (e.keyCode) {
      case 65: self.moveLeft = true; break;
      case 68: self.moveRight = true; break;
      case 87: self.moveForward = true; break;
      case 83: self.moveBackward = true; break;
      case 82: self.moveUp = true; break;
      case 70: self.moveDown = true; break;
      case 81: self.rotateLeft = true; break;
      case 69: self.rotateRight = true; break;
    }
  }

  function onKeyUp(e) {
    switch (e.keyCode) {
      case 65: self.moveLeft = false; break;
      case 68: self.moveRight = false; break;
      case 87: self.moveForward = false; break;
      case 83: self.moveBackward = false; break;
      case 82: self.moveUp = false; break;
      case 70: self.moveDown = false; break;
      case 81: self.rotateLeft = false; break;
      case 69: self.rotateRight = false; break;
    }
  }

  domElement.onclick = function() {
    domElement.requestPointerLock = domElement.requestPointerLock ||
                            domElement.mozRequestPointerLock ||
                            domElement.webkitRequestPointerLock;

    domElement.requestPointerLock();
  };

  // Hook pointer lock state change events for different browsers
  document.addEventListener('pointerlockchange', lockChange, false);
  document.addEventListener('mozpointerlockchange', lockChange, false);
  document.addEventListener('webkitpointerlockchange', lockChange, false);

  function lockChange() {
    if (document.pointerLockElement === domElement ||
        document.mozPointerLockElement === domElement ||
        document.webkitPointerLockElement === domElement) {
      document.addEventListener('mousemove', onMouseMove, false);
    }
    else {
      document.removeEventListener('mousemove', onMouseMove, false);
    }
    self.active = true;
  }

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
}

PlayerControlsKeyboard.prototype = Object.create(PlayerControls.prototype);

PlayerControlsKeyboard.prototype._updateOrientation = function(delta) {
  // Update camera roll/pitch etc
  this.rotationSpeedX -= 4 * this.rotationSpeedX * delta;
  this.rotationSpeedY -= 4 * this.mouseSpeedY * delta;

  var movementVector = new THREE.Vector3(this.rotationSpeedX * delta, -this.rotationSpeedY * delta, 100.0);
  movementVector.normalize();

  var rotation = new THREE.Quaternion;

  rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movementVector);

  this.player.quaternion.multiply(rotation);
};

PlayerControlsKeyboard.prototype._updateVelocity = function(delta) {
  this.velocity.set(0, 0, 0);

  if (this.moveForward) {
    this.velocity.add(new THREE.Vector3(0, 0, 1));
  }

  if (this.moveBackward) {
    this.velocity.add(new THREE.Vector3(0, 0, -1));
  }

  if (this.moveLeft) {
    this.velocity.add(new THREE.Vector3(-1, 0, 0));
  }

  if (this.moveRight) {
    this.velocity.add(new THREE.Vector3(1, 0, 0));
  }

  if (this.velocity.lengthSq() > 0) {
    this.velocity.normalize();
  }
};

module.exports = PlayerControlsKeyboard;
