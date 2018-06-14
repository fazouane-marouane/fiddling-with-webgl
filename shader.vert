#define PI 3.1415926538

attribute vec2 coords;
attribute float angle;
attribute float pointSize;

mat2 m = mat2(
  1.0, 0.0,
  -0.5, 0.866
);

void main() {
  float radianAngle = 2.0 * PI * angle;
  mat2 rotation = mat2(
    cos(radianAngle), sin(radianAngle),
    -sin(radianAngle), cos(radianAngle)
  );
  gl_Position = vec4(rotation * m * coords / 10.0, 0.0, 1.0);
  gl_PointSize = pointSize;
}
