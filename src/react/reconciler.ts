import ReactReconciler from 'react-reconciler'
import * as webgpu from '../webgpu'

type HTMLCanvasElementWithGPU = HTMLCanvasElement & {
  _gpuContext: webgpu.Context
  _gpuContainer: ReturnType<typeof reconciler.createContainer>
}

const intrinsicElementNameToType = {
  GPUCanvas: webgpu.Type.Root,
  'gpu-command': webgpu.Type.Command,
  'gpu-render-pass': webgpu.Type.RenderPass,
  'gpu-color-attachment': webgpu.Type.ColorAttachment,
  'gpu-depth-stencil-attachment': webgpu.Type.DepthStencilAttachment,
  'gpu-render-bundle': webgpu.Type.RenderBundle,
  'gpu-pipeline': webgpu.Type.Pipeline,
  'gpu-bind-uniform': webgpu.Type.BindUniform,
  'gpu-uniform-buffer': webgpu.Type.UniformBuffer,
  'gpu-color-state': webgpu.Type.ColorState,
  'gpu-shader-module': webgpu.Type.ShaderModule,
  'gpu-vertex-buffer-layout': webgpu.Type.VertexBufferLayout,
  'gpu-vertex-attribute': webgpu.Type.VertexAttribute,
  'gpu-vertex-buffer': webgpu.Type.VertexBuffer,
  'gpu-draw': webgpu.Type.Draw
} as const

function typeName(x: webgpu.Type) {
  return (Object.entries(intrinsicElementNameToType).find(([, v]) => v === x) || ['unknown'])[0]
}

const allowedParents = {
  [webgpu.Type.Root]: null,
  [webgpu.Type.Command]: webgpu.Type.Root,
  [webgpu.Type.RenderPass]: webgpu.Type.Command,
  [webgpu.Type.ColorAttachment]: webgpu.Type.RenderPass,
  [webgpu.Type.DepthStencilAttachment]: webgpu.Type.RenderPass,
  [webgpu.Type.RenderBundle]: webgpu.Type.RenderPass,
  [webgpu.Type.Pipeline]: webgpu.Type.RenderBundle,
  [webgpu.Type.BindUniform]: webgpu.Type.Pipeline,
  [webgpu.Type.ColorState]: webgpu.Type.Pipeline,
  [webgpu.Type.ShaderModule]: webgpu.Type.Pipeline,
  [webgpu.Type.VertexBufferLayout]: webgpu.Type.Pipeline,
  [webgpu.Type.VertexAttribute]: webgpu.Type.VertexBufferLayout,
  [webgpu.Type.Draw]: webgpu.Type.Pipeline,
  [webgpu.Type.UniformBuffer]: webgpu.Type.Draw,
  [webgpu.Type.VertexBuffer]: webgpu.Type.Draw
} as const

function checkAllowedParent(child: webgpu.Descriptor, parent: webgpu.Descriptor) {
  if (allowedParents[child.type] !== parent.type) {
    const err = `<${typeName(child.type)}> cannot be a child of <${typeName(parent.type)}>`
    console.error(err)
    throw new Error(err)
  }
}

const nil = {}

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
  queueMicrotask: queueMicrotask,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: 0,

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
    props: object,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ): webgpu.Descriptor {
    console.log('createInstance', typeName, props)
    const type = intrinsicElementNameToType[typeName]
    if (type === undefined) {
      throw new Error(`unknown element type <${typeName}>`)
    }
    return {
      type,
      props: { ...webgpu.defaultProps[type], ...props },
      indexInParent: -1,
      children: [],
      currentRenderBundle: undefined
    }
  },

  finalizeInitialChildren(descriptor, type, props, rootContainerInstance, hostContext) {
    // console.log('finalizeInitialChildren', ...arguments)
    return false
  },

  shouldSetTextContent(type, props) {
    // console.log('shouldSetTextContent', ...arguments)
    return false
  },

  createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    console.log('createTextInstance', ...arguments)
    return null
  },

  preparePortalMount() {},

  commitMount(descriptor, type, newProps, internalInstanceHandle) {
    console.log('commitMount', ...arguments)
  },

  prepareUpdate(descriptor, type, oldProps, newProps, rootContainerInstance, hostContext) {
    // checks if props changed and whether a `commitUpdate` is needed
    // console.log('prepareUpdate', ...arguments)
    return nil
  },

  commitUpdate(descriptor, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    console.log('commitUpdate', type, oldProps, newProps)
    Object.assign(descriptor.props, newProps)
  },

  resetTextContent(descriptor) {
    console.log('resetTextContent', ...arguments)
  },

  commitTextUpdate(textInstance, oldText, newText) {
    console.log('commitTextUpdate', ...arguments)
  },

  appendInitialChild: appendChild,
  appendChild,
  insertBefore,
  removeChild,

  appendChildToContainer: (container, child: webgpu.Descriptor) =>
    appendChild(container._gpuContext, child),
  insertInContainerBefore: (container, child: webgpu.Descriptor, beforeChild: webgpu.Descriptor) =>
    insertBefore(container._gpuContext, child, beforeChild),
  removeChildFromContainer: (container, child: webgpu.Descriptor) =>
    removeChild(container._gpuContext, child)
})

function appendChild(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  console.log('appendChild', typeName(child.type), '→', typeName(parent.type))
  checkAllowedParent(child, parent)
  if (child.type === webgpu.Type.ColorAttachment) {
    const pass = parent as webgpu.RenderPass
    const attachment = child as webgpu.ColorAttachment
    attachment.indexInParent = pass.props.colorAttachments.length
    pass.props.colorAttachments.push(attachment.props)
  } else if (child.type === webgpu.Type.DepthStencilAttachment) {
    ;(parent as webgpu.RenderPass).props.depthStencilAttachment = (child as webgpu.DepthStencilAttachment).props
  } else {
    parent.children.push(child)
  }
  if ((child.currentRenderBundle = parent.currentRenderBundle) !== undefined) {
    child.currentRenderBundle.handle = undefined // invalidate
  }
}

function insertBefore(
  parent: webgpu.Descriptor,
  child: webgpu.Descriptor,
  beforeChild: webgpu.Descriptor
) {
  console.log('insertBefore', typeName(child.type), '→', typeName(beforeChild.type))
  checkAllowedParent(child, parent)
  if (
    child.type === webgpu.Type.ColorAttachment ||
    child.type === webgpu.Type.DepthStencilAttachment
  ) {
    // order doesn't matter
  } else {
    parent.children.splice(parent.children.indexOf(beforeChild), 0, child)
  }
  const { currentRenderBundle } = parent
  if (child.currentRenderBundle !== currentRenderBundle) {
    if ((child.currentRenderBundle = currentRenderBundle) !== undefined) {
      currentRenderBundle!.handle = undefined // invalidate
    }
  }
}

function removeChild(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  console.log('removeChild', typeName(child.type), '→', typeName(parent.type))
  if (child.type === webgpu.Type.ColorAttachment) {
    ;(parent as webgpu.RenderPass).props.colorAttachments!.splice(child.indexInParent, 1)
  } else if (child.type === webgpu.Type.DepthStencilAttachment) {
    delete (parent as webgpu.RenderPass).props.depthStencilAttachment
  } else {
    parent.children.splice(parent.children.indexOf(child), 1)
  }
  if (child.currentRenderBundle !== undefined) {
    child.currentRenderBundle.handle = undefined // invalidate
    child.currentRenderBundle = undefined
  }
}

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
