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
  Draw
}

const asDefaults = <T>(props: reactgpu.PropsMadeOptional<T>) => props

export type RootProps = GPURequestAdapterOptions & { verbose: boolean }

export const defaultProps = {
  [Type.Root]: asDefaults<RootProps>({}),
  [Type.Limits]: asDefaults<GPULimits>({}),
  [Type.Feature]: asDefaults<reactgpu.FeatureProps>({}),
  [Type.Command]: asDefaults<GPUCommandEncoderDescriptor>({}),
  [Type.RenderPass]: asDefaults<reactgpu.RenderPassProps>({ colorAttachments: [] }),
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
  [Type.Draw]: asDefaults<object>({})
} as const

const _assertDefaultPropsExhaustiveness: { [K in Type]: unknown } = defaultProps

export type Descriptor<T extends Type = Type, Child = unknown> = {
  type: T
  props: reactgpu.ReplaceIterableWithArray<reactgpu.OriginalType<typeof defaultProps[T]>>
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
export type ColorAttachment = Descriptor<Type.ColorAttachment, SwapChain>
export type DepthStencilAttachment = Descriptor<Type.DepthStencilAttachment, Texture>
export type SwapChain = Descriptor<Type.SwapChain> & { handle?: GPUSwapChain }
export type Texture = Descriptor<Type.Texture>
export type RenderPass = Descriptor<Type.RenderPass, RenderBundle>
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

export const current = {
  swapChain: {},
  depthStencilTexture: {}
}
