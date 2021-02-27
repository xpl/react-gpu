import React, { useEffect, useState, useLayoutEffect, useRef } from 'react'
import { render } from './reconciler'
import { useObservedClientSize, assignRef } from './misc'
import * as webgpu from '../webgpu'

export const GPUCanvas = React.memo(
  React.forwardRef(function GPUCanvas(
    props: {
      className?: string
      pixelRatio?: number
      options?: webgpu.InitOptions
      children?: React.ReactChildren
    },
    forwardedRef: React.ForwardedRef<HTMLCanvasElement | null>
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const observedSize = useObservedClientSize(canvasRef)
    const { pixelRatio = window.devicePixelRatio } = props
    const [webgpuContext, setWebgpuContext] = useState<webgpu.Context | null>(null)

    useLayoutEffect(() => {
      webgpu.init(canvasRef.current!, props.options).then(setWebgpuContext)
    }, [props.options])

    useLayoutEffect(() => {
      if (webgpuContext) {
        canvasRef.current!.width = observedSize[0] * pixelRatio
        canvasRef.current!.height = observedSize[1] * pixelRatio
        webgpuContext.canvasResized()
      }
    }, [observedSize, pixelRatio, webgpuContext])

    useLayoutEffect(() => {
      assignRef(forwardedRef, canvasRef)
      if (webgpuContext) {
        render(props.children, canvasRef.current!)
      }
    })

    return <canvas ref={canvasRef} className={props.className} />
  })
)
