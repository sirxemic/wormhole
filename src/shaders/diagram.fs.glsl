uniform sampler2D map;

varying vec2 vCoordinate;
varying float vPixelPos;

void main() {
  vec2 uv = vec2(
    vCoordinate.x * 0.8,
    vCoordinate.y * 8.0 * 0.15915494309
  );
  vec4 color = texture2D(map, uv);
  color.rgb *= (1.0 - vPixelPos) * 2.0;
  gl_FragColor = color;
}
