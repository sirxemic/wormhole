precision highp float;

#include "./common";

uniform vec3 uCameraPosition;

uniform float uRadiusSquared;
uniform float uThroatLength;

uniform sampler2D uIntegrationBuffer;
uniform samplerCube uSkybox1;
uniform samplerCube uSkybox2;

uniform vec2 uAngleRange;

varying vec3 vRayDir;

/**
 *  Util
 */
void sphericalToCartesian(vec2 position, vec2 direction, out vec3 outPos, out vec3 outDir) {
  float sinY = sin(position.y),
        cosY = cos(position.y),
        sinX = sin(position.x),
        cosX = cos(position.x);

  outPos = vec3(sinY * cosX, -cosY, -sinY * sinX);
  outDir = vec3(
    -sinY * sinX * direction.x + cosY * cosX * direction.y,
     sinY * direction.y,
    -sinY * cosX * direction.x - cosY * sinX * direction.y
  );
}

// Not using structs for the intermediate state (position, direction, throatTravelDistance) because
// for some reason that heavily impacts the visual quality

// Integrate!
void integrate3D(inout vec3 position, vec3 direction, inout float throatTravelDistance, out vec3 cubeCoord) {
  // We integrate in a 2D plane so we don't have to deal with the poles of spherical coordinates, where
  // integration might go out of hand.

  // Determine the X- and Y-axes in this plane
  vec3 pos3D, dir3D, axisX, axisY, axisZ;
  sphericalToCartesian(position.zy, direction.zy, pos3D, dir3D);

  axisX = normalize(pos3D);
  axisZ = cross(axisX, normalize(dir3D));
  axisY = cross(axisZ, axisX);

  float theta = acos(direction.x);
  float x = (theta - uAngleRange.x) / (uAngleRange.y - uAngleRange.x);
  vec4 finalIntegrationState = texture2D(uIntegrationBuffer, vec2(x, 0.5));

  #if !RENDER_TO_FLOAT_TEXTURE
    finalIntegrationState.xy = finalIntegrationState.xy * 2.0 - 1.0;
    finalIntegrationState.z -= 0.5;
    finalIntegrationState.w = uThroatLength * (THROAT_FADE_START + finalIntegrationState.w * THROAT_FADE_LENGTH);
  #endif

  // Compute the end-direction in cartesian space
  cubeCoord = axisX * finalIntegrationState.x + axisY * finalIntegrationState.y;

  // Transform the 2D position and direction back into 3D
  // Though only position.x is used, we don't transform the other ray attributes
  position.x = finalIntegrationState.z;
  throatTravelDistance = finalIntegrationState.w;
}

// Transform a direction given in flat spacetime coordinates to one of the same angle
// in wormhole spacetime coordinates.
void adjustDirection(vec3 position, inout vec3 direction) {
  float distanceToWormhole = max(0.0, abs(position.x) - uThroatLength);

  float r = sqrt(distanceToWormhole * distanceToWormhole + uRadiusSquared);
  direction.y /= r;
  direction.z /= r * sin(position.y);
}

// Get the final color given a position and direction.
vec4 getColor(vec3 position, float throatTravelDistance, vec3 cubeCoord) {
  vec3 skybox1Color = textureCube(uSkybox1, cubeCoord).rgb;
  vec3 skybox2Color = textureCube(uSkybox2, cubeCoord).rgb;

  float merge = 0.5 - clamp(position.x, -0.5, 0.5);
  vec3 color = mix(skybox1Color, skybox2Color, merge);

  // Prettify the thing where everything becomes infinite
  float cutoffStart = uThroatLength * THROAT_FADE_START;
  float cutoffLength = uThroatLength * THROAT_FADE_LENGTH;

  float blackFade = clamp((throatTravelDistance - cutoffStart) / cutoffLength, 0.0, 1.0);

  return vec4(mix(color, vec3(0.0), blackFade), 1.0);
}

void main()
{
  vec3 position = uCameraPosition;
  vec3 direction = normalize(vRayDir);
  float throatTravelDistance = 0.0;

  adjustDirection(position, direction);

  vec3 cubeCoord;

  // Integrate in wormhole space coordinates
  integrate3D(position, direction, throatTravelDistance, cubeCoord);

  gl_FragColor = getColor(position, throatTravelDistance, cubeCoord);
}
