#version 300 es
#define PI 3.1415926538

attribute vec2 coords;

void main() {
  gl_Position = vec4(coords, 0.0, 1.0);
}
