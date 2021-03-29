import React from 'react'

// prettier-ignore
const vertexData = [
  /* position */ 0, 0, 0, /* color */ 1, 0, 0, 1,
  /* position */ 1, 0, 0, /* color */ 1, 0.5, 0.5, 1,
  /* position */ 0, 0, 0, /* color */ 0, 1, 0, 1,
  /* position */ 0, 1, 0, /* color */ 0.5, 1, 0.5, 1,
  /* position */ 0, 0, 0, /* color */ 0, 0, 1, 1,
  /* position */ 0, 0, 1, /* color */ 0.5, 0.5, 1, 1,
]

// prettier-ignore
const uniformData = [
  0.7804085612297058, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0,
  0, -0.20020020008087158, 0, 0.7071067690849304, -0.40824830532073975, 0.5773502588272095, 0,
  0, 0.8164965510368347, 0.5773502588272095, 0, -0.7071067690849304, -0.40824827551841736,
  0.5773502588272095, 0, -0, 4.440892098500626e-16, -5.196152210235596, 1
]

const vs = `
[[block]] struct Uniforms {
  [[offset(0)]] projectionMatrix: mat4x4<f32>;
  [[offset(64)]] viewMatrix: mat4x4<f32>;
};

[[set(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[builtin(position)]] var<out> outPosition: vec4<f32>;
[[location(0)]] var<out> outColor: vec4<f32>;

[[location(0)]] var<in> position: vec3<f32>;
[[location(1)]] var<in> color: vec4<f32>;

[[stage(vertex)]]
fn main() -> void {
  outPosition = uniforms.projectionMatrix * uniforms.viewMatrix * vec4<f32>(position, 1.0);
  outColor = color;
}`

const fs = `
[[location(0)]] var<in> color: vec4<f32>;
[[location(0)]] var<out> outColor: vec4<f32>;

[[stage(fragment)]]
fn main() -> void {
  outColor = color;
}
`

export function Axes3D() {
  return (
    <gpu-render-bundle>
      <gpu-render-pipeline topology="line-list" frontFace="cw" cullMode="none">
        <gpu-depth-stencil depthCompare="less" depthWriteEnabled />
        <gpu-color-target
          alphaBlendOp="add"
          alphaBlendSrc="src-alpha"
          alphaBlendDst="one-minus-src-alpha"
        />
        <gpu-shader-module vertexEntryPoint="main">{vs}</gpu-shader-module>
        <gpu-shader-module fragmentEntryPoint="main">{fs}</gpu-shader-module>
        <gpu-vertex-buffer-layout stepMode="vertex">
          <gpu-vertex-attribute format="float32x3" />
          <gpu-vertex-attribute format="float32x4" />
        </gpu-vertex-buffer-layout>
        <gpu-bind-group-layout>
          <gpu-bind-buffer
            type="uniform"
            visibility={GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT}
          />
        </gpu-bind-group-layout>
        <gpu-draw vertexCount={6}>
          <gpu-bind-group>
            <gpu-uniform-buffer>{uniformData}</gpu-uniform-buffer>
          </gpu-bind-group>
          <gpu-vertex-buffer>{vertexData}</gpu-vertex-buffer>
        </gpu-draw>
      </gpu-render-pipeline>
    </gpu-render-bundle>
  )
}
