#define PI 3.1415926538

precision mediump float;

uniform float angle2;
uniform vec4 color;
uniform vec2 windowSize;


mat2 mInv = mat2(
  1.0, 0.0,
  0.577, 1.154
);

vec4 CalcCameraSpacePosition()
{
  vec4 ndcPos;
  ndcPos.xy = ((gl_FragCoord.xy / windowSize.xy) * 2.0) - 1.0;
  ndcPos.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
    (gl_DepthRange.far - gl_DepthRange.near);
  ndcPos.w = 1.0;

  vec4 clipPos = ndcPos / gl_FragCoord.w;

  return clipPos;
}

vec4 hsv2rgb(vec4 c)
{
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return vec4(c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y), c.w);
}

vec2 updateCenter(vec2 c, vec2 acc, vec2 p) {
  if (mod(c.x + c.y, 3.0) == 0.0 && (acc == p || distance(acc, p) > distance(c, p))) {
    return c;
  }
  return acc;
}

void main() {
  float radianAngle = -2.0 * PI * angle2;
  mat2 rotation = mat2(
    cos(radianAngle), sin(radianAngle),
    -sin(radianAngle), cos(radianAngle)
  );
  vec2 position = 10.0 * (mInv * rotation * CalcCameraSpacePosition().xy);
  vec2 c1 = floor(position);
  vec2 c2 = ceil(position);
  vec2 c3 = vec2(c1.x, c2.y);
  vec2 c4 = vec2(c2.x, c1.y);
  vec2 center = updateCenter(c1,
    updateCenter(c2,
      updateCenter(c3,
        updateCenter(c4, position, position),
        position),
      position),
    position);
  vec2 pos = position - center;
  if (-1.0 <= pos.x && pos.x <= 1.0 &&
    -1.0 <= pos.y && pos.y <= 1.0 &&
    -1.0 <= pos.x - pos.y && pos.x - pos.y <= 1.0) {
    gl_FragColor = vec4(abs(center.x) / 10.0, 0.1, 1.0 - abs(center.y) / 10.0, 1.0);
  } else {
    gl_FragColor = hsv2rgb(color);
  }
}
