# react-gpu

A research project with the goal to explore the advantages of [React](https://reactjs.org/) component
model in describing rendering pipelines for modern GPUs (via [WebGPU](https://gpuweb.github.io/gpuweb/)).

- Integrates seamlessly with `react-dom`
- Exposes basic **WebGPU** concepts via [JSX tags](https://reactjs.org/docs/introducing-jsx.html) and [React hooks](https://reactjs.org/docs/hooks-intro.html)
- Handles boring stuff like context management, resizing, animation loop, etc.
- Aims to provide easily composable blocks for building higher level graphics components.

```tsx
<AnimationLoop isRunning={isRunning}>
  <GPUCanvas className="canvas-3d">
    <gpu-command>
      <gpu-render-pass>
        <gpu-color-attachment
          loadValue={[0.25, 0.28, 0.26, 1.0]}
          storeOp="store"
        />
        <gpu-depth-stencil-attachment
          depthLoadValue={1.0}
          depthStoreOp="store"
          stencilLoadValue={1.0}
          stencilStoreOp="store"
        />
        <gpu-render-bundle>
          <gpu-draw vertexCount={6}>
            <gpu-pipeline
              primitiveTopology="line-list"
              frontFace="cw"
              cullMode="none"
              depthWriteEnabled={true}
              depthCompare="less"
            >
              <gpu-color-state
                alphaBlendOperation="add"
                alphaBlendSrcFactor="src-alpha"
                alphaBlendDstFactor="one-minus-src-alpha"
                colorBlendOperation="add"
                colorBlendSrcFactor="src-alpha"
                colorBlendDstFactor="one-minus-src-alpha"
              />
              <gpu-shader-module>{code}</gpu-shader-module>
              <gpu-bind-uniform visibility={GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT}>
                <gpu-uniform-buffer>{uniformData}</gpu-uniform-buffer>
              </gpu-bind-uniform>
              <gpu-vertex-buffer-layout>
                <gpu-vertex-attribute format="float3" />
                <gpu-vertex-attribute format="float4" />
              </gpu-vertex-buffer-layout>
            </gpu-pipeline>
            <gpu-vertex-buffer>{vertexData}</gpu-vertex-buffer>
          </gpu-draw>
        </gpu-render-bundle>
      </gpu-render-pass>
    </gpu-command>
  </GPUCanvas>
</AnimationLoop>
```

![Screen Shot 2020-12-19 at 7 30 08 PM](https://user-images.githubusercontent.com/1707/102694248-d12a3600-4230-11eb-9223-89e9dcc1e596.jpg)

_Currently in the very early stages of development, nothing to see here basically :) Subscribe!_
