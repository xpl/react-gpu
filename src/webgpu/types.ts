import { Subtract, RequiredKeys } from 'utility-types'

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
  BindUniform,
  UniformBuffer,
  ColorState,
  ShaderModule,
  VertexBufferLayout,
  VertexAttribute,
  VertexBuffer,
  Draw,
  MAX
}

const asDefaults = <T>(props: reactgpu.PropsMadeOptional<T>) => props

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
  [Type.RenderBundle]: asDefaults<reactgpu.RenderBundleProps>({}),
  [Type.Pipeline]: asDefaults<reactgpu.RenderPipelineProps>({
    vertexStage: (undefined as unknown) as GPUProgrammableStageDescriptor,
    colorStates: [],
    format: (undefined as unknown) as GPUTextureFormat
  }),
  [Type.BindUniform]: asDefaults<object>({}),
  [Type.UniformBuffer]: asDefaults<object>({}),
  [Type.ColorState]: asDefaults<object>({}),
  [Type.ShaderModule]: asDefaults<object>({}),
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
  props: reactgpu.ReplaceIterableWithArray<reactgpu.OriginalType<typeof defaultPropsMap[T]>>
  parent?: Descriptor
  root?: Root
  children: Child[]
  currentRenderBundle?: RenderBundle
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
export type Pipeline = Descriptor<Type.Pipeline>
export type BindUniform = Descriptor<Type.BindUniform>
export type UniformBuffer = Descriptor<Type.UniformBuffer>
export type ColorState = Descriptor<Type.ColorState>
export type ShaderModule = Descriptor<Type.ShaderModule>
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
  Map<BindUniform> &
  Map<UniformBuffer> &
  Map<ColorState> &
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
    format: 'bgra8unorm',
    formatVersion: 0
  },
  [Type.Texture]: {
    format: 'bgra8unorm',
    formatVersion: 0
  },
  [Type.RenderPass]: {
    colorAttachments: [],
    colorFormats: [],
    depthStencilFormat: 'depth24unorm-stencil8',
    formatVersion: 0
  },
  [Type.RenderBundle]: {
    formatVersion: 0
  },
  [Type.Root]: (undefined as unknown) as Root // we never create root via `makeDescriptor`, so it's fine
} as NonEmptyAdditonalKeys

export const makeDescriptor = (type: Type, root: Root, props: object): Descriptor => ({
  type,
  root,
  props: { ...defaultProps[type], ...props },
  parent: undefined,
  children: [],
  currentRenderBundle: undefined,
  ...defaults[type]
})
