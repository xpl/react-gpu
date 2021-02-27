export class InitError extends Error {}

export async function init(
  canvas: HTMLCanvasElement,
  adapterOptions?: GPURequestAdapterOptions,
  deviceDescriptor?: GPUDeviceDescriptor,
  swapChainDescriptor?: GPUSwapChainDescriptor
) {
  const context = (canvas.getContext('gpupresent') as unknown) as GPUCanvasContext
  if (!context) throw new InitError('Your browser does not support WebGPU')

  const adapter = navigator.gpu && (await navigator.gpu.requestAdapter(adapterOptions))
  const device = (adapter && (await adapter.requestDevice(deviceDescriptor)))!
  if (!device) throw new InitError('Failed to init WebGPU device!')

  device.addEventListener('uncapturederror', error => console.error(error))

  const colorFormat = await context.getSwapChainPreferredFormat((adapter as unknown) as GPUDevice)

  const swapChain = context.configureSwapChain({
    device,
    format: colorFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT, // means that it will go to screen
    ...swapChainDescriptor
  })

  let depthStencilAttachment: GPUTextureView

  function canvasSizeChanged() {
    const depthStencilTexture = device.createTexture({
      size: [canvas.width, canvas.height, 1],
      mipLevelCount: 1,
      sampleCount: 1,
      dimension: '2d',
      format: 'depth24plus-stencil8',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    })
    depthStencilAttachment = depthStencilTexture.createView()
  }

  canvasSizeChanged()

  const shader = device.createShaderModule({
    code: `
[[block]] struct Uniforms {
  [[offset(0)]] projectionMatrix: mat4x4<f32>;
  [[offset(64)]] viewMatrix: mat4x4<f32>;
};

[[set(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[builtin(position)]] var<out> outPosition: vec4<f32>;
[[location(0)]] var<in> position: vec3<f32>;
[[location(1)]] var<in> color: vec4<f32>;

[[stage(vertex)]]
fn main_vert() -> void {
  outPosition = uniforms.projectionMatrix * uniforms.viewMatrix * vec4<f32>(position, 1.0);
}

[[location(0)]] var<out> outColor: vec4<f32>;

[[stage(fragment)]]
fn main_frag() -> void {
  outColor = vec4<f32>(1.0, 0.4, 0.8, 1.0);
}
`
  })

  const vertexCount = 6

  // prettier-ignore
  const vertexBufferData = new Float32Array([
      /* position */ 0, 0, 0, /* color */ 1, 0, 0, 1,
      /* position */ 1, 0, 0, /* color */ 1, 0.5, 0.5, 1,
      /* position */ 0, 0, 0, /* color */ 0, 1, 0, 1,
      /* position */ 0, 1, 0, /* color */ 0.5, 1, 0.5, 1,
      /* position */ 0, 0, 0, /* color */ 0, 0, 1, 1,
      /* position */ 0, 0, 1, /* color */ 0.5, 0.5, 1, 1,
    ])
  const vertexBuffer = device.createBuffer({
    size: vertexBufferData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexBufferData)
  vertexBuffer.unmap()

  const vertexBufferLayout: GPUVertexBufferLayoutDescriptor[] = [
    {
      arrayStride: 4 * (3 + 4),
      stepMode: 'vertex',
      attributes: [
        {
          format: 'float3',
          offset: 0,
          shaderLocation: 0
        },
        {
          format: 'float4',
          offset: 4 * 3,
          shaderLocation: 1
        }
      ]
    }
  ]

  // prettier-ignore
  const uniformBufferData = new Float32Array([
    0.7804085612297058, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0,
    0, -0.20020020008087158, 0, 0.7071067690849304, -0.40824830532073975, 0.5773502588272095, 0,
    0, 0.8164965510368347, 0.5773502588272095, 0, -0.7071067690849304, -0.40824827551841736,
    0.5773502588272095, 0, -0, 4.440892098500626e-16, -5.196152210235596, 1
  ])
  const uniformBuffer = device.createBuffer({
    size: uniformBufferData.byteLength,
    usage: GPUBufferUsage.UNIFORM,
    mappedAtCreation: true
  })
  new Float32Array(uniformBuffer.getMappedRange()).set(uniformBufferData)
  uniformBuffer.unmap()

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' }
      }
    ]
  })

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer, offset: 0, size: uniformBufferData.byteLength }
      }
    ]
  })

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    }),
    vertexStage: {
      module: shader,
      entryPoint: 'main_vert'
    },
    fragmentStage: {
      module: shader,
      entryPoint: 'main_frag'
    },
    vertexState: {
      vertexBuffers: vertexBufferLayout
    },
    colorStates: [
      {
        format: colorFormat,
        writeMask: GPUColorWrite.ALL,
        alphaBlend: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        },
        colorBlend: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        }
      }
    ],
    primitiveTopology: 'line-list',
    rasterizationState: {
      frontFace: 'cw',
      cullMode: 'none'
    },
    depthStencilState: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus-stencil8'
    }
  })

  function renderDemo() {
    const commandEncoder = device.createCommandEncoder()

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          attachment: swapChain.getCurrentTexture().createView(),
          loadValue: [0.25, 0.28, 0.26, 1.0],
          storeOp: 'store'
        }
      ],
      depthStencilAttachment: {
        attachment: depthStencilAttachment,
        depthLoadValue: 1.0,
        depthStoreOp: 'store',
        stencilLoadValue: 1.0,
        stencilStoreOp: 'store'
      }
    })
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.draw(vertexCount)
    passEncoder.endPass()
    const commandBuffer = commandEncoder.finish()

    device.queue.submit([commandBuffer])
  }

  return { context, adapter, device, swapChain, canvasSizeChanged, renderDemo }
}
