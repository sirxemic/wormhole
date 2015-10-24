function Player(space) {
  THREE.Object3D.apply(this);

  this.space = space;
}

Player.prototype = Object.create(THREE.Object3D.prototype);

Player.prototype.move = function(velocity) {
  var distance = velocity.length();

  velocity = velocity.clone().normalize().applyQuaternion(this.quaternion);

  this.space.move(this, velocity, distance);
};
