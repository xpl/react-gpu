import 'panic-overlay'

import React, { useEffect, useRef, useState } from 'react'
import { render } from 'react-dom'
import { GPUCanvas, AnimationLoop, useAnimationLoop } from 'react-gpu'

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
        <GPUCanvas className="canvas-3d" />
      </AnimationLoop>
    </>
  )
}

render(<DemoApp />, document.getElementById('root'))
