#version 300 es
precision highp float;
precision highp int;

uniform vec2 resolution;
uniform sampler2D positionMap;
uniform int frame;
uniform vec2 clickPos;
uniform vec3 sandColor;

in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 uv = floor(vUv * resolution) / resolution;
  vec2 px = 1.0 / resolution;

  vec4 col = texture(positionMap, vUv);
  float bottom = texture(positionMap, vUv + px * vec2(0.0, -1.0)).a;

  if (0.0 <= clickPos.x && 0.0 <= clickPos.y) {
    vec2 target = floor(clickPos * resolution) / resolution;
    if (uv.x == target.x && uv.y == target.y) {
      if (col.a == 0.0 && bottom == 0.0) {
        col += vec4(sandColor.rgb, 1.0);
      } else if (col.a == 1.0) {
        col = vec4(0.0);
      }
    }
  }

  outColor = col;
}