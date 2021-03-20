import { loggers } from './loggers'
import { event } from './event'
import { mulberry32hash, combineHashes } from './util'
import {
  Type,
  Command,
  RenderPass,
  RenderBundle,
  RenderPipeline,
  Root,
  RootProps,
  Texture,
  ShaderModule,
  DescriptorType,
  VertexAttribute,
  VertexBufferLayout,
  BindBuffer,
  Draw
} from './types'
import { GPUTextureFormatId, gpuVertexFormatByteLength } from './enums'

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

  const canvasResized = event<() => void>()

  const root: Root = {
    type: Type.Root,
    props: { verbose: false },
    parent: undefined,
    canvas,
    commands: undefined,
    swapChain: {
      type: Type.SwapChain,
      props: { format: 'preferred', device: (undefined as unknown) as GPUDevice },
      format: 'bgra8unorm',
      formatHash: 0
    },
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
      for (const command of validateCommands()) {
        const commandEncoder = device.createCommandEncoder(command.props)
        for (let pass = command.first; pass !== undefined; pass = pass.next) {
          const passEncoder = commandEncoder.beginRenderPass(
            validateRenderPassAttachments(pass as RenderPass, swapChain)
          )
          passEncoder.executeBundles(validateRenderBundles(pass as RenderPass))
          passEncoder.endPass()
        }
        commandBuffers.push(commandEncoder.finish())
      }
      device.queue.submit(commandBuffers)
    }
  }

  function validateCommands() {
    let { commands } = root
    if (!commands) {
      commands = root.commands = []
      for (let x = root.first; x !== undefined; x = x.next) {
        if (x.type === Type.Command) {
          commands.push(x as Command)
        }
      }
    }
    return commands
  }

  function* validateRenderBundles(pass: RenderPass) {
    for (let x = pass.first; x !== undefined; x = x.next) {
      if (x.type === Type.RenderBundle) {
        yield validateRenderBundle(x as RenderBundle, pass)
      }
    }
  }

  function validateRenderPassAttachments(pass: RenderPass, swapChain: ValidTexture) {
    const { props } = pass
    let formatHash = 0
    pass.colorFormats = []
    props.colorAttachments = []
    props.depthStencilAttachment = undefined
    for (let x = pass.first; x !== undefined; x = x.next) {
      const { type } = x
      if (type === Type.ColorAttachment) {
        const attachment = x as DescriptorType[typeof type]
        const texture = attachment.first ? validateTexture(attachment.first as Texture) : swapChain
        pass.colorFormats.push(texture.format)
        formatHash = combineHashes(formatHash, texture.formatHash)
        attachment.props.attachment = texture.view
        props.colorAttachments.push(attachment.props)
      } else if (type === Type.DepthStencilAttachment) {
        const attachment = x as DescriptorType[typeof type]
        if (!attachment.first) throw new Error('need texture in depth stencil attachment')
        const texture = validateTexture(attachment.first as Texture)
        pass.depthStencilFormat = texture.format
        formatHash = combineHashes(formatHash, texture.formatHash)
        props.depthStencilAttachment = attachment.props
        props.depthStencilAttachment.attachment = texture.view
      }
    }
    pass.formatHash = formatHash
    return props
  }

  function validateRenderBundle(bundle: RenderBundle, pass: RenderPass) {
    if (bundle.handle === undefined || bundle.formatHash !== pass.formatHash) {
      bundle.formatHash = pass.formatHash
      const { props } = bundle
      const { colorFormats, depthStencilFormat } = pass
      props.colorFormats = colorFormats
      props.depthStencilFormat = depthStencilFormat
      const encoder = device.createRenderBundleEncoder(props)
      for (let x = bundle.first; x !== undefined; x = x.next) {
        const pipeline = validateRenderPipeline(x as RenderPipeline, depthStencilFormat)
        for (const draw of pipeline.drawCalls) {
          encoder.draw(...draw.args)
        }
      }
      bundle.handle = encoder.finish()
    }
    return bundle.handle
  }

  function validateRenderPipeline(pipeline: RenderPipeline, depthStencilFormat: GPUTextureFormat) {
    let { handle } = pipeline
    if (!handle) {
      const { gpuProps, bindGroupLayout } = pipeline
      const shaderModules: ShaderModule[] = []
      const fragmentStates: GPUColorTargetState[] = []
      const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []
      const validatingLayout = bindGroupLayout === undefined
      let nextBinding = 0
      let vertexLayouts = gpuProps.vertex.buffers
      vertexLayouts.length = 0
      gpuProps.multisample = undefined
      gpuProps.primitive = pipeline.props
      const drawCalls: Draw[] = (pipeline.drawCalls = [])
      for (let x = pipeline.first; x !== undefined; x = x.next) {
        const { type } = x
        if (type === Type.Draw) {
          drawCalls.push(x as Draw)
        } else if (type === Type.VertexBufferLayout) {
          vertexLayouts.push(validateVertexLayout(x as VertexBufferLayout))
        } else if (validatingLayout && type === Type.BindBuffer) {
          const { visibility, binding } = (x as BindBuffer).props
          const currentBinding = binding === -1 ? nextBinding : binding
          bindGroupLayoutEntries.push({
            binding: currentBinding,
            visibility,
            buffer: (x as BindBuffer).props
          })
          nextBinding = currentBinding + 1
        } else if (type === Type.ShaderModule) {
          shaderModules.push(x as DescriptorType[typeof type])
        } else if (type === Type.ColorTargetState) {
          fragmentStates.push((x as DescriptorType[typeof type]).gpuProps)
        } else if (type === Type.DepthStencilState) {
          gpuProps.depthStencil = (x as DescriptorType[typeof type]).props
          gpuProps.depthStencil.format = depthStencilFormat
        } else if (type === Type.MultisampleState) {
          gpuProps.multisample = (x as DescriptorType[typeof type]).props
        }
      }
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
            targets: fragmentStates
          }
        : undefined
      if (validatingLayout) {
        if (bindGroupLayoutEntries.length) {
          pipeline.bindGroupLayout = device.createBindGroupLayout({
            entries: bindGroupLayoutEntries
          })
          pipeline.gpuProps.layout = device.createPipelineLayout({
            bindGroupLayouts: [pipeline.bindGroupLayout]
          })
        } else {
          pipeline.bindGroupLayout = null
          pipeline.gpuProps.layout = undefined
        }
      }
      log.debug('createRenderPipeline', gpuProps)
      pipeline.handle = device.createRenderPipeline(gpuProps)
    }
    if (!pipeline.drawCalls) {
      const drawCalls: Draw[] = (pipeline.drawCalls = [])
      for (let x = pipeline.first; x !== undefined; x = x.next) {
        if (x.type === Type.Draw) drawCalls.push(x as Draw)
      }
    }
    return pipeline as typeof pipeline & { handle: GPURenderPipeline; drawCalls: Draw[] }
  }

  function validateVertexLayout(layout: VertexBufferLayout): GPUVertexBufferLayout {
    let { attributes, props } = layout
    if (!attributes) {
      attributes = layout.attributes = props.attributes
      attributes.length = 0
      let nextOffset = 0
      let nextLocation = 0
      for (let attr = layout.first; attr !== undefined; attr = attr.next) {
        const { props } = attr as VertexAttribute
        if (props.offset === -1) props.offset = nextOffset
        if (props.shaderLocation === -1) props.shaderLocation = nextLocation
        nextOffset += gpuVertexFormatByteLength[props.format]
        nextLocation++
        attributes.push(props)
      }
      if (props.arrayStride === -1) props.arrayStride = nextOffset
    }
    return props
  }

  type ValidTexture = {
    format: GPUTextureFormat
    view: GPUTextureView
    formatHash: number
  }

  function validateSwapChain(): ValidTexture {
    const { swapChain } = root
    let { handle } = swapChain
    if (!handle) {
      const { props } = root.swapChain
      let { format } = props
      if (format === 'preferred') {
        format = swapChainPreferredFormat
      }
      if (swapChain.format !== format) {
        swapChain.format = format
        swapChain.formatHash = mulberry32hash(GPUTextureFormatId[format])
      }
      props.device = device
      props.format = format
      log.debug('configuring swap chain', format, props)
      handle = swapChain.handle = context.configureSwapChain(props as GPUSwapChainDescriptor)
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
        props.size = [canvas.width, canvas.height, 1]
      } else if (props.width !== undefined) {
        props.size = [props.width, props.height!, props.depthOrArrayLayers!]
      } else {
        throw new InvalidProps('should specify either dimensions or fullScreen for textures')
      }
      log.debug('createTexture', props.size, props)
      if (t.format !== t.props.format) {
        t.format = t.props.format
        t.formatHash = mulberry32hash(GPUTextureFormatId[t.format])
      }
      view = t.view = (t.handle = device.createTexture(props)).createView()
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
        const features: GPUExtensionName[] = []
        let limits: GPULimits | undefined
        for (let x = root.first; x !== undefined; x = x.next) {
          const { type } = x
          if (type === Type.Feature) {
            features.push((x as DescriptorType[typeof type]).props.name)
          } else if (type === Type.Limits) {
            limits = (x as DescriptorType[typeof type]).props
          }
        }
        log.debug('initializing adapter & device', features)

        context = (canvas.getContext('gpupresent') as unknown) as GPUCanvasContext
        if (!context || !navigator.gpu) throw new InitError('Your browser does not support WebGPU')

        adapter = await navigator.gpu.requestAdapter({
          powerPreference: root.props.powerPreference
        })
        if (!adapter) throw new InitError('Failed to init WebGPU adapter!')

        device = (await adapter.requestDevice(({
          nonGuaranteedLimits: limits,
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
