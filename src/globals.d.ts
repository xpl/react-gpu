declare module reactgpu {
  type ReplaceIterableWithArray<T> = {
    [P in keyof T]: T[P] extends string ? T[P] : T[P] extends Iterable<infer Elem> ? Elem[] : T[P]
  }

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

  type OmitPubliclyButRequireInternally<T, K> = Omit<T, K> & { __omitted?: Pick<T, K> }

  type DepthStencilStateProps = OmitPubliclyButRequireInternally<GPUDepthStencilState, 'format'>

  type ColorTargetStateProps = {
    writeMask?: GPUColorWriteFlags
    alphaBlendOp?: GPUBlendOperation
    alphaBlendSrc?: GPUBlendFactor
    alphaBlendDst?: GPUBlendFactor
    colorBlendOp?: GPUBlendOperation
    colorBlendSrc?: GPUBlendFactor
    colorBlendDst?: GPUBlendFactor
  }

  type RenderBundleProps = OmitPubliclyButRequireInternally<
    GPURenderBundleEncoderDescriptor,
    'colorFormats' | 'depthStencilFormat' | 'sampleCount' // auto-taken from attachments
  >

  type ShaderModuleProps = OmitPubliclyButRequireInternally<GPUShaderModuleDescriptor, 'code'> & {
    onCompilationInfo?: (info: GPUCompilationInfo) => void
  }

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
    'gpu-pipeline': GPUPrimitiveState & IntrinsicElementChildren
    'gpu-multisample': GPUMultisampleState
    'gpu-depth-stencil': DepthStencilStateProps
    'gpu-color-target': ColorTargetStateProps & IntrinsicElementChildren
    'gpu-bind-uniform': IntrinsicElementChildren
    'gpu-shader-module': ShaderModuleProps & { children: string }
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
