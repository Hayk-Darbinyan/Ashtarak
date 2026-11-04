/**
 * One water surface, two jobs.
 *
 * A photograph is sampled through a domain-warped noise field: the gradient
 * of that field bends the lookup (refraction) and its ridges are raised to a
 * power to draw caustic veins on top. The pointer adds an outward push and an
 * expanding ring. Everything else — shade, vignette, tint — is a uniform, so
 * the hero and the pool section share one shader and one code path.
 */

export const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const waterFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D uTex;
  uniform float uTime;
  uniform vec2  uMouse;         // 0..1, smoothed
  uniform float uMouseStrength;
  uniform vec2  uCover;         // object-fit: cover correction
  uniform float uAspect;
  uniform float uIntro;         // 0..1 load-in
  uniform float uScroll;        // -1..1 drift
  uniform float uScale;         // noise frequency
  uniform float uRefract;       // lookup displacement
  uniform float uCaustic;       // vein strength
  uniform float uShade;         // corner shadow for type legibility
  uniform float uVignette;
  uniform float uExposure;
  uniform vec3  uFoam;
  uniform vec3  uSun;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.86, 0.5, -0.5, 0.86);
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  // ridged noise raised to a power: thin bright veins, the way light folds
  // on the floor of a pool
  float veins(vec2 p, float sharpness) {
    float n = clamp(fbm(p) * 1.0667, 0.0, 1.0);
    return pow(clamp(1.0 - abs(2.0 * n - 1.0), 0.0, 1.0), sharpness);
  }

  void main() {
    vec2 uv = vUv;
    vec2 sp = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    float t = uTime * 0.075;

    // pointer: push the field outward, and send a ring through it
    vec2 m = vec2((uMouse.x - 0.5) * uAspect, uMouse.y - 0.5);
    vec2 away = sp - m;
    float md = length(away);
    vec2 push = (away / (md + 0.001)) * exp(-md * 5.0) * uMouseStrength * 0.16;
    float ring = sin(md * 30.0 - uTime * 3.4) * exp(-md * 6.5) * uMouseStrength;

    vec2 p = sp * uScale;
    vec2 q = vec2(fbm(p + vec2(0.0, t * 1.4)), fbm(p + vec2(4.7, -t * 1.1)));
    vec2 r = p + q * 0.9 + push + ring * 0.05;

    float slow = veins(r * 1.0 + vec2(t * 0.8, -t * 1.6), 4.0);
    float fast = veins(r * 2.1 - vec2(t * 2.1, t * 0.7), 7.0);

    // gradient of the slow field drives refraction
    float e = 0.045;
    float g0 = fbm(r);
    vec2 grad = vec2(g0 - fbm(r + vec2(e, 0.0)), g0 - fbm(r + vec2(0.0, e)));
    grad += away / (md + 0.001) * ring * 0.35;

    vec2 sampleUv = uv + grad * uRefract * uIntro;
    sampleUv.y += uScroll * 0.035;
    vec2 tUv = (sampleUv - 0.5) * uCover + 0.5;
    tUv = clamp(tUv, 0.001, 0.999);

    // chromatic split along the gradient reads as depth, not as a glitch
    float ca = uRefract * 0.12;
    vec3 col;
    col.r = texture2D(uTex, clamp(tUv + grad * ca, 0.001, 0.999)).r;
    col.g = texture2D(uTex, tUv).g;
    col.b = texture2D(uTex, clamp(tUv - grad * ca, 0.001, 0.999)).b;

    // a low sun off the upper right
    float lightGrad = smoothstep(1.25, -0.1, (1.0 - uv.x) + (1.0 - uv.y));

    col += uFoam * slow * uCaustic * (0.55 + 0.45 * lightGrad);
    col += uFoam * fast * uCaustic * (0.3 + 0.7 * lightGrad);
    col += uSun * pow(fast * slow, 1.1) * uCaustic * 1.5 * lightGrad;
    col += uFoam * max(ring, 0.0) * 0.28;

    col *= uExposure;

    // shadow in the lower left, under the headline
    col *= 1.0 - smoothstep(0.85, 0.0, uv.x + uv.y * 0.6) * uShade;

    vec2 v = uv - 0.5;
    col *= 1.0 - dot(v, v) * uVignette;
    col *= mix(0.25, 1.0, uIntro);

    float dither = (hash(gl_FragCoord.xy * 0.71 + fract(uTime)) - 0.5) / 255.0;
    gl_FragColor = vec4(col + dither, 1.0);
  }
`
