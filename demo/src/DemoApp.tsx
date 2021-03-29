import React, { useState, useMemo } from 'react'
import { GPUCanvas, AnimationLoop, useAnimationLoop } from 'react-gpu'

import { Axes3D } from './Axes3D'

import './DemoApp.scss'

function DemoComponent() {
  const [text, setText] = useState('')
  const { isRunning } = useAnimationLoop((dt, t) => {
    setText(t.toFixed(1))
  })
  return (
    <span>
      {' ' + text} {isRunning ? ' 🔴' : ''}
    </span>
  )
}

export function DemoApp() {
  const [isRunning, setRunning] = useState(false)
  const [counter, setCounter] = useState(0)
  const clearColor = useMemo<GPUColor>(() => [0.25, 0.28, 0.26, 1.0], [])
  return (
    <>
      Hello ReactGPU!{' '}
      <button
        onClick={() => {
          setRunning(!isRunning)
        }}
      >
        {isRunning ? 'Stop' : 'Start'}
      </button>
      <button
        style={{ marginLeft: '0.5em' }}
        onClick={() => {
          setCounter(c => c + 1)
        }}
      >
        Rerender: {counter}
      </button>
      <AnimationLoop isRunning={isRunning}>
        <DemoComponent />
        <GPUCanvas className="canvas-3d" powerPreference="high-performance" verbose>
          <gpu-feature name="pipeline-statistics-query" />
          <gpu-feature name="texture-compression-bc" />
          <gpu-swap-chain format="preferred" usage={GPUTextureUsage.RENDER_ATTACHMENT} />
          <gpu-command>
            <gpu-render-pass>
              <gpu-color-attachment loadValue={clearColor} storeOp="store" />
              <gpu-depth-stencil-attachment
                depthLoadValue={1.0}
                depthStoreOp="store"
                stencilLoadValue={1.0}
                stencilStoreOp="store"
              >
                <gpu-texture
                  fullScreen
                  mipLevelCount={1}
                  dimension="2d"
                  format="depth24plus-stencil8"
                  usage={GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC}
                />
              </gpu-depth-stencil-attachment>
              <Axes3D />
            </gpu-render-pass>
          </gpu-command>
        </GPUCanvas>
      </AnimationLoop>
    </>
  )
}
