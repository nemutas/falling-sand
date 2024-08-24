#version 300 es
precision highp float;

uniform vec2 resolution;
uniform sampler2D positionMap;

#define packing(v) v * 0.5 + 0.5

in vec2 vUv;
out vec4 outColor;

vec3 hash(vec3 v) {
  uvec3 x = floatBitsToUint(v + vec3(0.1, 0.2, 0.3));
  x = (x >> 8 ^ x.yzx) * 0x456789ABu;
  x = (x >> 8 ^ x.yzx) * 0x6789AB45u;
  x = (x >> 8 ^ x.yzx) * 0x89AB4567u;
  return vec3(x) / vec3(-1u);
}

void main() {
  vec2 uv = vUv;
  vec2 px = 1.0 / resolution;
  vec4 pos = texture(positionMap, uv);

  outColor = packing(vec4(0));

  if (pos.a == 0.0) {
    // 対称のセルが空き状態であれば更新しない
    return;
  }

  if (uv.y - px.y <= 0.0) {
    // 下境界であれば更新しない
    return;
  }

  float bottom_center = texture(positionMap, uv + px * vec2(0, -1)).a;

  if (bottom_center == 0.0) {
    // 直下のセルが空き状態
    outColor = packing(vec4(0, -1, 0, 0));
    return;
  }

  float bottom_left  = texture(positionMap, uv + px * vec2(-1, -1)).a;
  float bottom_right = texture(positionMap, uv + px * vec2( 1, -1)).a;

  if (bottom_left == 1.0 && bottom_right == 1.0) {
    // 左下も右下も埋まっている場合は、更新しない
    return;
  }

  if (uv.x - px.x <= 0.0) {
    // 左境界で右下のセルが空き状態
    if (bottom_right == 0.0) {
      outColor = packing(vec4(1, -1, 0, 0));
    }
  } else if (1.0 <= uv.x + px.x) {
    // 右境界で左下のセルが空き状態
    if (bottom_left == 0.0) {
      outColor = packing(vec4(-1, -1, 0, 0));
    }
  } else if (bottom_left == 0.0 && bottom_right == 1.0) {
    // 左下のみ空き状態
    outColor = packing(vec4(-1, -1, 0, 0));
  } else if (bottom_left == 1.0 && bottom_right == 0.0) {
    // 右下のみ空き状態
    outColor = packing(vec4(1, -1, 0, 0));
  } else if (0.5 < hash(vec3(uv, 0.1)).x) {
    // 左下も右下も空き状態で、確率的にどちらかに移動させる
    outColor = packing(vec4(-1, -1, 0, 0));
  } else {
    outColor = packing(vec4(1, -1, 0, 0));
  }
}