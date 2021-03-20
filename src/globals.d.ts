declare module reactgpu {
  // Helpers for omitting/optionalizing some fields from original WebGPU definitions to make
  // React props from them. We save dropped fields in __dropped, to recover the original type later
  // when we actually instantiating the descriptor structures.
  type Drop<T, K> = Omit<T, K> & { __dropped?: Pick<T, K> }
  type Optional<T, K> = Omit<T, K> & Partial<Pick<T, K>> & { __dropped?: Pick<T, K> }

  type ColorAttachmentProps = Drop<GPURenderPassColorAttachmentDescriptor, 'attachment'>

  type DepthStencilAttachmentProps = Omit<
    GPURenderPassDepthStencilAttachmentDescriptor,
    'attachment'
  >

  type TextureProps = Omit<GPUTextureDescriptor, 'size'> &
    Partial<GPUExtent3DDict> & { fullScreen?: boolean }

  type SwapChainProps = Omit<GPUSwapChainDescriptor, 'device' | 'format'> & {
    format: GPUTextureFormat | 'preferred'
  }

  type RenderPassProps = Drop<
    GPURenderPassDescriptor,
    'colorAttachments' | 'depthStencilAttachment'
  >

  type DepthStencilStateProps = Drop<GPUDepthStencilState, 'format'>

  type ColorTargetStateProps = {
    writeMask?: GPUColorWriteFlags
    alphaBlendOp?: GPUBlendOperation
    alphaBlendSrc?: GPUBlendFactor
    alphaBlendDst?: GPUBlendFactor
    colorBlendOp?: GPUBlendOperation
    colorBlendSrc?: GPUBlendFactor
    colorBlendDst?: GPUBlendFactor
  }

  type RenderBundleProps = Drop<
    GPURenderBundleEncoderDescriptor,
    'colorFormats' | 'depthStencilFormat' | 'sampleCount' // auto-taken from attachments
  >

  type RenderPipelineProps = GPUPrimitiveState

  type ShaderModuleProps = Drop<GPUShaderModuleDescriptor, 'code'> & {
    vertexEntryPoint?: string
    fragmentEntryPoint?: string
    onCompilationInfo?: (info: GPUCompilationInfo) => void
  }

  type IntrinsicElementChildren = {
    children?: JSX.Element | JSX.Element[]
  }

  type FeatureProps = { name: GPUExtensionName }

  type VertexBufferLayoutProps = Drop<GPUVertexBufferLayout, 'attributes'>

  type VertexAttributeProps = Optional<GPUVertexAttribute, 'offset'>

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
    'gpu-render-pipeline': RenderPipelineProps & IntrinsicElementChildren
    'gpu-multisample': GPUMultisampleState
    'gpu-depth-stencil': DepthStencilStateProps
    'gpu-color-target': ColorTargetStateProps & IntrinsicElementChildren
    'gpu-bind-uniform': IntrinsicElementChildren
    'gpu-shader-module': ShaderModuleProps & { children: string }
    'gpu-vertex-buffer-layout': VertexBufferLayoutProps & IntrinsicElementChildren
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
