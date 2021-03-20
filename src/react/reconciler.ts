import ReactReconciler from 'react-reconciler'
import * as webgpu from '../webgpu'
import { DescriptorType } from '../webgpu'

type HTMLCanvasElementWithGPU = HTMLCanvasElement & {
  _gpuRoot: webgpu.Root
  _gpuContainer: ReturnType<typeof reconciler.createContainer>
}

const intrinsicElementNameToType = {
  GPUCanvas: webgpu.Type.Root,
  'gpu-limits': webgpu.Type.Limits,
  'gpu-feature': webgpu.Type.Feature,
  'gpu-command': webgpu.Type.Command,
  'gpu-render-pass': webgpu.Type.RenderPass,
  'gpu-color-attachment': webgpu.Type.ColorAttachment,
  'gpu-depth-stencil-attachment': webgpu.Type.DepthStencilAttachment,
  'gpu-swap-chain': webgpu.Type.SwapChain,
  'gpu-texture': webgpu.Type.Texture,
  'gpu-render-bundle': webgpu.Type.RenderBundle,
  'gpu-render-pipeline': webgpu.Type.RenderPipeline,
  'gpu-color-target': webgpu.Type.ColorTargetState,
  'gpu-multisample': webgpu.Type.MultisampleState,
  'gpu-depth-stencil': webgpu.Type.DepthStencilState,
  'gpu-bind-uniform': webgpu.Type.BindUniform,
  'gpu-uniform-buffer': webgpu.Type.UniformBuffer,
  'gpu-shader-module': webgpu.Type.ShaderModule,
  'gpu-vertex-buffer-layout': webgpu.Type.VertexBufferLayout,
  'gpu-vertex-attribute': webgpu.Type.VertexAttribute,
  'gpu-vertex-buffer': webgpu.Type.VertexBuffer,
  'gpu-draw': webgpu.Type.Draw
} as const

function typeName(x: webgpu.Type) {
  return (Object.entries(intrinsicElementNameToType).find(([, v]) => v === x) || ['unknown'])[0]
}

const isAllowedParent = Array.from({
  [webgpu.Type.Root]: () => false,
  [webgpu.Type.Limits]: p => p === webgpu.Type.Root,
  [webgpu.Type.Feature]: p => p === webgpu.Type.Root,
  [webgpu.Type.SwapChain]: p => p === webgpu.Type.Root,
  [webgpu.Type.Command]: p => p === webgpu.Type.Root,
  [webgpu.Type.RenderPass]: p => p === webgpu.Type.Command,
  [webgpu.Type.ColorAttachment]: p => p === webgpu.Type.RenderPass,
  [webgpu.Type.DepthStencilAttachment]: p => p === webgpu.Type.RenderPass,
  [webgpu.Type.Texture]: p => p === webgpu.Type.DepthStencilAttachment,
  [webgpu.Type.RenderBundle]: p => p === webgpu.Type.RenderPass,
  [webgpu.Type.RenderPipeline]: p => p === webgpu.Type.RenderBundle,
  [webgpu.Type.ColorTargetState]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.MultisampleState]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.DepthStencilState]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.BindUniform]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.ShaderModule]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.VertexBufferLayout]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.VertexAttribute]: p => p === webgpu.Type.VertexBufferLayout,
  [webgpu.Type.Draw]: p => p === webgpu.Type.RenderPipeline,
  [webgpu.Type.UniformBuffer]: p => p === webgpu.Type.Draw,
  [webgpu.Type.VertexBuffer]: p => p === webgpu.Type.Draw,
  [webgpu.Type.MAX]: p => false,
  length: webgpu.Type.MAX
} as { [K in webgpu.Type]: (p: webgpu.Type) => boolean } & { length: number })

function checkAllowedParent(child: webgpu.Descriptor, parent: webgpu.Descriptor) {
  if (!isAllowedParent[child.type]!(parent.type)) {
    const err = `<${typeName(child.type)}> cannot be a child of <${typeName(parent.type)}>`
    console.error(err)
    throw new Error(err)
  }
}

const propsUpdated = {}

