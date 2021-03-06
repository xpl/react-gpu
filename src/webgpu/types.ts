import { Subtract, RequiredKeys } from 'utility-types'
import { assertRecordType } from '../common'
import type { ManagedBuffer } from './buffer'
import type { ManagedShader } from './shader'

export const enum Type {
  Root = 0,
  Limits,
  Feature,
  Command,
  RenderPass,
  ColorAttachment,
  DepthStencilAttachment,
  SwapChain,
  Texture,
  RenderBundle,
  RenderPipeline,
  MultisampleState,
  ColorTargetState,
  DepthStencilState,
  ShaderModule,
  BindGroupLayout,
  BindBuffer,
  BindGroup,
  UniformBuffer,
  VertexBufferLayout,
  VertexAttribute,
  VertexBuffer,
  Draw,
  MAX
}

const placeholderColorFormat = 'bgra8unorm'
const placeholderDepthStencilFormat = 'depth24unorm-stencil8'
type OriginalType<T> = T extends { __originalType?: infer U } ? (unknown extends U ? T : U) : T
type Dropped<T> = T extends { __dropped?: infer U } ? (unknown extends U ? {} : U) : {}

// Iterable<number> → number[]
type HydrateIterables<T, Props extends T> = {
  [P in keyof T]: T[P] extends Iterable<infer Elem>
    ? Props[P] extends Array<Elem>
      ? Elem[]
      : T[P]
    : T[P]
}

const asDefaults = <T = object>() => <Props extends Dropped<T>>(
  props: Props
): Props & { __originalType?: T & HydrateIterables<Dropped<T>, Props> } => props

export type RootProps = GPURequestAdapterOptions & { verbose: boolean }

export const defaultPropsMap = assertRecordType<Type>()({
  [Type.Root]: asDefaults<RootProps>()({}),
  [Type.Limits]: asDefaults<GPULimits>()({}),
  [Type.Feature]: asDefaults<reactgpu.FeatureProps>()({}),
  [Type.Command]: asDefaults<GPUCommandEncoderDescriptor>()({}),
  [Type.RenderPass]: asDefaults<reactgpu.RenderPassProps>()({
    colorAttachments: [],
    depthStencilAttachment: undefined
  }),
  [Type.ColorAttachment]: asDefaults<reactgpu.ColorAttachmentProps>()({
    attachment: (undefined as unknown) as GPUTextureView
  }),
  [Type.DepthStencilAttachment]: asDefaults<reactgpu.DepthStencilAttachmentProps>()({
    attachment: (undefined as unknown) as GPUTextureView
  }),
  [Type.SwapChain]: asDefaults<reactgpu.SwapChainProps>()({
    device: (undefined as unknown) as GPUDevice
  }),
  [Type.Texture]: asDefaults<reactgpu.TextureProps>()({
    size: [-1, -1, -1]
  }),
  [Type.RenderBundle]: asDefaults<reactgpu.RenderBundleProps>()({
    colorFormats: [],
    depthStencilFormat: undefined,
    sampleCount: undefined
  }),
  [Type.RenderPipeline]: asDefaults<reactgpu.RenderPipelineProps>()({}),
  [Type.ColorTargetState]: asDefaults<reactgpu.ColorTargetStateProps>()({}),
  [Type.MultisampleState]: asDefaults<GPUMultisampleState>()({}),
  [Type.DepthStencilState]: asDefaults<reactgpu.DepthStencilStateProps>()({
    format: placeholderDepthStencilFormat
  }),
  [Type.ShaderModule]: asDefaults<reactgpu.ShaderModuleProps>()({
    code: ''
  }),
  [Type.BindGroupLayout]: asDefaults<object>()({}),
  [Type.BindBuffer]: asDefaults<reactgpu.BindBufferProps>()({
    binding: -1 // computed
  }),
  [Type.BindGroup]: asDefaults<reactgpu.BindGroupProps>()({
    set: -1 // computed
  }),
  [Type.UniformBuffer]: asDefaults<reactgpu.UniformBufferProps>()({
    binding: -1 // computed
  }),
  [Type.VertexBufferLayout]: asDefaults<reactgpu.VertexBufferLayoutProps>()({
    attributes: [],
    arrayStride: -1 // computed
  }),
  [Type.VertexAttribute]: asDefaults<reactgpu.VertexAttributeProps>()({
    offset: -1, // computed
    shaderLocation: -1 // computed
  }),
  [Type.VertexBuffer]: asDefaults<reactgpu.BufferProps>()({
    slot: -1 // computed
  }),
  [Type.Draw]: asDefaults<reactgpu.DrawProps>()({}),
  [Type.MAX]: {}
} as const)

export const defaultProps = Array.from({
  ...defaultPropsMap,
  length: Type.MAX
})

export type Descriptor<T extends Type = Type> = {
  type: T
  props: OriginalType<typeof defaultPropsMap[T]>
  parent?: Descriptor
  first?: Descriptor
  last?: Descriptor
  prev?: Descriptor
  next?: Descriptor
}

