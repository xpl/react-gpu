import 'panic-overlay'

import React, { useEffect, useRef, useState } from 'react'
import { render } from 'react-dom'
import { GPUCanvas, AnimationLoop, useAnimationLoop, current } from 'react-gpu'

import 'reset-css'
import './DemoApp.scss'

function DemoComponent() {
  const [text, setText] = useState('')
  const { isRunning } = useAnimationLoop((dt, t) => {
    setText(t.toFixed(1))
  })

  return (
    <span>
      {' ' + text} {isRunning ? ' 🔴' : ''}
    </span>
  )
}

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

const code = `
[[block]] struct Uniforms {
  [[offset(0)]] projectionMatrix: mat4x4<f32>;
  [[offset(64)]] viewMatrix: mat4x4<f32>;
};

[[set(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[builtin(position)]] var<out> outPosition: vec4<f32>;
[[location(0)]] var<in> position: vec3<f32>;
[[location(1)]] var<in> color: vec4<f32>;

[[stage(vertex)]]
fn main_vert() -> void {
  outPosition = uniforms.projectionMatrix * uniforms.viewMatrix * vec4<f32>(position, 1.0);
}

[[location(0)]] var<out> outColor: vec4<f32>;

[[stage(fragment)]]
fn main_frag() -> void {
  outColor = vec4<f32>(1.0, 0.4, 0.8, 1.0);
}
`

function DemoApp() {
  const [isRunning, setRunning] = useState(false)
  const [counter, setCounter] = useState(0)
  return (
    <>
      Hello ReactGPU!{' '}
      <button
        onClick={() => {
          setRunning(!isRunning)
        }}
      >
        {isRunning ? 'Stop' : 'Start'}
      </button>
      <button
        style={{ marginLeft: '0.5em' }}
        onClick={() => {
          setCounter((c) => c + 1)
        }}
      >
        {counter}
      </button>
      <AnimationLoop isRunning={isRunning}>
        <DemoComponent />
        <GPUCanvas className="canvas-3d" powerPreference="high-performance" verbose>
          <gpu-feature name="pipeline-statistics-query" />
          <gpu-feature name="texture-compression-bc" />
          <gpu-swap-chain format="preferred" usage={GPUTextureUsage.RENDER_ATTACHMENT} />
          <gpu-command></gpu-command>
        </GPUCanvas>
      </AnimationLoop>
    </>
  )
}

render(<DemoApp />, document.getElementById('root'))

// <gpu-swap-chain format="preferred" usage={GPUTextureUsage.RENDER_ATTACHMENT} />
// <gpu-command>
//             <gpu-render-pass>
//               <gpu-color-attachment loadValue={[0.25, 0.28, 0.26, 1.0]} storeOp="store" />
//               <gpu-depth-stencil-attachment
//                 depthLoadValue={1.0}
//                 depthStoreOp="store"
//                 stencilLoadValue={1.0}
//                 stencilStoreOp="store"
//               >
//                 <gpu-texture
//                   fullScreen={true}
//                   mipLevelCount={1}
//                   sampleCount={1}
//                   dimension="2d"
//                   format="depth24plus-stencil8"
//                   usage={GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC}
//                 />
//               </gpu-depth-stencil-attachment>
//               <gpu-render-bundle>
//                 <gpu-pipeline
//                   primitiveTopology="line-list"
//                   frontFace="cw"
//                   cullMode="none"
//                   depthWriteEnabled={true}
//                   depthCompare="less"
//                 >
//                   <gpu-color-state
//                     alphaBlendOp="add"
//                     alphaBlendSrc="src-alpha"
//                     alphaBlendDst="one-minus-src-alpha"
//                     colorBlendOp="add"
//                     colorBlendSrc="src-alpha"
//                     colorBlendDst="one-minus-src-alpha"
//                   />
//                   <gpu-shader-module>{code}</gpu-shader-module>
//                   <gpu-bind-uniform visibility={GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT} />
//                   <gpu-vertex-buffer-layout stepMode="vertex">
//                     <gpu-vertex-attribute format="float3" />
//                     <gpu-vertex-attribute format="float4" />
//                   </gpu-vertex-buffer-layout>
//                   <gpu-draw vertexCount={6}>
//                     <gpu-uniform-buffer>{uniformData}</gpu-uniform-buffer>
//                     <gpu-vertex-buffer>{vertexData}</gpu-vertex-buffer>
//                   </gpu-draw>
//                 </gpu-pipeline>
//               </gpu-render-bundle>
//             </gpu-render-pass>
//           </gpu-command>
