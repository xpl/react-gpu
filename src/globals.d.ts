declare module reactgpu {
  type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

  type BufferData = ArrayBufferLike | TypedArray | Iterable<number>

  // Helpers for omitting/optionalizing some fields from original WebGPU definitions to make
  // React props from them. We save dropped fields in __dropped, to recover the original type later
  // when we actually instantiating the descriptor structures.
  type Drop<T, K> = Omit<T, K> & { __dropped?: Pick<T, K> }
  type Optional<T, K> = Omit<T, K> & Partial<Pick<T, K>> & { __dropped?: Pick<T, K> }

  type ColorAttachmentProps = Drop<GPURenderPassColorAttachmentDescriptor, 'attachment'>

  type DepthStencilAttachmentProps = Drop<
    GPURenderPassDepthStencilAttachmentDescriptor,
    'attachment'
  >

  type TextureProps = Drop<GPUTextureDescriptor, 'size'> &
    Partial<GPUExtent3DDict> & { fullScreen?: boolean }

  type SwapChainProps = Drop<Omit<GPUSwapChainDescriptor, 'format'>, 'device'> & {
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

  type JSXElement = JSX.Element | null
  type JSXChildren = { children?: JSXElement | JSXElement[] }

  type FeatureProps = { name: GPUExtensionName }

  type VertexBufferLayoutProps = Optional<Drop<GPUVertexBufferLayout, 'attributes'>, 'arrayStride'>

  type VertexAttributeProps = Optional<GPUVertexAttribute, 'offset' | 'shaderLocation'>

  type BindGroupLayoutEntryProps = Optional<
    Pick<GPUBindGroupLayoutEntry, 'binding' | 'visibility'>,
    'binding'
  >

  type BindGroupProps = Drop<
    {
      set: number
    },
    'set'
  >

  type UniformBufferProps = Drop<
    {
      binding: number
      offset?: number
      size?: number
    },
    'binding'
  >

  type BindBufferProps = GPUBufferBindingLayout & BindGroupLayoutEntryProps

  type DrawProps = {
    vertexCount: number
    instanceCount?: number
    firstVertex?: number
    firstInstance?: number
  }

  type BufferProps = Optional<
    {
      slot: number
      offset?: number
      size?: number
    },
    'slot'
  >

  interface IntrinsicElements {
    'gpu-feature': FeatureProps
    'gpu-limits': GPULimits
    'gpu-command': GPUCommandEncoderDescriptor & JSXChildren
    'gpu-render-pass': RenderPassProps & JSXChildren
    'gpu-color-attachment': ColorAttachmentProps & JSXChildren
    'gpu-depth-stencil-attachment': DepthStencilAttachmentProps & JSXChildren
    'gpu-texture': TextureProps
    'gpu-swap-chain': SwapChainProps
    'gpu-render-bundle': RenderBundleProps & JSXChildren
    'gpu-render-pipeline': RenderPipelineProps & JSXChildren
    'gpu-multisample': GPUMultisampleState
    'gpu-depth-stencil': DepthStencilStateProps
    'gpu-color-target': ColorTargetStateProps & JSXChildren
    'gpu-bind-buffer': BindBufferProps & JSXChildren
    'gpu-shader-module': ShaderModuleProps & { children: string }
    'gpu-vertex-buffer-layout': VertexBufferLayoutProps & JSXChildren
    'gpu-vertex-attribute': VertexAttributeProps
    'gpu-bind-group-layout': JSXChildren
    'gpu-draw': DrawProps & JSXChildren
    'gpu-bind-group': BindGroupProps & JSXChildren
    'gpu-vertex-buffer': BufferProps & { children: BufferData }
    'gpu-uniform-buffer': UniformBufferProps & { children: BufferData }
  }
}

declare module JSX {
  interface IntrinsicElements extends reactgpu.IntrinsicElements {}
}

interface Window {
  __debugGpuRenderReact: unknown
}
