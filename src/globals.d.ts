declare module reactgpu {
  type ReplaceIterableWithArray<T> = {
    [P in keyof T]: T[P] extends string ? T[P] : T[P] extends Iterable<infer Elem> ? Elem[] : T[P]
  }

  type Optional<T, K> = Omit<T, K> &
    Partial<Pick<T, K>> & {
      __originalType?: T
      __madeOptional?: Pick<T, K> & { __originalType?: T }
    }

  type PropsMadeOptional<T> = T extends { __madeOptional?: infer U }
    ? unknown extends U
      ? Partial<T> & { __originalType?: T }
      : U
    : Partial<T> & { __originalType?: T }

  type OriginalType<T> = T extends { __originalType?: infer U } ? (unknown extends U ? T : U) : T

  type ColorAttachmentProps = Omit<GPURenderPassColorAttachmentDescriptor, 'attachment'>

  type DepthStencilAttachmentProps = Omit<
    GPURenderPassDepthStencilAttachmentDescriptor,
    'attachment'
  >

  type TextureProps = Omit<GPUTextureDescriptor, 'size'> &
    Partial<GPUExtent3DDict> & { fullScreen?: boolean }

  type SwapChainProps = Omit<GPUSwapChainDescriptor, 'device' | 'format'> & {
    format: GPUTextureFormat | 'preferred'
  }

  type RenderPassProps = Omit<
    GPURenderPassDescriptor,
    'colorAttachments' | 'depthStencilAttachment'
  >

  type RenderPipelineProps = Optional<
    GPURenderPipelineDescriptor & GPURasterizationStateDescriptor & GPUDepthStencilStateDescriptor,
    'vertexStage' | 'colorStates' | 'format'
  >

  type RenderBundleProps = Omit<
    GPURenderBundleEncoderDescriptor,
    'colorFormats' | 'depthStencilFormat' | 'sampleCount' // auto-taken from attachments
  >

  type IntrinsicElementChildren = {
    children?: JSX.Element | JSX.Element[]
  }

  type FeatureProps = { name: GPUExtensionName }

  interface IntrinsicElements {
    'gpu-feature': FeatureProps
    'gpu-limits': GPULimits
    'gpu-command': GPUCommandEncoderDescriptor & IntrinsicElementChildren
    'gpu-render-pass': RenderPassProps & IntrinsicElementChildren
    'gpu-color-attachment': ColorAttachmentProps & IntrinsicElementChildren
    'gpu-depth-stencil-attachment': DepthStencilAttachmentProps & IntrinsicElementChildren
    'gpu-texture': TextureProps
    'gpu-swap-chain': SwapChainProps
    'gpu-render-bundle': RenderBundleProps & IntrinsicElementChildren
    'gpu-pipeline': RenderPipelineProps & IntrinsicElementChildren
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

interface Window {
  __debugGpuRenderReact: unknown
}