const reconciler = ReactReconciler<
  string, // type
  unknown, // props,
  HTMLCanvasElementWithGPU, // container
  webgpu.Descriptor, // instance
  unknown, // TextInstance
  unknown, // SuspenseInstance
  unknown, // HydratableInstance
  unknown, // PublicInstance
  webgpu.Root, // HostContext
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
    // console.log('getRootHostContext', ...arguments)
    return rootContainerInstance._gpuRoot
  },

  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    // console.log('getChildHostContext', ...arguments)
    return parentHostContext
  },

  // Determines what object gets exposed as a ref.
  getPublicInstance(instance) {
    return instance
  },

  // This method lets you store some information before React starts making changes to the tree on the screen.
  // For example, the DOM renderer stores the current text selection so that it can later restore it.
  prepareForCommit(containerInfo) {
    // console.log('prepareForCommit', ...arguments)
    return null
  },

  // This method is called right after React has performed the tree mutations.
  // You can use it to restore something you've stored in prepareForCommit — for example, text selection.
  resetAfterCommit(containerInfo) {
    console.log('resetAfterCommit', ...arguments)
    containerInfo._gpuRoot.encodeAndSubmit()
  },

  clearContainer(container) {
    console.log('clearContainer', ...arguments)
  },

  createInstance(
    typeName: keyof reactgpu.IntrinsicElements,
    props: Record<string, any>,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ): webgpu.Descriptor {
    console.log('createInstance', typeName, props)
    const type = intrinsicElementNameToType[typeName]
    if (type === undefined) {
      throw new Error(`unknown element type <${typeName}>`)
    }
    const child = webgpu.makeDescriptor(type, hostContext, props)

    if (type === webgpu.Type.ColorTargetState) {
      const { gpuProps, props } = child as DescriptorType[typeof type]
      assignColorTargetState(gpuProps, props)
    } else if (type === webgpu.Type.ShaderModule) {
      ;(child as DescriptorType[typeof type]).props.code = props.children
    }
    return child
  },

  shouldSetTextContent(typeName: keyof reactgpu.IntrinsicElements, props) {
    return typeName === 'gpu-shader-module'
  },

  createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    console.log('createTextInstance', text.replaceAll('\n', '\\n').slice(0, 64) + '...')
    return null
  },

  resetTextContent(descriptor) {
    console.log('resetTextContent', ...arguments)
  },

  commitTextUpdate(textInstance, oldText, newText) {
    console.log('commitTextUpdate', ...arguments)
  },

  preparePortalMount() {},

  prepareUpdate(
    descriptor,
    type: keyof reactgpu.IntrinsicElements,
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
    rootContainerInstance,
    hostContext
  ) {
    const considerChildren = descriptor.type === webgpu.Type.ShaderModule
    const ignoreChildrenAt = considerChildren ? -1 : Object.keys(newProps).indexOf('children')
    const oldValues = Object.values(oldProps)
    const newValues = Object.values(newProps)

    const oldSize = oldValues.length
    const newSize = newValues.length

    if (oldSize === newSize) {
      for (let i = 0; i < oldSize; i++) {
        if (oldValues[i] !== newValues[i] && i !== ignoreChildrenAt) {
          return propsUpdated
        }
      }
      return null // nothing's changed
    }

    // checks if props changed and whether a `commitUpdate` is needed
    // console.log('prepareUpdate', ...arguments)
    return propsUpdated
  },

  commitUpdate(
    child,
    updatePayload,
    _type,
    oldProps,
    newProps: Record<string, any>,
    internalInstanceHandle
  ) {
    console.log('commitUpdate', _type, oldProps, newProps)
    Object.assign(child.props, newProps)
    const { type } = child
    if (type === webgpu.Type.ColorTargetState) {
      const { gpuProps, props } = child as DescriptorType[typeof type]
      assignColorTargetState(gpuProps, props)
    } else if (type === webgpu.Type.ShaderModule) {
      ;(child as DescriptorType[typeof type]).props.code = newProps.children
      ;(child as DescriptorType[typeof type]).handle = undefined
    } else if (type === webgpu.Type.Texture) {
      ;(child as DescriptorType[typeof type]).invalidate?.()
    } else if (type === webgpu.Type.SwapChain) {
      ;(child as DescriptorType[typeof type]).handle = undefined
    } else if (type === webgpu.Type.Limits) {
      ;(child as DescriptorType[typeof type]).root.invalidate()
    } else if (type === webgpu.Type.Feature) {
      ;(child as DescriptorType[typeof type]).root.invalidate()
    }
    invalidateRenderBundle(child)
  },

  appendInitialChild: appendChild,
  appendChild,
  insertBefore,
  removeChild,

  appendChildToContainer: (container, child: webgpu.Descriptor) =>
    appendChild(container._gpuRoot, child),
  insertInContainerBefore: (container, child: webgpu.Descriptor, beforeChild: webgpu.Descriptor) =>
    insertBefore(container._gpuRoot, child, beforeChild),
  removeChildFromContainer: (container, child: webgpu.Descriptor) =>
    removeChild(container._gpuRoot, child),

  finalizeInitialChildren(descriptor, type, props, rootContainerInstance, hostContext) {
    // console.log('finalizeInitialChildren', ...arguments)
    return false
  },

  // This method is only called if you returned `true` from finalizeInitialChildren for this instance.
  // It lets you do some additional work after the node is actually attached to the tree on the screen
  // for the first time.
  commitMount(descriptor, type, newProps, internalInstanceHandle) {}
})

