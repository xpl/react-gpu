import { Subtract } from 'utility-types'

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
  [Type.ColorAttachment]: asDefaults<reactgpu.ColorAttachmentProps>({
    attachment: (undefined as unknown) as GPUTextureView
  }),
  [Type.DepthStencilAttachment]: asDefaults<reactgpu.DepthStencilAttachmentProps>({
    attachment: (undefined as unknown) as GPUTextureView
  }),
  [Type.SwapChain]: asDefaults<reactgpu.SwapChainProps>({}),
  [Type.Texture]: asDefaults<reactgpu.TextureProps>({}),
  [Type.RenderBundle]: asDefaults<reactgpu.RenderBundleProps>({ colorFormats: [] }),
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
export type SwapChain = Descriptor<Type.SwapChain> & { handle?: GPUSwapChain }
export type Texture = Descriptor<Type.Texture> & {
  handle?: GPUTexture
  view?: GPUTextureView
  invalidate?: () => void
}
export type RenderPass = Descriptor<Type.RenderPass, RenderBundle> & {
  colorAttachments: ColorAttachment[]
  depthStencilAttachment?: DepthStencilAttachment
}
export type RenderBundle = Descriptor<Type.RenderBundle, Pipeline> & { handle?: GPURenderBundle }
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

const defaults: { [K in Type]: Subtract<DescriptorType[K], Descriptor> } = {
  // @ts-ignore
  [Type.Root]: {},
  [Type.Limits]: {},
  [Type.Feature]: {},
  [Type.Command]: {},
  [Type.RenderPass]: { colorAttachments: [] },
  [Type.ColorAttachment]: {},
  [Type.DepthStencilAttachment]: {},
  [Type.SwapChain]: {},
  [Type.Texture]: {},
  [Type.RenderBundle]: {},
  [Type.Pipeline]: {},
  [Type.BindUniform]: {},
  [Type.UniformBuffer]: {},
  [Type.ColorState]: {},
  [Type.ShaderModule]: {},
  [Type.VertexBufferLayout]: {},
  [Type.VertexAttribute]: {},
  [Type.VertexBuffer]: {},
  [Type.Draw]: {},
  [Type.MAX]: {}
}

export const makeDescriptor = (type: Type, root: Root, props: object): Descriptor => ({
  type,
  root,
  props: { ...defaultProps[type], ...props },
  parent: undefined,
  children: [],
  currentRenderBundle: undefined,
  ...defaults[type]
})
