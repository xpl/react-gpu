export const enum Type {
  Root = 0,
  Command = 1,
  RenderPass,
  ColorAttachment,
  DepthStencilAttachment,
  RenderBundle,
  Draw
}

type ReplaceIterableWithArray<T> = {
  [P in keyof T]: T[P] extends string ? T[P] : T[P] extends Iterable<infer Elem> ? Elem[] : T[P]
}

export type Descriptor<T = Type, Props = object, Child = unknown> = {
  type: T
  indexInParent: number
  props: ReplaceIterableWithArray<Props>
  children: Child[]
}

export type Root = Descriptor<Type.Root, unknown, Command>

export type Command = Descriptor<Type.Command, GPUCommandEncoderDescriptor, RenderPass>

export type ColorAttachment = Descriptor<Type.ColorAttachment, reactgpu.ColorAttachmentProps>

export type DepthStencilAttachment = Descriptor<
  Type.DepthStencilAttachment,
  reactgpu.DepthStencilAttachmentProps
>

export type RenderPass = Descriptor<Type.RenderPass, reactgpu.RenderPassProps, RenderBundle>

export type RenderBundle = Descriptor<Type.RenderBundle, GPURenderBundleDescriptor, Draw> & {
  bundle: GPURenderBundle
  dirty: false
}

export type Draw = Descriptor<Type.Draw> & {}