function invalidateRenderPipeline(pipeline: webgpu.Descriptor) {
  ;(pipeline as webgpu.RenderPipeline).handle = undefined
  if (pipeline.parent) {
    ;(pipeline.parent as webgpu.RenderBundle).handle = undefined
  }
}

function invalidateRenderBundle(at?: webgpu.Descriptor) {
  while (at) {
    if (at.type === webgpu.Type.RenderBundle) {
      ;(at as DescriptorType[typeof at.type]).handle = undefined
    }
    at = at.parent
  }
}

function assignColorTargetState(
  gpuProps: GPUColorTargetState,
  props: reactgpu.ColorTargetStateProps
) {
  gpuProps.writeMask = props.writeMask
  const { color, alpha } = gpuProps.blend!
  color.srcFactor = props.colorBlendSrc
  color.dstFactor = props.colorBlendDst
  color.operation = props.colorBlendOp
  alpha.srcFactor = props.alphaBlendSrc
  alpha.dstFactor = props.alphaBlendDst
  alpha.operation = props.alphaBlendOp
}

function orderIndependentInsertion(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  const { type } = child
  if (type === webgpu.Type.MultisampleState) {
    ;(parent as webgpu.RenderPipeline).multisampleState = child as DescriptorType[typeof type]
    invalidateRenderPipeline(parent)
    return true
  } else if (type === webgpu.Type.DepthStencilState) {
    ;(parent as webgpu.RenderPipeline).depthStencilState = child as DescriptorType[typeof type]
    invalidateRenderPipeline(parent)
    return true
  } else if (type === webgpu.Type.DepthStencilAttachment) {
    ;(parent as webgpu.RenderPass).depthStencilAttachment = child as DescriptorType[typeof type]
    return true
  } else if (type === webgpu.Type.Limits) {
    ;(parent as webgpu.Root).limits = child as DescriptorType[typeof type]
    ;(parent as webgpu.Root).invalidate()
    return true
  } else if (type === webgpu.Type.SwapChain) {
    ;(parent as webgpu.Root).swapChain = child as DescriptorType[typeof type]
    return true
  }
  return false
}

function appendChild(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  console.log('appendChild', typeName(child?.type), '→', typeName(parent.type), child.props)
  checkAllowedParent(child, parent)
  if (child.parent) {
    throw new Error('child already has parent!')
  }
  child.parent = parent
  const { type } = child
  if (type === webgpu.Type.ShaderModule) {
    ;(parent as webgpu.RenderPipeline).shaderModules.push(child as DescriptorType[typeof type])
    invalidateRenderPipeline(parent)
  } else if (type === webgpu.Type.ColorTargetState) {
    ;(parent as webgpu.RenderPipeline).fragmentStates.push(child as DescriptorType[typeof type])
    invalidateRenderPipeline(parent)
  } else if (type === webgpu.Type.ColorAttachment) {
    ;(parent as webgpu.RenderPass).colorAttachments.push(child as DescriptorType[typeof type])
  } else if (type === webgpu.Type.Feature) {
    ;(parent as webgpu.Root).features.push(child as DescriptorType[typeof type])
  } else if (!orderIndependentInsertion(parent, child)) {
    parent.children.push(child)
    invalidateRenderBundle(parent)
  }
}

