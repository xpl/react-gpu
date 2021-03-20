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
  prepareForCommit(canvas) {
    // console.log('prepareForCommit', ...arguments)
    return null
  },

  // This method is called right after React has performed the tree mutations.
  // You can use it to restore something you've stored in prepareForCommit — for example, text selection.
  resetAfterCommit(canvas) {
    console.log('resetAfterCommit', ...arguments)
    // debugDumpTree(canvas._gpuRoot)
    canvas._gpuRoot.encodeAndSubmit()
  },

  clearContainer(canvas) {
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
    const child = webgpu.makeDescriptor(type, props)

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

  // NB: the current implementation is silly, gonna work on it later
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
      invalidateRenderPipeline(child.parent as webgpu.RenderPipeline)
    } else if (type === webgpu.Type.ShaderModule) {
      ;(child as DescriptorType[typeof type]).props.code = newProps.children
      ;(child as DescriptorType[typeof type]).handle = undefined
      invalidateRenderPipeline(child.parent as webgpu.RenderPipeline)
    } else {
      // @ts-ignore
      invalidate[type]?.(child.parent, child)
    }
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

function invalidateRoot(x: webgpu.Root) {
  x.invalidate()
}

function invalidateRenderPipeline(pipeline: webgpu.RenderPipeline) {
  pipeline.handle = undefined
  if (pipeline.parent) {
    ;(pipeline.parent as webgpu.RenderBundle).handle = undefined
  }
}

const invalidate = {
  [webgpu.Type.Feature]: invalidateRoot,
  [webgpu.Type.Limits]: invalidateRoot,
  [webgpu.Type.MultisampleState]: invalidateRenderPipeline,
  [webgpu.Type.DepthStencilState]: invalidateRenderPipeline,
  [webgpu.Type.ColorTargetState]: invalidateRenderPipeline,
  [webgpu.Type.VertexBufferLayout]: invalidateRenderPipeline,
  [webgpu.Type.ShaderModule]: invalidateRenderPipeline,
  [webgpu.Type.SwapChain](parent: webgpu.Descriptor, child: webgpu.SwapChain) {
    child.handle = undefined
  },
  [webgpu.Type.Texture](parent: webgpu.Descriptor, child: webgpu.Texture) {
    child.invalidate?.()
  },
  [webgpu.Type.Command](root: webgpu.Root) {
    root.commands = undefined
  }
}

function appendChild(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  console.log('appendChild', typeName(child?.type), '→', typeName(parent.type), child.props)
  checkAllowedParent(child, parent)
  if (child.parent) throw new Error('child already has parent!')
  child.parent = parent
  if (parent.last) parent.last.next = child
  child.prev = parent.last
  child.next = undefined
  parent.first ||= child
  parent.last = child
  // @ts-ignore
  invalidate[child.type]?.(parent, child)
}

function insertBefore(
  parent: webgpu.Descriptor,
  child: webgpu.Descriptor,
  beforeChild: webgpu.Descriptor
) {
  const { type } = child
  console.log('insertBefore', typeName(type), '→', typeName(beforeChild.type), child.props)
  checkAllowedParent(child, parent)
  if (child.parent !== parent && child.parent) throw new Error('child already has another parent!')

  // fix first/last if needed
  if (parent.first === beforeChild) parent.first = child
  if (parent.last === child) {
    if ((parent.last = child.next)) parent.last.next = undefined
  }

  // unlink from current position
  if (child.prev) child.prev.next = child.next
  if (child.next) child.next.prev = child.prev

  // insert before `beforeChild`
  if (beforeChild.prev) beforeChild.prev.next = child
  child.prev = beforeChild.prev
  child.next = beforeChild

  child.parent = parent

  // @ts-ignore
  invalidate[type]?.(parent, child)
}

function removeChild(parent: webgpu.Descriptor, child: webgpu.Descriptor) {
  const { type } = child
  console.log('removeChild', typeName(type), '←', typeName(parent.type), child.props)

  // fix fist/last if needed
  if (parent.first === child) parent.first = child.next
  if (parent.last === child) parent.last = child.prev

  // unlink
  if (child.prev) child.prev.next = child.next
  if (child.next) child.next.prev = child.prev

  child.prev = undefined
  child.next = undefined
  child.parent = undefined

  // @ts-ignore
  invalidate[type]?.(parent, child)
}

function debugDumpTree(root: webgpu.Descriptor) {
  // @ts-ignore
  function* dump(root: webgpu.Descriptor, level = 0) {
    yield '  '.repeat(level) + typeName(root.type)
    let i = 0
    for (let x = root.first, i = 0; x !== undefined; x = x.next, i++) {
      if (i > 1000) {
        console.error(root)
        throw new Error('looks like an infinite loop')
      }
      yield* dump(x, level + 1)
    }
  }
  console.log([...dump(root)].join('\n'))
}

export function render(elements: React.ReactNode, canvas: HTMLCanvasElement, gpuRoot: webgpu.Root) {
  const gpuCanvas = canvas as HTMLCanvasElementWithGPU
  gpuCanvas._gpuRoot = gpuRoot
  gpuCanvas._gpuContainer ||= reconciler.createContainer(gpuCanvas, 0, false, null)
  return reconciler.updateContainer(elements, gpuCanvas._gpuContainer, null, () => {})
}
