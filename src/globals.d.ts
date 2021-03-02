declare module reactgpu {
  interface IntrinsicElements {
    'gpu-command': {}
    'gpu-render-pass': {}
    'gpu-render-bundle': {}
  }
}
declare module JSX {
  interface IntrinsicElements extends reactgpu.IntrinsicElements {}
}
