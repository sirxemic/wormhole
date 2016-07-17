var THREE = require("three");

function PlayerControls(player, domElement)
{
  this.player = player;
  this.domElement = domElement;

  this.velocity = new THREE.Vector3;
  this.rotationSpeedX = 0;
  this.rotationSpeedY = 0;

  this.active = false;
}

PlayerControls.prototype = {

  update: function(delta) {
    if (!this.active) {
      return;
    }

    this._updateOrientation(delta);
    this._updateVelocity(delta);

    if (this.velocity.lengthSq() > 0) {
      this.player.move(this.velocity.clone().multiplyScalar(delta));
    }
  }

};

module.exports = PlayerControls;
