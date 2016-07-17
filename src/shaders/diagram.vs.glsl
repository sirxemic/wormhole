varying vec2 vCoordinate;
varying float vPixelPos;

void main() {
  vCoordinate = uv;
  vec4 vertex = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vPixelPos = length(vertex.xy) / vertex.w;
  gl_Position = vertex;
}
