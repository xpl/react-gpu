declare module reactgpu {
  type Children<K extends keyof IntrinsicElements> = {
    children?: JSX.Element | IntrinsicElements[K] | IntrinsicElements[K][] // TODO: fix
  }
  interface IntrinsicElements {
    'gpu-command': GPUCommandEncoderDescriptor & Children<'gpu-render-pass'>
    'gpu-render-pass': GPURenderPassDescriptor & Children<'gpu-render-bundle'>
    'gpu-render-bundle': GPURenderBundleDescriptor & Children<'gpu-draw'>
    'gpu-draw': {}
  }
}
declare module JSX {
  interface IntrinsicElements extends reactgpu.IntrinsicElements {}
}