export type Root = Descriptor<Type.Root> & {
  readonly canvas: HTMLCanvasElement
  commands?: Command[]
  swapChain: SwapChain
  invalidate(): void
  canvasResized(): void
  encodeAndSubmit(): void
  setProps(props: RootProps): Root
}
export type Limits = Descriptor<Type.Limits>
export type Feature = Descriptor<Type.Feature>
export type Command = Descriptor<Type.Command>
export type ColorAttachment = Descriptor<Type.ColorAttachment>
export type DepthStencilAttachment = Descriptor<Type.DepthStencilAttachment>
export type SwapChain = Descriptor<Type.SwapChain> & {
  handle?: GPUSwapChain
  view?: GPUTextureView
  format: GPUTextureFormat
  formatHash: number
}
export type Texture = Descriptor<Type.Texture> & {
  handle?: GPUTexture
  view?: GPUTextureView
  format: GPUTextureFormat
  formatHash: number
  invalidate?: () => void
}
export type RenderPass = Descriptor<Type.RenderPass> & {
  colorFormats: GPUTextureFormat[]
  depthStencilFormat: GPUTextureFormat
  formatHash: number
}
export type RenderBundle = Descriptor<Type.RenderBundle> & {
  handle?: GPURenderBundle
  formatHash: number
}
export type RenderPipeline = Descriptor<Type.RenderPipeline> & {
  handle?: GPURenderPipeline
  pipelineLayout?: GPUPipelineLayout
  bindGroupLayouts: GPUBindGroupLayout[]
  drawCalls?: Draw[]
  drawCallsInvalid: boolean
  gpuProps: GPURenderPipelineDescriptorNew & {
    vertex: { buffers: GPUVertexBufferLayout[] }
  }
}
export type ColorTargetState = Descriptor<Type.ColorTargetState> & {
  gpuProps: GPUColorTargetState
}
export type MultisampleState = Descriptor<Type.MultisampleState>
export type DepthStencilState = Descriptor<Type.DepthStencilState>
export type ShaderModule = Descriptor<Type.ShaderModule> & {
  managed?: ManagedShader
}
export type BindGroupLayout = Descriptor<Type.BindGroupLayout> & {
  handle?: GPUBindGroupLayout
}
export type BindBuffer = Descriptor<Type.BindBuffer>
export type BindGroup = Descriptor<Type.BindGroup> & {
  handle?: GPUBindGroup
  layout?: GPUBindGroupLayout
}
export type VertexBufferLayout = Descriptor<Type.VertexBufferLayout> & {
  attributes?: GPUVertexAttribute[]
}
export type VertexAttribute = Descriptor<Type.VertexAttribute>
export type VertexBuffer = Descriptor<Type.VertexBuffer> & {
  managed?: ManagedBuffer
  data: reactgpu.BufferData
}
export type UniformBuffer = Descriptor<Type.UniformBuffer> & {
  managed?: ManagedBuffer
  data: reactgpu.BufferData
}

export type SetVertexBufferArgs = Parameters<GPURenderBundleEncoder['setVertexBuffer']>
export type SetBindGroupArgs = [
  index: number,
  bindGroup: GPUBindGroup,
  dynamicOffsets?: Iterable<number>
]

export type Draw = Descriptor<Type.Draw> & {
  args: Parameters<GPURenderBundleEncoder['draw']>
  vertexBuffersArgs: SetVertexBufferArgs[]
  bindGroupsArgs: SetBindGroupArgs[]
  invalid: boolean
}

type Map<From> = From extends Descriptor<infer T> ? Pick<{ [K in Type]: From }, T> : never

export type DescriptorType = Map<Root> &
  Map<Limits> &
  Map<Feature> &
  Map<Command> &
  Map<ColorAttachment> &
  Map<DepthStencilAttachment> &
  Map<SwapChain> &
  Map<Texture> &
  Map<RenderPass> &
  Map<RenderBundle> &
  Map<RenderPipeline> &
  Map<ColorTargetState> &
  Map<MultisampleState> &
  Map<DepthStencilState> &
  Map<BindGroupLayout> &
  Map<BindBuffer> &
  Map<BindGroup> &
  Map<UniformBuffer> &
  Map<ShaderModule> &
  Map<VertexBufferLayout> &
  Map<VertexAttribute> &
  Map<VertexBuffer> &
  Map<Draw> &
  Map<Descriptor<Type.MAX>>

type _AssertMapExhaustiveness = { [K in Type]: DescriptorType[Type] }

type AdditionalKeys<T extends Type> = Subtract<DescriptorType[T], Descriptor>

type EmptyObject = { [K in any]: never }

type NonEmptyAdditonalKeys = {
  [K in Type as RequiredKeys<AdditionalKeys<K>> extends EmptyObject ? never : K]: AdditionalKeys<K>
}

const defaults: { [K in Type]?: object } = {
  [Type.SwapChain]: {
    format: placeholderColorFormat,
    formatHash: 0
  },
  [Type.Texture]: {
    format: placeholderColorFormat,
    formatHash: 0
  },
  [Type.RenderPass]: {
    colorFormats: [],
    depthStencilFormat: placeholderDepthStencilFormat,
    formatHash: 0
  },
  [Type.RenderBundle]: {
    formatHash: 0
  },
  [Type.RenderPipeline]: {
    bindGroupLayouts: [],
    drawCallsInvalid: false,
    gpuProps: {
      vertex: {
        module: (undefined as unknown) as GPUShaderModule,
        entryPoint: '',
        buffers: []
      },
      layout: undefined
    }
  },
  [Type.ColorTargetState]: {
    gpuProps: {
      format: placeholderColorFormat,
      blend: {
        color: {},
        alpha: {}
      }
    }
  },
  [Type.VertexAttribute]: {
    attributes: undefined
  },
  [Type.VertexBuffer]: {
    data: []
  },
  [Type.UniformBuffer]: {
    data: []
  },
  [Type.Draw]: {
    args: [-1, undefined, undefined, undefined],
    vertexBuffersArgs: [],
    bindGroupsArgs: [],
    invalid: true
  },
  [Type.Root]: (undefined as unknown) as Root // we never create root via `makeDescriptor`, so it's fine
} as NonEmptyAdditonalKeys

export const makeDescriptor = (type: Type, props: object): Descriptor => ({
  type,
  props: { ...defaultProps[type], ...props },
  parent: undefined,
  ...defaults[type]
})
