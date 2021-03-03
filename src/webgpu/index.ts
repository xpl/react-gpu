import { PromiseType } from 'utility-types'
import { loggers } from './loggers'

export const enum Type {
  Command = 1,
  RenderPass,
  RenderBundle,
  Draw
}

export type Descriptor = { type: Type; props: unknown; children: Descriptor[] }
export type Command = Descriptor & { props: GPURenderPassDescriptor; children: RenderPass[] }
export type RenderPass = Descriptor & { props: GPURenderPassDescriptor; children: RenderBundle[] }
export type RenderBundle = Descriptor & {
  props: GPURenderBundleDescriptor
  children: Draw[]
  bundle: GPURenderBundle
}
export type Draw = Descriptor & {}

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

    for (const command of commands) {
      const commandEncoder = device.createCommandEncoder()
      for (const renderPass of command.children) {
        const swapChainAttachment = swapChain.getCurrentTexture().createView()

        for (const a of renderPass.props.colorAttachments || []) {
          if (a.attachment === defaultAttachments.color) {
            a.attachment = swapChainAttachment
          }
        }
        if (
          renderPass.props.depthStencilAttachment?.attachment === defaultAttachments.depthStencil
        ) {
          renderPass.props.depthStencilAttachment.attachment = depthStencilAttachment
        }

        const passEncoder = commandEncoder.beginRenderPass(renderPass.props)
        passEncoder.executeBundles(renderPass.children.map((x: RenderBundle) => x.bundle))
        passEncoder.endPass()

        for (const a of renderPass.props.colorAttachments || []) {
          if (a.attachment === swapChainAttachment) {
            a.attachment = defaultAttachments.color
          }
        }
        if (renderPass.props.depthStencilAttachment?.attachment === depthStencilAttachment) {
          renderPass.props.depthStencilAttachment.attachment = defaultAttachments.depthStencil
        }
      }
      commandBuffers.push(commandEncoder.finish())
    }

    device.queue.submit(commandBuffers)
  }

  log.debug('WebGPU initialized')

  return {
    context,
    adapter,
    device,
    swapChain,
    colorFormat,
    depthStencilFormat,
    commands,
    get depthStencilAttachment() {
      return depthStencilAttachment
    },
    canvasResized,
    encodeAndSubmit
  }
}

export type Context = PromiseType<ReturnType<typeof init>>
