import { Subtract, RequiredKeys, OptionalKeys } from 'utility-types'

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
  Pipeline,
  MultisampleState,
  ColorTargetState,
  DepthStencilState,
  ShaderModule,
  BindUniform,
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
type Omitted<T> = T extends { __omitted?: infer U } ? (unknown extends U ? {} : U) : {}

const asDefaults = <T = object>(
  props: Pick<T, OptionalKeys<T>> & Omitted<T>
): typeof props & { __originalType?: T & Omitted<T> } => props

export type RootProps = GPURequestAdapterOptions & { verbose: boolean }

export const defaultPropsMap = {
  [Type.Root]: asDefaults<RootProps>({}),
  [Type.Limits]: asDefaults<GPULimits>({}),
  [Type.Feature]: asDefaults<reactgpu.FeatureProps>({}),
  [Type.Command]: asDefaults<GPUCommandEncoderDescriptor>({}),
  [Type.RenderPass]: asDefaults<reactgpu.RenderPassProps>({}),
  [Type.ColorAttachment]: asDefaults<reactgpu.ColorAttachmentProps>({}),
  [Type.DepthStencilAttachment]: asDefaults<reactgpu.DepthStencilAttachmentProps>({}),
  [Type.SwapChain]: asDefaults<reactgpu.SwapChainProps>({}),
  [Type.Texture]: asDefaults<reactgpu.TextureProps>({}),
  [Type.RenderBundle]: asDefaults<reactgpu.RenderBundleProps>({
    colorFormats: [],
    depthStencilFormat: undefined,
    sampleCount: undefined
  }),
  [Type.Pipeline]: asDefaults<GPUPrimitiveState>({}),
  [Type.ColorTargetState]: asDefaults<reactgpu.ColorTargetStateProps>({}),
  [Type.MultisampleState]: asDefaults<GPUMultisampleState>({}),
  [Type.DepthStencilState]: asDefaults<reactgpu.DepthStencilStateProps>({
    format: placeholderDepthStencilFormat
  }),
  [Type.ShaderModule]: asDefaults<reactgpu.ShaderModuleProps>({
    code: ''
  }),
  [Type.BindUniform]: asDefaults<object>({}),
  [Type.UniformBuffer]: asDefaults<object>({}),
  [Type.VertexBufferLayout]: asDefaults<object>({}),
  [Type.VertexAttribute]: asDefaults<object>({}),
  [Type.VertexBuffer]: asDefaults<object>({}),
  [Type.Draw]: asDefaults<object>({}),
  [Type.MAX]: {}
} as const

export const defaultProps = Array.from({
  ...defaultPropsMap,
  length: Type.MAX
})

const _assertDefaultPropsExhaustiveness: { [K in Type]: unknown } = defaultPropsMap

export type Descriptor<T extends Type = Type, Child = unknown> = {
  type: T
  props: OriginalType<typeof defaultPropsMap[T]>
  parent?: Descriptor
  root?: Root
  children: Child[]
}

export type Root = Descriptor<Type.Root, Command> & {
  readonly canvas: HTMLCanvasElement
  limits?: Limits
  features: Feature[]
  swapChain: SwapChain
  invalidate(): void
  canvasResized(): void
  encodeAndSubmit(): void
  setProps(props: RootProps): Root
}
export type Limits = Descriptor<Type.Limits> & { root: Root }
export type Feature = Descriptor<Type.Feature> & { root: Root }
export type Command = Descriptor<Type.Command, RenderPass>
export type ColorAttachment = Descriptor<Type.ColorAttachment, Texture>
export type DepthStencilAttachment = Descriptor<Type.DepthStencilAttachment, Texture>
export type SwapChain = Descriptor<Type.SwapChain> & {
  handle?: GPUSwapChain
  view?: GPUTextureView
  format: GPUTextureFormat
  formatVersion: number
}
export type Texture = Descriptor<Type.Texture> & {
  handle?: GPUTexture
  view?: GPUTextureView
  format: GPUTextureFormat
  formatVersion: number
  invalidate?: () => void
}
export type RenderPass = Descriptor<Type.RenderPass, RenderBundle> & {
  colorAttachments: ColorAttachment[]
  depthStencilAttachment?: DepthStencilAttachment
  colorFormats: GPUTextureFormat[]
  depthStencilFormat: GPUTextureFormat
  formatVersion: 0
}
export type RenderBundle = Descriptor<Type.RenderBundle, Pipeline> & {
  handle?: GPURenderBundle
  formatVersion: number
}
export type Pipeline = Descriptor<Type.Pipeline, Draw> & {
  multisampleState?: MultisampleState
  depthStencilState?: DepthStencilState
  fragmentStates: ColorTargetState[]
  gpuProps: GPURenderPipelineDescriptorNew
  shaderModule?: ShaderModule
}
export type ColorTargetState = Descriptor<Type.ColorTargetState> & {
  gpuProps: GPUColorTargetState
}
export type MultisampleState = Descriptor<Type.MultisampleState>
export type DepthStencilState = Descriptor<Type.DepthStencilState>
export type ShaderModule = Descriptor<Type.ShaderModule> & {
  handle?: GPUShaderModule
}
export type BindUniform = Descriptor<Type.BindUniform>
export type UniformBuffer = Descriptor<Type.UniformBuffer>
export type VertexBufferLayout = Descriptor<Type.VertexBufferLayout>
export type VertexAttribute = Descriptor<Type.VertexAttribute>
export type VertexBuffer = Descriptor<Type.VertexBuffer>
export type Draw = Descriptor<Type.Draw>

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
  Map<Pipeline> &
  Map<ColorTargetState> &
  Map<MultisampleState> &
  Map<DepthStencilState> &
  Map<BindUniform> &
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
    formatVersion: 0
  },
  [Type.Texture]: {
    format: placeholderColorFormat,
    formatVersion: 0
  },
  [Type.RenderPass]: {
    colorAttachments: [],
    colorFormats: [],
    depthStencilFormat: placeholderDepthStencilFormat,
    formatVersion: 0
  },
  [Type.RenderBundle]: {
    formatVersion: 0
  },
  [Type.Pipeline]: {
    fragmentStates: [],
    gpuProps: {
      vertex: {
        module: (undefined as unknown) as GPUShaderModule,
        entryPoint: ''
      }
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
  [Type.Root]: (undefined as unknown) as Root // we never create root via `makeDescriptor`, so it's fine
} as NonEmptyAdditonalKeys

export const makeDescriptor = (type: Type, root: Root, props: object): Descriptor => ({
  type,
  root,
  props: { ...defaultProps[type], ...props },
  parent: undefined,
  children: [],
  ...defaults[type]
})
