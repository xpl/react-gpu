import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react'
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

    useLayoutEffect(() => {
      if (gpuRoot) {
        canvasRef.current!.width = observedSize[0] * pixelRatio
        canvasRef.current!.height = observedSize[1] * pixelRatio
        gpuRoot.canvasResized()
      }
    }, [gpuRoot, observedSize, pixelRatio])

    useAnimationLoop(() => {
      gpuRoot?.encodeAndSubmit()
    })

    return <canvas ref={canvasRef} className={props.className} />
  })
)
