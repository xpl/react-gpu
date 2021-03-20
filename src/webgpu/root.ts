import { loggers } from './loggers'
import { event } from './event'
import {
  Type,
  Command,
  RenderPass,
  RenderBundle,
  RenderPipeline,
  Root,
  RootProps,
  Texture,
  ShaderModule
} from './types'

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
      const swapChain = validateSwapChain()
      const commandBuffers: GPUCommandBuffer[] = []
      for (const command of commands) {
        const commandEncoder = device.createCommandEncoder(command.props)
        for (const renderPass of command.children) {
          const passEncoder = commandEncoder.beginRenderPass(
            validateRenderPassAttachments(renderPass, swapChain)
          )
          passEncoder.executeBundles(
            renderPass.children.map(rb => validateRenderBundle(rb, renderPass))
          )
          passEncoder.endPass()
        }
        commandBuffers.push(commandEncoder.finish())
      }
      device.queue.submit(commandBuffers)
    }
  }

  function validateRenderPassAttachments(pass: RenderPass, swapChain: ValidTexture) {
    const { props } = pass
    pass.colorFormats = []
    pass.formatVersion = 0
    props.colorAttachments = []
    for (const att of pass.colorAttachments) {
      const texture = att.children[0] ? validateTexture(att.children[0]) : swapChain
      pass.colorFormats.push(texture.format)
      pass.formatVersion += texture.formatVersion
      att.props.attachment = texture.view
      props.colorAttachments.push(att.props)
    }
    if (pass.depthStencilAttachment?.children[0] !== undefined) {
      const texture = validateTexture(pass.depthStencilAttachment.children[0])
      pass.depthStencilFormat = texture.format
      pass.formatVersion += texture.formatVersion
      props.depthStencilAttachment = {
        ...pass.depthStencilAttachment.props,
        attachment: texture.view
      }
    } else {
      props.depthStencilAttachment = undefined
    }
    return props
  }

  function validateRenderBundle(bundle: RenderBundle, pass: RenderPass) {
    if (bundle.handle === undefined || bundle.formatVersion !== pass.formatVersion) {
      bundle.formatVersion = pass.formatVersion
      const { props } = bundle
      const { colorFormats, depthStencilFormat } = pass
      props.colorFormats = colorFormats
      props.depthStencilFormat = depthStencilFormat
      const encoder = device.createRenderBundleEncoder(props)
      for (const pipeline of bundle.children) {
        const handle = validateRenderPipeline(pipeline, depthStencilFormat).handle
      }
      bundle.handle = encoder.finish()
    }
    return bundle.handle
  }

  function validateRenderPipeline(pipeline: RenderPipeline, depthStencilFormat: GPUTextureFormat) {
    let { handle } = pipeline
    if (!handle) {
      const { gpuProps, shaderModules, fragmentStates } = pipeline
      const m1 = shaderModules[0]
      const m2 = shaderModules[1]
      const vertModule = m1?.props.vertexEntryPoint !== undefined ? m1 : m2
      const fragModule =
        fragmentStates.length && m1?.props.fragmentEntryPoint !== undefined ? m1 : m2
      if (vertModule === undefined) throw new InvalidProps('must specify a vertex shader entry')
      const { vertex } = gpuProps
      vertex.module = validateShaderModule(vertModule).handle
      vertex.entryPoint = vertModule.props.vertexEntryPoint!
      gpuProps.fragment = fragModule
        ? {
            entryPoint: fragModule.props.fragmentEntryPoint!,
            module: validateShaderModule(fragModule).handle,
            targets: fragmentStates.map(s => s.gpuProps)
          }
        : undefined

      const depthStencilProps = pipeline.depthStencilState?.props
      if (depthStencilProps !== undefined) depthStencilProps.format = depthStencilFormat
      gpuProps.depthStencil = depthStencilProps
      gpuProps.primitive = pipeline.props
      gpuProps.multisample = pipeline.multisampleState?.props
      // gpuProps.layout // TODO
      pipeline.handle = device.createRenderPipeline(gpuProps)
    }
    return pipeline as { handle: GPURenderPipeline }
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

  // TODO: LRU cache
  function validateShaderModule(m: ShaderModule): { handle: GPUShaderModule } {
    if (!m.handle) {
      log.debug('createShaderModule', m.props)
      m.handle = device.createShaderModule(m.props)
      if (m.props.onCompilationInfo) {
        m.handle.compilationInfo().then(m.props.onCompilationInfo)
      }
    }
    return m as { handle: GPUShaderModule }
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
