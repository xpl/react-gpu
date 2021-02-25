import ReactReconciler from 'react-reconciler'
import React, { useLayoutEffect, useRef } from 'react'

const rootHostContext = {}
const childHostContext = {}

const reconciler = ReactReconciler({
  isPrimaryRenderer: false,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  now: performance.now,

  getRootHostContext(rootContainerInstance) {
    return {}
  },

  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    return {}
  },

  getPublicInstance(instance) {
    console.log('getPublicInstance')
  },

  prepareForCommit(containerInfo) {
    return null
  },

  resetAfterCommit(containerInfo) {},

  clearContainer(container) {
    console.log('Clear!')
  },

  createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    // return document.createElement(type)
  },

  appendInitialChild(parentInstance, child) {
    // parentInstance.appendChild(child)
  },

  finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
    // const { children, ...otherProps } = props
    // Object.keys(otherProps).forEach(attr => {
    //   if (attr === 'className') {
    //     domElement.class = otherProps[attr]
    //   } else if (attr === 'onClick') {
    //     const listener = otherProps[attr]
    //     if (domElement.__ourVeryHackCacheOfEventListeners) {
    //       domElement.__ourVeryHackCacheOfEventListeners.push(listener)
    //     } else {
    //       domElement.__ourVeryHackCacheOfEventListeners = [listener]
    //     }
    //     domElement.addEventListener('click', listener)
    //   } else {
    //     throw new Error("TODO: We haven't handled other properties/attributes")
    //   }
    // })
    return false
  },

  prepareUpdate(domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    console.log('prepareUpdate')

    // const propKeys = new Set(
    //   Object.keys(newProps).concat(
    //     Object.keys(oldProps)
    //   )
    // ).values();
    // const payload = [];
    // for (let key of propKeys) {
    //   if (
    //     key !== 'children' && // text children are already handled
    //     oldProps[key] !== newProps[key]
    //   ) {
    //     payload.push({ [key]: newProps[key] })
    //   }
    // }
    // return payload;
    return [null]
  },

  shouldSetTextContent(type, props) {
    return false
  },

  createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    return document.createTextNode(text)
  },

  preparePortalMount() {},

  queueMicrotask: queueMicrotask,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: 0,

  commitMount(domElement, type, newProps, internalInstanceHandle) {
    console.log('commitMount')
  },

  commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {},

  resetTextContent(domElement) {},

  commitTextUpdate(textInstance, oldText, newText) {
    // textInstance.nodeValue = newText
  },

  appendChild(parentInstance, child) {},

  appendChildToContainer(container, child) {
    // container.appendChild(child)
  },

  insertBefore(parentInstance, child, beforeChild) {
    console.log('insertBefore')
  },

  insertInContainerBefore(container, child, beforeChild) {
    console.log('insertInContainerBefore')
  },

  removeChild(parentInstance, child) {
    console.log('removeChild')
  },

  removeChildFromContainer(container, child) {
    console.log('removeChildFromContainer')
  }
})

type HTMLCanvasElementWithGPU = HTMLCanvasElement & {
  _reactGPUContainer: ReturnType<typeof reconciler.createContainer>
}

export function render(elements: React.ReactNode, canvas: HTMLCanvasElement, callback = () => {}) {
  return reconciler.updateContainer(
    elements,
    ((canvas as HTMLCanvasElementWithGPU)._reactGPUContainer ||= reconciler.createContainer(
      canvas,
      0,
      false,
      null
    )),
    null,
    callback
  )
}

// TODO: forwardRef
export function GPUCanvas({
  width,
  height,
  children
}: {
  width: number
  height: number
  children?: React.ReactChildren
}) {
  const element = useRef<HTMLCanvasElement | null>(null)

  useLayoutEffect(() => {
    if (element.current) render(children, element.current)
  }, [element.current])

  return <canvas ref={element} width={width} height={height}></canvas>
}
