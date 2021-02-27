import React, { useRef, useState, useLayoutEffect } from 'react'

export type ElementSize = [width: number, height: number]

export function useObservedClientSize(ref: React.RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>([NaN, NaN])

  useLayoutEffect(() => {
    if (ref.current) {
      const el = ref.current
      const update = () => {
        setSize(size =>
          el.clientWidth === size[0] && el.clientHeight === size[1]
            ? size
            : [el.clientWidth, el.clientHeight]
        )
      }
      update()
      const resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(el)
      return () => resizeObserver.unobserve(el)
    }
  }, [])

  return size
}

export function useLiveRef<T>(x: T) {
  const ref = useRef(x)
  ref.current = x
  return ref
}

export function assignRef<T>(target: React.ForwardedRef<T>, source: React.RefObject<T>) {
  if (target) {
    if (typeof target === 'function') {
      target(source.current)
    } else {
      target.current = source.current
    }
  }
}
