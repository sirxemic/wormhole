precision highp float;

#include "./common";

attribute vec2 position;

uniform vec2 uAngleRange;

varying float vTheta;

void main() {
  vTheta = mix(uAngleRange.x, uAngleRange.y, (position.x + 1.0) * 0.5);

  gl_Position = vec4(position, 0.0, 1.0);
}
