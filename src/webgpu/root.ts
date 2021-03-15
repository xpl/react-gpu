import { loggers } from './loggers'
import { Type, Command, RenderBundle, Root, RootProps } from './types'

export class InitError extends Error {}

export function root(canvas: HTMLCanvasElement): Root {
  let log = loggers.default

  const commands: Command[] = []

  const root: Root = {
    type: Type.Root,
    props: { verbose: false },
    parent: undefined,
    invalid: false,
    limits: undefined,
    swapChain: undefined,
    swapChainInvalid: false,
    extensions: [],
    children: commands,
    currentRenderBundle: undefined,
    canvasResized,
    encodeAndSubmit,
    setProps(props: RootProps) {
      log = loggers[root.props?.verbose ? 'verbose' : 'default']
      if (root.props.powerPreference !== props.powerPreference) {
        root.invalid = true
        root.props.powerPreference = props.powerPreference
      }
      return root
    }
  }

  let context: GPUCanvasContext
  let adapter: GPUAdapter | null | undefined
  let device: GPUDevice
  let swapChain: GPUSwapChain
  let swapChainPreferredFormat: GPUTextureFormat
  let validating: Promise<void> | undefined

  function validateDevice() {
    validating = Promise.resolve()
      .then(async () => {
        context = (canvas.getContext('gpupresent') as unknown) as GPUCanvasContext
        if (!context || !navigator.gpu) throw new InitError('Your browser does not support WebGPU')

        adapter = await navigator.gpu.requestAdapter({
          powerPreference: root.props.powerPreference
        })
        if (!adapter) throw new InitError('Failed to init WebGPU adapter!')

        device = (await adapter.requestDevice({
          limits: root.limits?.props,
          extensions: root.extensions
        }))!
        if (!device) throw new InitError('Failed to init WebGPU device!')

        device.addEventListener('uncapturederror', error => log.error(error))

        swapChainPreferredFormat = await context.getSwapChainPreferredFormat(
          (adapter as unknown) as GPUDevice
        )
        root.invalid = false
        log.debug('WebGPU initialized')

        encodeAndSubmit()
      })
      .catch(e => {
        log.error(e)
      })
      .finally(() => {
        validating = undefined
      })
  }

  function validateSwapChain() {
    if (!root.swapChainInvalid) {
      const format = root.swapChain?.props.format || 'preferred'
      swapChain = context.configureSwapChain({
        device,
        usage: GPUTextureUsage.RENDER_ATTACHMENT, // TODO: remove?
        ...root.swapChain?.props,
        format: format === 'preferred' ? swapChainPreferredFormat : format
      })
      root.swapChainInvalid = false
    }
    return swapChain
  }

  let depthStencilTexture: GPUTexture
  let depthStencilAttachment: GPUTextureView
  const depthStencilFormat: GPUTextureFormat = 'depth24plus-stencil8'

  function canvasResized() {}

  function encodeAndSubmit() {
    if (root.invalid && !validating) {
      validateDevice()
    } else {
      const commandBuffers: GPUCommandBuffer[] = []
      const swapChainAttachment = validateSwapChain().getCurrentTexture().createView()

      for (const command of commands) {
        const commandEncoder = device.createCommandEncoder(command.props)
        for (const renderPass of command.children) {
          injectDefaults(renderPass.props, swapChainAttachment, depthStencilAttachment, props => {
            const passEncoder = commandEncoder.beginRenderPass(props)
            passEncoder.executeBundles(renderPass.children.map(encodeRenderBundleIfNeeded))
            passEncoder.endPass()
          })
        }
        commandBuffers.push(commandEncoder.finish())
      }

      device.queue.submit(commandBuffers)
    }
  }

  function encodeRenderBundleIfNeeded(rb: RenderBundle) {
    if (rb.handle === undefined) {
      const encoder = device.createRenderBundleEncoder(rb.props)
      rb.handle = encoder.finish()
    }
    return rb.handle
  }

  function injectDefaults(
    renderPass: GPURenderPassDescriptor,
    colorAttachment: GPUTextureView,
    depthStencilAttachment: GPUTextureView,
    encodePass: (renderPass: GPURenderPassDescriptor) => void
  ) {
    for (const a of renderPass.colorAttachments || []) {
      a.attachment ||= colorAttachment
    }
    if (renderPass.depthStencilAttachment) {
      renderPass.depthStencilAttachment.attachment ||= depthStencilAttachment
    }
    encodePass(renderPass as GPURenderPassDescriptor)
    for (const a of renderPass.colorAttachments || []) {
      if (a.attachment === colorAttachment) a.attachment = (undefined as unknown) as GPUTextureView
    }
    if (renderPass.depthStencilAttachment?.attachment === depthStencilAttachment) {
      renderPass.depthStencilAttachment.attachment = (undefined as unknown) as GPUTextureView
    }
  }

  return root
}
