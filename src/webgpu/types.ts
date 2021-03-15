export const enum Type {
  Root = 0,
  Command,
  RenderPass,
  ColorAttachment,
  DepthStencilAttachment,
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

export const defaultProps = {
  [Type.Root]: asDefaults<object>({}),
  [Type.Command]: asDefaults<GPUCommandEncoderDescriptor>({}),
  [Type.RenderPass]: asDefaults<reactgpu.RenderPassProps>({ colorAttachments: [] }),
  [Type.ColorAttachment]: asDefaults<reactgpu.ColorAttachmentProps>({
    attachment: (undefined as unknown) as GPUTextureView
  }),
  [Type.DepthStencilAttachment]: asDefaults<reactgpu.DepthStencilAttachmentProps>({
    attachment: (undefined as unknown) as GPUTextureView
  }),
  [Type.RenderBundle]: asDefaults<reactgpu.RenderBundleProps>({ colorFormats: [] }),
  [Type.Pipeline]: asDefaults<object>({}),
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
  indexInParent: number
  props: reactgpu.ReplaceIterableWithArray<reactgpu.OriginalType<typeof defaultProps[T]>>
  children: Child[]
  currentRenderBundle?: RenderBundle
}

export type Root = Descriptor<Type.Root, Command>
export type Command = Descriptor<Type.Command, RenderPass>
export type ColorAttachment = Descriptor<Type.ColorAttachment>
export type DepthStencilAttachment = Descriptor<Type.DepthStencilAttachment>
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
