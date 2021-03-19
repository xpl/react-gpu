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
    swapChain: {
      type: Type.SwapChain,
      props: { format: 'preferred' },
      format: 'bgra8unorm',
      formatVersion: 0,
      children: []
    },
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
            passEncoder.executeBundles(
              renderPass.children.map(rb => validateRenderBundle(rb, renderPass))
            )
            passEncoder.endPass()
          })
        }
        commandBuffers.push(commandEncoder.finish())
      }
      device.queue.submit(commandBuffers)
    }
  }

  function withAttachments(
    pass: RenderPass,
    encodePass: (renderPass: GPURenderPassDescriptor) => void
  ) {
    const swapChain = validateSwapChain()
    const colorAttachments: GPURenderPassColorAttachmentDescriptor[] = []
    pass.colorFormats = []
    pass.formatVersion = 0
    for (const att of pass.colorAttachments) {
      const texture = att.children[0] ? validateTexture(att.children[0]) : swapChain
      pass.colorFormats.push(texture.format)
      pass.formatVersion += texture.formatVersion
      colorAttachments.push({ ...att.props, attachment: texture.view })
    }
    let depthStencilAttachment: GPURenderPassDepthStencilAttachmentDescriptor | undefined
    if (pass.depthStencilAttachment?.children[0]) {
      const texture = validateTexture(pass.depthStencilAttachment.children[0])
      pass.depthStencilFormat = texture.format
      pass.formatVersion += texture.formatVersion
      depthStencilAttachment = {
        ...pass.depthStencilAttachment.props,
        attachment: texture.view
      }
    }
    encodePass({
      ...pass.props,
      colorAttachments,
      depthStencilAttachment
    })
  }

  function validateRenderBundle(bundle: RenderBundle, pass: RenderPass) {
    if (bundle.handle === undefined || bundle.formatVersion !== pass.formatVersion) {
      bundle.formatVersion = pass.formatVersion
      const props = bundle.props as GPURenderBundleEncoderDescriptor
      props.colorFormats = pass.colorFormats
      props.depthStencilFormat = pass.depthStencilFormat
      const encoder = device.createRenderBundleEncoder(props)
      bundle.handle = encoder.finish()
    }
    return bundle.handle
  }

  type ValidTexture = { format: GPUTextureFormat; view: GPUTextureView; formatVersion: number }

  function validateSwapChain(): ValidTexture {
    const { swapChain } = root
    let { handle } = swapChain
    if (!handle) {
      let { format } = root.swapChain.props
      const resolvedFormat = format === 'preferred' ? swapChainPreferredFormat : format
      if (swapChain.format !== resolvedFormat) {
        swapChain.format = resolvedFormat
        swapChain.formatVersion++
      }
      log.debug('configuring swap chain', format, swapChain.props)
      handle = swapChain.handle = context.configureSwapChain({
        device,
        ...swapChain.props,
        format: resolvedFormat
      })
    }
    swapChain.view = handle.getCurrentTexture().createView()
    return swapChain as ValidTexture
  }

  function validateTexture(t: Texture): ValidTexture {
    let { view } = t
    if (view === undefined) {
      const { props } = t
      let size: number[]
      if (props.fullScreen) {
        size = [canvas.width, canvas.height, 1]
      } else if (props.width !== undefined) {
        size = [props.width, props.height!, props.depthOrArrayLayers!]
      } else {
        throw new InvalidProps('should specify either dimensions or fullScreen for textures')
      }
      log.debug('createTexture', size, t.props)
      if (t.format !== t.props.format) {
        t.format = t.props.format
        t.formatVersion++
      }
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
    return t as ValidTexture
  }

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

  return root
}
