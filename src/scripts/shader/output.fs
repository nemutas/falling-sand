#version 300 es
precision highp float;

uniform sampler2D positionMap;

in vec2 vUv;
out vec4 outColor;

void main() {
  vec4 pos = texture(positionMap, vUv);
  outColor = vec4(pos.rgb, 1.0);
  if (pos.a == 0.0) {
    outColor = vec4(vec3(0.05), 1.0);
  }
}