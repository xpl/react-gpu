import React, { useLayoutEffect, useRef } from 'react'
import { render } from './reconciler'

export const GPUCanvas = React.memo(
  React.forwardRef(function GPUCanvas(
    props: {
      width: number
      height: number
      children?: React.ReactChildren
    },
    forwardedRef: React.ForwardedRef<HTMLCanvasElement | null>
  ) {
    const ref = useRef<HTMLCanvasElement | null>(null)

    useLayoutEffect(() => {
      assignRef(forwardedRef, ref)
      if (ref.current) render(props.children, ref.current)
    }, [])

    return <canvas ref={ref} width={props.width} height={props.height} />
  })
)

function assignRef<T>(target: React.ForwardedRef<T>, source: React.MutableRefObject<T>) {
  if (target) {
    if (typeof target === 'function') {
      target(source.current)
    } else {
      target.current = source.current
    }
  }
}
