# react-gpu

A research project with the goal to explore the advantages of [React](https://reactjs.org/) component
model in describing rendering pipelines for modern GPUs (via [WebGPU](https://gpuweb.github.io/gpuweb/)).

- Integrates seamlessly with `react-dom`
- Exposes basic **WebGPU** concepts via [JSX tags](https://reactjs.org/docs/introducing-jsx.html) and [React hooks](https://reactjs.org/docs/hooks-intro.html)
- Handles boring stuff like context management, resizing, animation loop, etc.
- Aims to provide easily composable blocks for building higher level graphics components.

_Currently in the very early stages of development, nothing to see here basically :) Subscribe!_

```tsx
<AnimationLoop isRunning={isRunning}>
  <GPUCanvas className="canvas-3d">
    <gpu-command>
      <gpu-render-pass
        colorAttachments={[
          {
            attachment: defaultAttachments.color,
            loadValue: [0.25, 0.28, 0.26, 1.0],
            storeOp: 'store'
          }
        ]}
        depthStencilAttachment={{
          attachment: defaultAttachments.depthStencil,
          depthLoadValue: 1.0,
          depthStoreOp: 'store',
          stencilLoadValue: 1.0,
          stencilStoreOp: 'store'
        }}
      >
        <gpu-render-bundle>
          <gpu-draw-indexed ... />
          <gpu-draw-indexed ... />
        </gpu-render-bundle>
      </gpu-render-pass>
    </gpu-command>
  </GPUCanvas>
</AnimationLoop>
```

![Screen Shot 2020-12-19 at 7 30 08 PM](https://user-images.githubusercontent.com/1707/102694248-d12a3600-4230-11eb-9223-89e9dcc1e596.jpg)
