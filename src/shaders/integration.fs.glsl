precision highp float;

uniform vec3 uCameraPosition;

uniform float uRadiusSquared;
uniform float uThroatLength;

varying float vTheta;

struct State2D {
  vec2 position;
  vec2 direction;
  float distance;
};

// Do an integration step in 2D wormhole space.
void step2D(inout State2D ray) {
  float distanceToWormhole = abs(ray.position.x) - uThroatLength;

  float delta = 0.1 / uRadiusSquared;

  if (distanceToWormhole >= 0.0) {
    // We can take bigger integration steps when at a larger distance away from the wormhole.
    delta = (0.1 + 0.02 * distanceToWormhole) / uRadiusSquared;

    // Use backwards euler integration
    float h = delta,
          h2 = h * h,
          x = (ray.position.x / abs(ray.position.x)) * distanceToWormhole,
          x2 = x * x,
          b2 = uRadiusSquared,
          dx = ray.direction.x,
          dx2 = dx * dx,
          dy = ray.direction.y,
          dy2 = dy * dy,

          r2 = b2 + x2,
          hdx = h * dx,
          s = 2.0 * x * hdx,
          t = h2 * (b2 - 3.0 * x2);

    vec2 directionDelta = vec2(
        dy * (x * r2 * r2 - 2.0 * x * t * dx2 + (b2 * b2 - x2 * x2) * hdx),
        -2.0 * (x2 * (x - hdx) + b2 * (x + hdx)) * (dx + h * x * dy2)
    ) * dy * h / (r2 * (r2 + s) - t * (r2 - s) * dy2);

    ray.direction += directionDelta;
  }
  else {
    // Inside the wormhole spacetime is flat, so just compute the distance to the mouth.
    if (ray.position.x >= 0.0 && ray.direction.x < 0.0) {
      delta = (ray.position.x + uThroatLength) / -ray.direction.x;
    }
    else if (ray.position.x >= 0.0 && ray.direction.x > 0.0) {
      delta = (uThroatLength - ray.position.x) / ray.direction.x;
    }
    else if (ray.position.x < 0.0 && ray.direction.x > 0.0) {
      delta = (uThroatLength - ray.position.x) / ray.direction.x;
    }
    else if (ray.position.x < 0.0 && ray.direction.x < 0.0) {
      delta = (ray.position.x + uThroatLength) / -ray.direction.x;
    }
    else {
      // Looks like the camera is pointed into the wormhole's "abyss"
      delta = 1000.0;
    }
  }

  ray.position += ray.direction * delta;

  ray.distance += delta;
}

// Normalize the direction according to the curvature.
void normalizeDirection2D(inout State2D ray) {
  float distanceToWormhole = max(0.0, abs(ray.position.x) - uThroatLength);

  float magnitude = sqrt(
    ray.direction.x * ray.direction.x +
    (distanceToWormhole * distanceToWormhole + uRadiusSquared) * ray.direction.y * ray.direction.y
  );

  ray.direction /= magnitude;
}

// Integrate in 2D wormhole space.
void integrate2D(inout State2D ray) {
  for (int i = 0; i < 128; i++) {
    step2D(ray);
    normalizeDirection2D(ray);
  }
}

void main()
{
  float distanceToWormhole = max(0.0, abs(uCameraPosition.x) - uThroatLength);

  float directionX = cos(vTheta);

  State2D ray;

  ray.position = vec2(uCameraPosition.x, 0.0);
  ray.direction = vec2(
    directionX,
    sqrt((1.0 - directionX * directionX) / (distanceToWormhole * distanceToWormhole + uRadiusSquared))
  );

  integrate2D(ray);

  // Compute the end-direction in cartesian space
  distanceToWormhole = max(0.0, abs(ray.position.x) - uThroatLength);
  float r = distanceToWormhole * (ray.position.x / abs(ray.position.x));

  vec2 finalDirection = vec2(
    ray.direction.x * cos(ray.position.y) - r * ray.direction.y * sin(ray.position.y),
    ray.direction.x * sin(ray.position.y) + r * ray.direction.y * cos(ray.position.y)
  );

  gl_FragColor = vec4(finalDirection, ray.position.x, ray.distance);
}
