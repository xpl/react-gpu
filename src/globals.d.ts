declare module reactgpu {
  type Optional<T, K> = Omit<T, K> & Partial<Pick<T, K>>

  type ColorAttachmentProps = Optional<GPURenderPassColorAttachmentDescriptor, 'attachment'>

  type DepthStencilAttachmentProps = Optional<
    GPURenderPassDepthStencilAttachmentDescriptor,
    'attachment'
  >

  type RenderPassProps = Omit<
    GPUObjectDescriptorBase,
    'colorAttachments' | 'depthStencilAttachment'
  > & {
    colorAttachments?: ColorAttachmentProps[]
    depthStencilAttachment?: DepthStencilAttachmentProps
  }

  type IntrinsicElementChildren = {
    children?: JSX.Element | JSX.Element[]
  }
  interface IntrinsicElements {
    'gpu-command': GPUCommandEncoderDescriptor & IntrinsicElementChildren
    'gpu-render-pass': RenderPassProps & IntrinsicElementChildren
    'gpu-color-attachment': ColorAttachmentProps
    'gpu-depth-stencil-attachment': DepthStencilAttachmentProps
    'gpu-render-bundle': GPURenderBundleDescriptor & IntrinsicElementChildren
    'gpu-render-pipeline': GPURenderPipelineDescriptor & IntrinsicElementChildren
    'gpu-bind-group': GPUBindGroupDescriptor & IntrinsicElementChildren

    // TODO
    'gpu-draw': any
    'gpu-pipeline': any
    'gpu-bind-uniform': any
    'gpu-uniform-buffer': any
    'gpu-vertex-stage': any
    'gpu-color-state': any
    'gpu-vertex-buffer': any
    'gpu-shader-module': any
    'gpu-vertex-buffer-layout': any
    'gpu-vertex-attribute': any
  }
}

declare module JSX {
  interface IntrinsicElements extends reactgpu.IntrinsicElements {}
}
