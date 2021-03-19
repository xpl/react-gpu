import { loggers } from './loggers'
import { event } from './event'
import { Type, Command, RenderPass, RenderBundle, Root, RootProps, Texture } from './types'

export class InitError extends Error {}
export class InvalidProps extends Error {}

export function root(canvas: HTMLCanvasElement): Root {
  let log = loggers.default
  let invalid = true

  function invalidate() {
    if (!invalid) {
      invalid = true
      log.debug('invalidated')
    }
  }

  const commands: Command[] = []
  const canvasResized = event<() => void>()

  const root: Root = {
    type: Type.Root,
    props: { verbose: false },
    parent: undefined,
    limits: undefined,
    canvas,
    swapChain: { type: Type.SwapChain, props: { format: 'preferred' }, children: [] },
    features: [],
    children: commands,
    currentRenderBundle: undefined,
    invalidate,
    canvasResized,
    encodeAndSubmit,
    setProps(props: RootProps) {
      log = loggers[props.verbose ? 'verbose' : 'default']
      if (root.props.powerPreference !== props.powerPreference) {
        root.props.powerPreference = props.powerPreference
        invalidate()
      }
      return root
    }
  }

  let context: GPUCanvasContext
  let adapter: GPUAdapter | null | undefined
  let device: GPUDevice
  let swapChainPreferredFormat: GPUTextureFormat
  let validating: Promise<void> | undefined

  function validateDevice() {
    validating ||= Promise.resolve()
      .then(async () => {
        const features = root.features.map(f => f.props.name)
        log.debug('initializing adapter & device', features)

        context = (canvas.getContext('gpupresent') as unknown) as GPUCanvasContext
        if (!context || !navigator.gpu) throw new InitError('Your browser does not support WebGPU')

        adapter = await navigator.gpu.requestAdapter({
          powerPreference: root.props.powerPreference
        })
        if (!adapter) throw new InitError('Failed to init WebGPU adapter!')

        device = (await adapter.requestDevice(({
          nonGuaranteedLimits: root.limits?.props,
          nonGuaranteedFeatures: features
        } as unknown) as GPUDeviceDescriptor))!
        if (!device) throw new InitError('Failed to init WebGPU device!')

        device.addEventListener('uncapturederror', error => log.error(error))

        swapChainPreferredFormat = await context.getSwapChainPreferredFormat(
          (adapter as unknown) as GPUDevice
        )
        invalid = false
        validating = undefined
        log.debug('WebGPU initialized')

        encodeAndSubmit()
      })
      .catch(e => {
        log.error(e)
        throw e
      })
  }

  function validateSwapChain() {
    const { swapChain } = root
    if (!swapChain.handle) {
      let { format } = root.swapChain.props
      format = format === 'preferred' ? swapChainPreferredFormat : format
      log.debug('configuring swap chain', format, swapChain.props)
      swapChain.handle = context.configureSwapChain({
        device,
        ...swapChain.props,
        format
      })
    }
    return swapChain.handle
  }

  function validateTexture(t: Texture): GPUTextureView {
    let { view } = t
    if (view === undefined) {
      const { props } = t
      let size: number[]
      let onResize: () => void
      if (props.fullScreen) {
        size = [canvas.width, canvas.height, 1]
      } else if (props.width !== undefined) {
        size = [props.width, props.height!, props.depthOrArrayLayers!]
      } else {
        throw new InvalidProps('should specify either dimensions or fullScreen for textures')
      }
      log.debug('createTexture', size, t.props)
      view = t.view = (t.handle = device.createTexture({ ...t.props, size })).createView()
      t.invalidate = () => {
        if (t.invalidate) canvasResized.off(t.invalidate)
        t.handle!.destroy()
        t.handle = undefined
        t.view = undefined
      }
      if (props.fullScreen) {
        canvasResized.on(t.invalidate)
      }
    }
    return view
  }

  function encodeAndSubmit() {
    if (invalid) {
      validateDevice()
    } else {
      const commandBuffers: GPUCommandBuffer[] = []

      for (const command of commands) {
        const commandEncoder = device.createCommandEncoder(command.props)
        for (const renderPass of command.children) {
          withAttachments(renderPass, props => {
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

  function withAttachments(
    renderPass: RenderPass,
    encodePass: (renderPass: GPURenderPassDescriptor) => void
  ) {
    const swapChainAttachment = validateSwapChain().getCurrentTexture().createView()
    encodePass({
      ...renderPass.props,
      colorAttachments: renderPass.colorAttachments.map(att => ({
        ...att.props,
        attachment: att.children[0] ? validateTexture(att.children[0]) : swapChainAttachment
      })),
      depthStencilAttachment:
        renderPass.depthStencilAttachment && renderPass.depthStencilAttachment.children[0]
          ? {
              ...renderPass.depthStencilAttachment.props,
              attachment: validateTexture(renderPass.depthStencilAttachment.children[0])
            }
          : undefined
    })
  }

  return root
}
