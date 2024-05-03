precision highp float;

#include "./common";

uniform vec3 uCameraPosition;

uniform float uRadiusSquared;
uniform float uThroatLength;

varying float vTheta;

// Not using structs for the intermediate state (position, direction, throatTravelDistance) because
// for some reason that heavily impacts the visual quality

// Do an integration step in 2D wormhole space.
void step2D(inout vec2 position, inout vec2 direction, inout float throatTravelDistance) {
  float distanceToWormhole = abs(position.x) - uThroatLength;

  float delta;

  if (distanceToWormhole >= 0.0) {
    // We can take bigger integration steps when at a larger distance away from the wormhole.
    delta = (0.1 + 0.02 * distanceToWormhole) / uRadiusSquared;

    // Use backwards euler integration
    float h = delta,
          h2 = h * h,
          x = sign(position.x) * distanceToWormhole,
          x2 = x * x,
          b2 = uRadiusSquared,
          dx = direction.x,
          dx2 = dx * dx,
          dy = direction.y,
          dy2 = dy * dy,

          r2 = b2 + x2,
          hdx = h * dx,
          s = 2.0 * x * hdx,
          t = h2 * (b2 - 3.0 * x2);

    vec2 directionDelta = vec2(
        dy * (x * r2 * r2 - 2.0 * x * t * dx2 + (b2 * b2 - x2 * x2) * hdx),
        -2.0 * (x2 * (x - hdx) + b2 * (x + hdx)) * (dx + h * x * dy2)
    ) * dy * h / (r2 * (r2 + s) - t * (r2 - s) * dy2);

    direction += directionDelta;
  }
  else {
    // Inside the wormhole spacetime is flat, so just compute the distance to the mouth.
    if (direction.x < 0.0) {
      delta = (position.x + uThroatLength) / -direction.x;
    }
    else {
      delta = (uThroatLength - position.x) / direction.x;
    }
    throatTravelDistance += abs(delta);
  }
  position += direction * delta;
}

// Normalize the direction according to the curvature.
void normalizeDirection2D(vec2 position, inout vec2 direction) {
  float distanceToWormhole = max(0.0, abs(position.x) - uThroatLength);

  float magnitude = sqrt(
    direction.x * direction.x +
    (distanceToWormhole * distanceToWormhole + uRadiusSquared) * direction.y * direction.y
  );

  direction /= magnitude;
}

// Integrate in 2D wormhole space.
void integrate2D(inout vec2 position, inout vec2 direction, inout float throatTravelDistance) {
  for (int i = 0; i < 200; i++) {
    step2D(position, direction, throatTravelDistance);
    // normalizeDirection2D(ray);
  }
}

void main() {
  float distanceToWormhole = max(0.0, abs(uCameraPosition.x) - uThroatLength);

  float directionX = cos(vTheta);
  float sinTheta = sin(vTheta);

  vec2 position = vec2(uCameraPosition.x, 0.0);
  vec2 direction = vec2(
    directionX,
    sqrt(sinTheta * sinTheta / (distanceToWormhole * distanceToWormhole + uRadiusSquared))
  );
  float throatTravelDistance = 0.0;

  integrate2D(position, direction, throatTravelDistance);

  // Compute the end-direction in cartesian space
  distanceToWormhole = max(0.0, abs(position.x) - uThroatLength);
  float r = distanceToWormhole * (position.x / abs(position.x));

  vec2 finalDirection = vec2(
    direction.x * cos(position.y) - r * direction.y * sin(position.y),
    direction.x * sin(position.y) + r * direction.y * cos(position.y)
  );

  #if RENDER_TO_FLOAT_TEXTURE
    gl_FragColor = vec4(finalDirection, position.x, throatTravelDistance);
  #else
    float distance = (throatTravelDistance - uThroatLength * THROAT_FADE_START) / (uThroatLength * THROAT_FADE_LENGTH);
    gl_FragColor = vec4(
      normalize(finalDirection) * 0.5 + 0.5,
      clamp(position.x, -0.5, 0.5) + 0.5,
      clamp(distance, 0.0, 1.0)
    );
  #endif
}
