precision highp float;

attribute vec2 position;

uniform mat4 uCameraOrientation;

varying vec3 vRayDir;

void main() {
  vRayDir = (uCameraOrientation * vec4(position.x, position.y, -1.0, 0.0)).xyz;

  gl_Position = vec4(position, 0.0, 1.0);
}
