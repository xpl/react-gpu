declare module reactgpu {
  type Optional<T, K> = Omit<T, K> &
    Partial<Pick<T, K>> & { __originalType: T; __madeOptional?: Pick<T, K> }

  type PropsMadeOptional<T> = T extends { __madeOptional?: infer U } ? U : T
  type OriginalType<T> = T extends { __originalType?: infer U } ? U : T

  type ColorAttachmentProps = Optional<GPURenderPassColorAttachmentDescriptor, 'attachment'>

  type DepthStencilAttachmentProps = Optional<
    GPURenderPassDepthStencilAttachmentDescriptor,
    'attachment'
  >

  type RenderPassProps = Optional<
    GPURenderPassDescriptor,
    'colorAttachments' | 'depthStencilAttachment'
  >

  type RenderBundleProps = Optional<GPURenderBundleEncoderDescriptor, 'colorFormats'>

  type IntrinsicElementChildren = {
    children?: JSX.Element | JSX.Element[]
  }

  interface IntrinsicElements {
    'gpu-command': GPUCommandEncoderDescriptor & IntrinsicElementChildren
    'gpu-render-pass': RenderPassProps & IntrinsicElementChildren
    'gpu-color-attachment': ColorAttachmentProps
    'gpu-depth-stencil-attachment': DepthStencilAttachmentProps
    'gpu-render-bundle': RenderBundleProps & IntrinsicElementChildren
    'gpu-render-pipeline': GPURenderPipelineDescriptor & IntrinsicElementChildren
    'gpu-bind-uniform': IntrinsicElementChildren
    'gpu-color-state': IntrinsicElementChildren
    'gpu-shader-module': IntrinsicElementChildren
    'gpu-vertex-buffer-layout': IntrinsicElementChildren
    'gpu-vertex-attribute': IntrinsicElementChildren
    'gpu-draw': IntrinsicElementChildren
    'gpu-vertex-buffer': IntrinsicElementChildren
    'gpu-uniform-buffer': IntrinsicElementChildren
  }
}

declare module JSX {
  interface IntrinsicElements extends reactgpu.IntrinsicElements {}
}
