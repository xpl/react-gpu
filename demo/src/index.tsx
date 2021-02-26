import 'panic-overlay'
import 'reset-css'
import './index.scss'

import React, { useEffect, useRef } from 'react'
import { render } from 'react-dom'
import { GPUCanvas } from 'react-gpu'

function App() {
  return (
    <>
      Hello ReactGPU!
      <GPUCanvas width={640} height={480} />
    </>
  )
}

render(<App />, document.getElementById('root'))
