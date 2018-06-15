#define PI 3.1415926538

precision mediump float;

uniform float angle;
uniform vec4 color;
uniform vec2 mouse;
uniform vec2 windowSize;


mat2 mInv = mat2(
  1.0, 0.0,
  0.577, 1.154
);

vec4 CalcCameraSpacePosition()
{
    vec4 ndcPos;
    float min_ws = min(windowSize.x, windowSize.y);
    float max_ws = max(windowSize.x, windowSize.y);
    ndcPos.xy = ((gl_FragCoord.xy / max_ws) * 2.0) - 1.0;
    ndcPos.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
        (gl_DepthRange.far - gl_DepthRange.near);
    ndcPos.w = 1.0;
 
    vec4 clipPos = ndcPos / gl_FragCoord.w;
    return clipPos + vec4(0.0, 1.0 - min_ws/max_ws, 0.0, 0.0);
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

vec2 getPosition(vec4 p) {
  float radianAngle = -2.0 * PI * angle;
  mat2 rotation = mat2(
    cos(radianAngle), sin(radianAngle),
    -sin(radianAngle), cos(radianAngle)
  );
  vec2 clipPos = CalcCameraSpacePosition(p).xy;
  vec2 position = 10.0 * mInv * rotation * clipPos;
  return position;
}

vec2 getCenter(vec2 position) {
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
  return center;
}

void main() {
  vec2 position = getPosition(gl_FragCoord);
  vec2 center = getCenter(position);
  vec2 mouseCenter = getCenter(getPosition(vec4(mouse, 0.0, 1.0)));
  vec2 pos = position - center;
  float cc = fract(angle);
  float d = 2.0 * (cc <= 0.5 ? cc: 1.0-cc);
  float delta = 0.05 * d;
  if ( abs(pos.x) <= 1.0 - delta && abs(pos.y) <= 1.0 - delta &&
       abs(pos.x-pos.y) <= 1.0 - delta) {
    if (center.x == 0.0 && center.y == 0.0 &&
    abs(pos.x) <= 1.0 - 2.0*delta && abs(pos.y) <= 1.0 - 2.0*delta &&
       abs(pos.x-pos.y) <= 1.0 - 2.0*delta) {
      gl_FragColor = hsv2rgb(color);//vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      if (mouseCenter.x == center.x && mouseCenter.y == center.y) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      } else {
        float c = fract(angle);
        c = 2.0 * (c <= 0.5 ? c: 1.0 - c);
        gl_FragColor = vec4(c, c, c, 1.0);//vec4((1.0+ cos(center.x))/2.0, (1.0+ sin(center.y))/2.0, (1.0-cos(center.y)*sin(center.x))/2.0, 1.0);
      }
    }
  } else {
    gl_FragColor = hsv2rgb(color);
  }
}
