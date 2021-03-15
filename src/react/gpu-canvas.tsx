import React, { useEffect, useState, useLayoutEffect, useRef } from 'react'
import { render } from './reconciler'
import { useObservedClientSize, assignRef } from './misc'
import * as webgpu from '../webgpu'
import { useAnimationLoop } from './animation-loop'

export const GPUCanvas = React.memo(
  React.forwardRef(function GPUCanvas(
    props: {
      className?: string
      pixelRatio?: number
      children?: React.ReactNode
      verbose?: boolean
    },
    forwardedRef: React.ForwardedRef<HTMLCanvasElement | null>
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const observedSize = useObservedClientSize(canvasRef)
    const [webgpuContext, setWebgpuContext] = useState<webgpu.Context | null>(null)

    const { pixelRatio = window.devicePixelRatio } = props

    useLayoutEffect(() => {
      webgpu.init(canvasRef.current!, { verbose: props.verbose || false }).then(setWebgpuContext)
    }, [props.verbose])

    useLayoutEffect(() => {
      assignRef(forwardedRef, canvasRef)
      if (webgpuContext) {
        render(props.children, canvasRef.current!, webgpuContext)
      }
    })

    useLayoutEffect(() => {
      if (webgpuContext) {
        canvasRef.current!.width = observedSize[0] * pixelRatio
        canvasRef.current!.height = observedSize[1] * pixelRatio
        webgpuContext.canvasResized()
        webgpuContext.encodeAndSubmit()
      }
    }, [observedSize, pixelRatio, webgpuContext])

    useAnimationLoop(() => {
      webgpuContext?.encodeAndSubmit()
    })

    return <canvas ref={canvasRef} className={props.className} />
  })
)
