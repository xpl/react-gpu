import 'panic-overlay'

import React, { useEffect, useRef } from 'react'
import { render } from 'react-dom'
import { GPUCanvas } from 'react-gpu'

import 'reset-css'
import './DemoApp.scss'

function DemoApp() {
  return (
    <>
      Hello ReactGPU!
      <GPUCanvas className="canvas-3d" />
    </>
  )
}

render(<DemoApp />, document.getElementById('root'))
