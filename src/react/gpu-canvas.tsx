import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react'
import { throttle } from 'lodash'
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
    } & GPURequestAdapterOptions,
    forwardedRef: React.ForwardedRef<HTMLCanvasElement | null>
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const observedSize = useObservedClientSize(canvasRef)
    const [gpuRoot, setGPURoot] = useState<webgpu.Root | null>(null)

    const { pixelRatio = window.devicePixelRatio } = props

    const gpuRootProps = useMemo(
      () => ({
        verbose: props.verbose ?? false,
        powerPreference: props.powerPreference
      }),
      [props.verbose, props.powerPreference]
    )

    useLayoutEffect(() => {
      const canvas = canvasRef.current
      if (canvas && gpuRoot?.canvas !== canvas) {
        setGPURoot(webgpu.root(canvas).setProps(gpuRootProps))
      }
    }, [canvasRef.current])

    useLayoutEffect(() => {
      gpuRoot?.setProps(gpuRootProps)
    }, [gpuRoot, gpuRootProps])

    useLayoutEffect(() => {
      assignRef(forwardedRef, canvasRef)
      if (gpuRoot) {
        render(props.children, canvasRef.current!, gpuRoot)
      }
    })

    const canvasResized = useMemo(
      () =>
        throttle((gpuRoot: webgpu.Root, w: number, h: number, pixelRatio: number) => {
          console.log(w, h)
          canvasRef.current!.width = w * pixelRatio
          canvasRef.current!.height = h * pixelRatio
          gpuRoot.canvasResized()
          setTimeout(() => gpuRoot.encodeAndSubmit(), 0)
        }, 500),
      []
    )

    useLayoutEffect(() => {
      if (gpuRoot) canvasResized(gpuRoot, observedSize[0], observedSize[1], pixelRatio)
    }, [gpuRoot, observedSize, pixelRatio])

    useAnimationLoop(() => {
      gpuRoot?.encodeAndSubmit()
    })

    return <canvas ref={canvasRef} className={props.className} />
  })
)
