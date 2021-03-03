import 'panic-overlay'

import React, { useEffect, useRef, useState } from 'react'
import { render } from 'react-dom'
import { GPUCanvas, AnimationLoop, useAnimationLoop, defaultAttachments } from 'react-gpu'

import 'reset-css'
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

const options = { verbose: true }

function DemoApp() {
  const [isRunning, setRunning] = useState(false)
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
      <AnimationLoop isRunning={isRunning}>
        <DemoComponent />
        <GPUCanvas className="canvas-3d" options={options}>
          <gpu-command>
            <gpu-render-pass
              colorAttachments={[
                {
                  attachment: defaultAttachments.color,
                  loadValue: [0.25, 0.28, 0.26, 1.0],
                  storeOp: 'store'
                }
              ]}
              depthStencilAttachment={{
                attachment: defaultAttachments.depthStencil,
                depthLoadValue: 1.0,
                depthStoreOp: 'store',
                stencilLoadValue: 1.0,
                stencilStoreOp: 'store'
              }}
            >
              {/* <gpu-render-bundle>
                <gpu-draw />
                <gpu-draw />
              </gpu-render-bundle> */}
            </gpu-render-pass>
          </gpu-command>
        </GPUCanvas>
      </AnimationLoop>
    </>
  )
}

render(<DemoApp />, document.getElementById('root'))
