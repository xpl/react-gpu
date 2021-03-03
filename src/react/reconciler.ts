import ReactReconciler from 'react-reconciler'
import * as webgpu from '../webgpu'

type HTMLCanvasElementWithGPU = HTMLCanvasElement & {
  _gpuContext: webgpu.Context
  _gpuContainer: ReturnType<typeof reconciler.createContainer>
}

const intrinsicElementNameToType = {
  'gpu-command': webgpu.Type.Command,
  'gpu-render-pass': webgpu.Type.RenderPass,
  'gpu-render-bundle': webgpu.Type.RenderBundle,
  'gpu-draw': webgpu.Type.Draw
} as const

function typeName(x: webgpu.Type) {
  return (Object.entries(intrinsicElementNameToType).find(([, v]) => v === x) || ['unknown'])[0]
}

const allowedParents = {
  [webgpu.Type.Command]: null,
  [webgpu.Type.RenderPass]: webgpu.Type.Command,
  [webgpu.Type.RenderBundle]: webgpu.Type.RenderPass,
  [webgpu.Type.Draw]: webgpu.Type.RenderBundle
} as const

const reconciler = ReactReconciler<
  string, // type
  unknown, // props,
  HTMLCanvasElementWithGPU, // container
  webgpu.Descriptor, // instance
  unknown, // TextInstance
  unknown, // SuspenseInstance
  unknown, // HydratableInstance
  unknown, // PublicInstance
  webgpu.Context, // HostContext
  unknown, // UpdatePayload
  unknown, // ChildSet
  number, // TimeoutHandle
  number // NoTimeout
>({
  isPrimaryRenderer: false,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  now: performance.now,

  getRootHostContext(rootContainerInstance) {
    console.log('getRootHostContext', ...arguments)
    return rootContainerInstance._gpuContext
  },

  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    console.log('getChildHostContext', ...arguments)
    return parentHostContext
  },

  getPublicInstance(instance) {
    console.log('getPublicInstance', ...arguments)
  },

  prepareForCommit(containerInfo) {
    console.log('prepareForCommit', ...arguments)
    return null
  },

  resetAfterCommit(containerInfo) {
    console.log('resetAfterCommit', ...arguments)
  },

  clearContainer(container) {
    console.log('clearContainer', ...arguments)
  },

  createInstance(
    typeName: keyof reactgpu.IntrinsicElements,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    console.log('createInstance', ...arguments)
    const type = intrinsicElementNameToType[typeName]
    if (type === undefined) {
      throw new Error(`unknown element type <${typeName}>`)
    }
    return {
      type,
      props,
      children: []
    }
  },

  appendInitialChild(parent, child: webgpu.Descriptor) {
    console.log('appendInitialChild', ...arguments)
    if (allowedParents[child.type] !== parent.type) {
      console.log('error!')
      throw new Error(`<${typeName(child.type)}> cannot be a child of <${typeName(parent.type)}>`)
    } else {
      parent.children.push(child)
    }
  },

  finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
    console.log('finalizeInitialChildren', ...arguments)
    return false
  },

  prepareUpdate(domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    console.log('prepareUpdate', ...arguments)
    return [null]
  },

  shouldSetTextContent(type, props) {
    console.log('shouldSetTextContent', ...arguments)
    return false
  },

  createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    console.log('createTextInstance', ...arguments)
    return null
  },

  preparePortalMount() {},

  queueMicrotask: queueMicrotask,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: 0,

  commitMount(domElement, type, newProps, internalInstanceHandle) {
    console.log('commitMount', ...arguments)
  },

  commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    console.log('commitUpdate', ...arguments)
  },

  resetTextContent(domElement) {
    console.log('resetTextContent', ...arguments)
  },

  commitTextUpdate(textInstance, oldText, newText) {
    console.log('commitTextUpdate', ...arguments)
  },

  appendChild(parent, child: webgpu.Descriptor) {
    console.log('appendChild', ...arguments)
    parent.children.push(child)
  },

  insertBefore(parent, child: webgpu.Descriptor, beforeChild: webgpu.Descriptor) {
    console.log('insertBefore', ...arguments)
    parent.children.splice(parent.children.indexOf(beforeChild), 0, child)
  },

  removeChild(parent, child: webgpu.Descriptor) {
    console.log('removeChild', ...arguments)
    parent.children.splice(parent.children.indexOf(child), 1)
  },

  appendChildToContainer({ _gpuContext }, child: webgpu.Command) {
    console.log('appendChildToContainer', ...arguments)
    _gpuContext.commands.push(child)
  },

  insertInContainerBefore({ _gpuContext }, child: webgpu.Command, beforeChild: webgpu.Command) {
    console.log('insertInContainerBefore', ...arguments)
    _gpuContext.commands.splice(_gpuContext.commands.indexOf(beforeChild), 0, child)
  },

  removeChildFromContainer({ _gpuContext }, child: webgpu.Command) {
    console.log('removeChildFromContainer', ...arguments)
    _gpuContext.commands.splice(_gpuContext.commands.indexOf(child), 1)
  }
})

export function render(
  elements: React.ReactNode,
  canvas: HTMLCanvasElement,
  gpuContext: webgpu.Context
) {
  const gpuCanvas = canvas as HTMLCanvasElementWithGPU
  gpuCanvas._gpuContext = gpuContext
  gpuCanvas._gpuContainer ||= reconciler.createContainer(gpuCanvas, 0, false, null)
  return reconciler.updateContainer(elements, gpuCanvas._gpuContainer, null, () => {})
}
