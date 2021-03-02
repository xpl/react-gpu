import { PromiseType } from 'utility-types'

export const enum Type {
  Command = 1,
  RenderPass,
  RenderBundle,
  Draw
}

export type Descriptor = { type: Type; children: Descriptor[] }
export type Command = Descriptor & { children: RenderPass[] }
export type RenderPass = Descriptor & { children: RenderBundle[] }
export type RenderBundle = Descriptor & { children: Draw[] }
export type Draw = Descriptor & {}

export class InitError extends Error {}

export type InitOptions = {
  adapter?: Partial<GPURequestAdapterOptions>
  device?: Partial<GPUDeviceDescriptor>
  swapChain?: Partial<GPUSwapChainDescriptor>
  depthStencilTexture?: Partial<GPUTextureDescriptor>
}

export async function init(canvas: HTMLCanvasElement, options?: InitOptions) {
  const context = (canvas.getContext('gpupresent') as unknown) as GPUCanvasContext
  if (!context) throw new InitError('Your browser does not support WebGPU')

  const adapter = navigator.gpu && (await navigator.gpu.requestAdapter(options?.adapter))
  const device = (adapter && (await adapter.requestDevice(options?.device)))!
  if (!device) throw new InitError('Failed to init WebGPU device!')

  device.addEventListener('uncapturederror', error => console.error(error))

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
    console.debug('[react-gpu] created depth/stencil of', desc.size)
  }

  console.debug('[react-gpu] WebGPU initialized')

  return {
    context,
    adapter,
    device,
    swapChain,
    colorFormat,
    depthStencilFormat,
    commands: [] as Command[],
    get depthStencilAttachment() {
      return depthStencilAttachment
    },
    canvasResized
  }
}

export type Context = PromiseType<ReturnType<typeof init>>
