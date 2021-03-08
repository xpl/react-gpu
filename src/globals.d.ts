declare module reactgpu {
  type IntrinsicElementChildren = {
    children?: JSX.Element | JSX.Element[]
  }
  interface IntrinsicElements {
    'gpu-command': GPUCommandEncoderDescriptor & IntrinsicElementChildren
    'gpu-render-pass': Partial<GPURenderPassDescriptor> & IntrinsicElementChildren
    'gpu-color-attachment': GPURenderPassColorAttachmentDescriptor
    'gpu-depth-stencil-attachment': GPURenderPassDepthStencilAttachmentDescriptor
    'gpu-render-bundle': GPURenderBundleDescriptor & IntrinsicElementChildren
    'gpu-draw': {}
  }
}

declare module JSX {
  interface IntrinsicElements extends reactgpu.IntrinsicElements {}
}
