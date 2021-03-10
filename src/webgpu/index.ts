import { Renderer } from 'react-dom'
import { PromiseType } from 'utility-types'
import { loggers } from './loggers'

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

export type ColorAttachment = Descriptor<
  Type.ColorAttachment,
  GPURenderPassColorAttachmentDescriptor
>

export type DepthStencilAttachment = Descriptor<
  Type.DepthStencilAttachment,
  GPURenderPassDepthStencilAttachmentDescriptor
>

export type RenderPass = Descriptor<Type.RenderPass, GPURenderPassDescriptor, RenderBundle>

export type RenderBundle = Descriptor<Type.RenderBundle, GPURenderBundleDescriptor, Draw> & {
  bundle: GPURenderBundle
  dirty: false
}

export type Draw = Descriptor<Type.Draw> & {}

export class InitError extends Error {}

export type InitOptions = {
  verbose: boolean
  adapter?: Partial<GPURequestAdapterOptions>
  device?: Partial<GPUDeviceDescriptor>
  swapChain?: Partial<GPUSwapChainDescriptor>
  depthStencilTexture?: Partial<GPUTextureDescriptor>
}

export const defaultAttachments = {
  color: {} as GPUTextureView,
  depthStencil: {} as GPUTextureView
}

export async function init(canvas: HTMLCanvasElement, options?: InitOptions) {
  const log = loggers[options?.verbose ? 'verbose' : 'default']

  const context = (canvas.getContext('gpupresent') as unknown) as GPUCanvasContext
  if (!context) throw new InitError('Your browser does not support WebGPU')

  const adapter = navigator.gpu && (await navigator.gpu.requestAdapter(options?.adapter))
  const device = (adapter && (await adapter.requestDevice(options?.device)))!
  if (!device) throw new InitError('Failed to init WebGPU device!')

  device.addEventListener('uncapturederror', error => log.error(error))

  const colorFormat = await context.getSwapChainPreferredFormat((adapter as unknown) as GPUDevice)
  const depthStencilFormat: GPUTextureFormat = 'depth24plus-stencil8'

  const swapChain = context.configureSwapChain({
    device,
    format: colorFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT, // means that it will go to screen
    ...options?.swapChain
  })

  let depthStencilTexture: GPUTexture
  let depthStencilAttachment: GPUTextureView

  function canvasResized() {
    const desc: GPUTextureDescriptor = {
      size: [canvas.width, canvas.height, 1],
      mipLevelCount: 1,
      sampleCount: 1,
      dimension: '2d',
      format: depthStencilFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      ...options?.depthStencilTexture
    }
    depthStencilTexture?.destroy()
    depthStencilTexture = device.createTexture(desc)
    depthStencilAttachment = depthStencilTexture.createView()
    log.debug('created depth/stencil of', desc.size)
  }

  const commands: Command[] = []

  function encodeAndSubmit() {
    const commandBuffers: GPUCommandBuffer[] = []
    const swapChainAttachment = swapChain.getCurrentTexture().createView()

    for (const command of commands) {
      const commandEncoder = device.createCommandEncoder(command.props)
      for (const renderPass of command.children) {
        withActualAttachments(renderPass.props, swapChainAttachment, depthStencilAttachment, () => {
          const passEncoder = commandEncoder.beginRenderPass(renderPass.props)
          passEncoder.executeBundles(renderPass.children.map((x: RenderBundle) => x.bundle))
          passEncoder.endPass()
        })
      }
      commandBuffers.push(commandEncoder.finish())
    }

    device.queue.submit(commandBuffers)
  }

  function withActualAttachments(
    renderPass: GPURenderPassDescriptor,
    colorAttachment: GPUTextureView,
    depthStencilAttachment: GPUTextureView,
    encodePass: () => void
  ) {
    for (const a of renderPass.colorAttachments || []) {
      if (a.attachment === defaultAttachments.color) a.attachment = colorAttachment
    }
    if (renderPass.depthStencilAttachment?.attachment === defaultAttachments.depthStencil) {
      renderPass.depthStencilAttachment.attachment = depthStencilAttachment
    }
    encodePass()
    for (const a of renderPass.colorAttachments || []) {
      if (a.attachment === colorAttachment) a.attachment = defaultAttachments.color
    }
    if (renderPass.depthStencilAttachment?.attachment === depthStencilAttachment) {
      renderPass.depthStencilAttachment.attachment = defaultAttachments.depthStencil
    }
  }

  log.debug('WebGPU initialized')

  return {
    context,
    adapter,
    device,
    swapChain,
    colorFormat,
    depthStencilFormat,
    type: Type.Root,
    props: {},
    indexInParent: -1,
    children: commands,
    get depthStencilAttachment() {
      return depthStencilAttachment
    },
    canvasResized,
    encodeAndSubmit
  }
}

export type Context = PromiseType<ReturnType<typeof init>>
