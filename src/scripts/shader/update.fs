#version 300 es
precision highp float;
precision highp int;

uniform vec2 resolution;
uniform sampler2D positionMap;
uniform sampler2D directionMap;
uniform int frame;

#define unpacking(v) (v * 2.0 - 1.0)

in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 uv = vUv;
  vec2 px = 1.0 / resolution;

  vec4 pos = texture(positionMap, uv);
  pos.a *= sign(length(pos.rgb));

  if (frame % 1 != 0) {
    outColor = pos;
    return;
  }

  if (uv.y - px.y <= 0.0 && pos.a == 1.0) {
    outColor = pos;
    return;
  }

  float pos_bc = texture(positionMap, uv + px * vec2( 0, -1)).a;
  float pos_bl = texture(positionMap, uv + px * vec2(-1, -1)).a;
  float pos_br = texture(positionMap, uv + px * vec2( 1, -1)).a;

  if (pos.a == 1.0 && pos_bc == 1.0 && pos_bl == 1.0 && pos_br == 1.0) {
    outColor = pos;
    return;
  }
  
  vec2 dir    = unpacking(texture(directionMap, uv)).xy;
  vec2 dir_tc = unpacking(texture(directionMap, uv + px * vec2( 0, 1))).xy;
  vec2 dir_tl = unpacking(texture(directionMap, uv + px * vec2(-1, 1))).xy;
  vec2 dir_tr = unpacking(texture(directionMap, uv + px * vec2( 1, 1))).xy;

  if (1.0 <= uv.y + px.y) {
    dir_tc *= 0.0;
    dir_tl *= 0.0;
    dir_tr *= 0.0;
  }

  // 流れ込む砂がある場合
  if (dir_tc.y == -1.0) {
    // 真上にある場合
    outColor = vec4(texture(positionMap, uv - px * dir_tc).rgb, 1.0);
    return;
  }
  if (dir_tl.x == 1.0) {
    // 左上にある場合
    outColor = vec4(texture(positionMap, uv - px * dir_tl).rgb, 1.0);
    return;
  }
  if (dir_tr.x == -1.0) {
    // 右上にある場合
    outColor = vec4(texture(positionMap, uv - px * dir_tr).rgb, 1.0);
    return;
  }

  // 流れ込む砂がない場合
  if (dir.x == 0.0 && dir.y == 0.0) {
    // どこにも動かいない場合は更新しない
    outColor = pos;
  } else {
    // どこかしらに動く場合は0状態にする
    outColor = vec4(0);
  }
}