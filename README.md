# react-gpu

```diff
- Currently in the very early stages of development, nothing to see here basically :) Subscribe!
```

A research project with the goal to explore the advantages of [React](https://reactjs.org/) component
model in describing rendering pipelines for modern GPUs (via [WebGPU](https://gpuweb.github.io/gpuweb/)).

- Exposes basic **WebGPU** concepts via [JSX tags](https://reactjs.org/docs/introducing-jsx.html), 100% declarative
- Efficiently manages the lifecycle of retained GPU objects
- Handles boring stuff like context management, resizing, animation loop, etc.
- Integrates seamlessly with `react-dom`
- Aims to provide easily composable blocks for building higher level graphics components

```tsx
<AnimationLoop isRunning={isRunning}>
  <DemoComponent />
  <GPUCanvas className="canvas-3d" powerPreference="high-performance" verbose>
    <gpu-swap-chain format="preferred" usage={GPUTextureUsage.RENDER_ATTACHMENT} />
    <gpu-command>
      <gpu-render-pass>
        <gpu-color-attachment loadValue={clearColor} storeOp="store" />
        <gpu-depth-stencil-attachment
          depthLoadValue={1.0}
          depthStoreOp="store"
          stencilLoadValue={1.0}
          stencilStoreOp="store"
        >
          <gpu-texture
            fullScreen
            mipLevelCount={1}
            dimension="2d"
            format="depth24plus-stencil8"
            usage={GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC}
          />
        </gpu-depth-stencil-attachment>
        <gpu-render-bundle>
          <gpu-render-pipeline topology="line-list" frontFace="cw" cullMode="none">
            <gpu-depth-stencil depthCompare="less" depthWriteEnabled />
            <gpu-color-target
              alphaBlendOp="add"
              alphaBlendSrc="src-alpha"
              alphaBlendDst="one-minus-src-alpha"
            />
            <gpu-shader-module vertexEntryPoint="main_vert" fragmentEntryPoint="main_frag">
              {code}
            </gpu-shader-module>
            <gpu-vertex-buffer-layout stepMode="vertex">
              <gpu-vertex-attribute format="float32x3" />
              <gpu-vertex-attribute format="float32x4" />
            </gpu-vertex-buffer-layout>
            <gpu-bind-group-layout>
              <gpu-bind-buffer type="uniform" visibility={GPUShaderStage.VERTEX} />
            </gpu-bind-group-layout>
            <gpu-draw vertexCount={6}>
              <gpu-bind-group>
                <gpu-uniform-buffer>{uniformData}</gpu-uniform-buffer>
              </gpu-bind-group>
              <gpu-vertex-buffer>{vertexData}</gpu-vertex-buffer>
            </gpu-draw>
          </gpu-render-pipeline>
        </gpu-render-bundle>
      </gpu-render-pass>
    </gpu-command>
  </GPUCanvas>
</AnimationLoop>
```

## Why

![Screen Shot 2020-12-19 at 7 30 08 PM](https://user-images.githubusercontent.com/1707/102694248-d12a3600-4230-11eb-9223-89e9dcc1e596.jpg)

## Also Check

- **[TypeScript Shading Language](https://github.com/xpl/tssl)
