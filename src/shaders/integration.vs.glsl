precision highp float;

@import ./common;

attribute vec2 position;

varying float vTheta;

void main() {
  vTheta = (position.x + 1.0) * HALF_PI;

  gl_Position = vec4(position, 0.0, 1.0);
}