function putBefore<T>(arr: T[], before: T, x: T, reordered: boolean) {
  if (reordered) removeFrom(arr, x) // if on the same array, need to remove it first
  arr.splice(arr.indexOf(before), 0, x)
}

function removeFrom<T>(arr: T[], x: T) {
  arr.splice(arr.indexOf(x), 1)
}

function insertBefore(
  parent: webgpu.Descriptor,
  child: webgpu.Descriptor,
  beforeChild: webgpu.Descriptor
) {
  console.log('insertBefore', typeName(child.type), '→', typeName(beforeChild.type), child.props)
  checkAllowedParent(child, parent)
  const reordered = child.parent === parent
  if (!reordered && child.parent) removeChild(parent, child) // TODO: does it really happen?
  child.parent = parent
  if (!reordered && orderIndependentInsertion(parent, child)) return
  if (child.type === webgpu.Type.ShaderModule) {
    putBefore((parent as webgpu.RenderPipeline).shaderModules, beforeChild, child, reordered)
    invalidateRenderPipeline(parent)
  } else if (child.type === webgpu.Type.ColorTargetState) {
    putBefore((parent as webgpu.RenderPipeline).fragmentStates, beforeChild, child, reordered)
    invalidateRenderPipeline(parent)
  } else if (child.type === webgpu.Type.ColorAttachment) {
    putBefore((parent as webgpu.RenderPass).colorAttachments, beforeChild, child, reordered)
  } else if (child.type === webgpu.Type.Feature) {
    putBefore((parent as webgpu.Root).features, beforeChild, child, reordered)
  } else {
    putBefore(parent.children, beforeChild, child, reordered)
    invalidateRenderBundle(parent)
  }
}

function removeChild(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  const { type } = child
  console.log('removeChild', typeName(type), '←', typeName(parent.type), child.props)
  child.parent = undefined
  if (type === webgpu.Type.MultisampleState) {
    ;(parent as webgpu.RenderPipeline).multisampleState = undefined
    invalidateRenderPipeline(parent)
  } else if (type === webgpu.Type.DepthStencilState) {
    ;(parent as webgpu.RenderPipeline).depthStencilState = undefined
    invalidateRenderPipeline(parent)
  } else if (type === webgpu.Type.ColorTargetState) {
    removeFrom((parent as webgpu.RenderPipeline).fragmentStates, child)
    invalidateRenderPipeline(parent)
  } else if (type === webgpu.Type.ShaderModule) {
    removeFrom((parent as webgpu.RenderPipeline).shaderModules, child)
    invalidateRenderPipeline(parent)
  } else if (type === webgpu.Type.ColorAttachment) {
    removeFrom((parent as webgpu.RenderPass).colorAttachments, child)
  } else if (type === webgpu.Type.DepthStencilAttachment) {
    ;(parent as webgpu.RenderPass).depthStencilAttachment = undefined
  } else if (type === webgpu.Type.Limits) {
    ;(parent as webgpu.Root).limits = undefined
    ;(parent as webgpu.Root).invalidate()
  } else if (type === webgpu.Type.Feature) {
    removeFrom((parent as webgpu.Root).features, child)
    ;(parent as webgpu.Root).invalidate()
  } else if (type === webgpu.Type.SwapChain) {
    ;(child as DescriptorType[typeof type]).handle = undefined
  } else {
    if (type === webgpu.Type.Texture) {
      ;(child as DescriptorType[typeof type]).invalidate?.()
    }
    removeFrom(parent.children, child)
    invalidateRenderBundle(parent)
  }
}

export function render(elements: React.ReactNode, canvas: HTMLCanvasElement, gpuRoot: webgpu.Root) {
  const gpuCanvas = canvas as HTMLCanvasElementWithGPU
  gpuCanvas._gpuRoot = gpuRoot
  gpuCanvas._gpuContainer ||= reconciler.createContainer(gpuCanvas, 0, false, null)
  return reconciler.updateContainer(elements, gpuCanvas._gpuContainer, null, () => {})
}
