export * from './init'
export * from './example-scene'

/*
import {defaultColorAttachment, defaultDepthStencilAttachment} from 'react-gpu'

const shader = useShaderModule(`...`)
const cubeVertices = useVertexBuffer(..., [])
const bindGroup = useBindGroup(..., {
  projectionMatrix: ...,
  viewMatrix: ...
})

<gpu-command>
  <gpu-render-pass
    colorAttachments={[{
        attachment: defaultColorAttachment,
        loadValue: [0.25, 0.28, 0.26, 1.0],
        storeOp: 'store'
    }]}
    depthStencilAttachment={{
        attachment: defaultDepthStencilAttachment,
        depthLoadValue: 1.0,
        depthStoreOp: 'store',
        stencilLoadValue: 1.0,
        stencilStoreOp: 'store'
    }}>
    <gpu-draw-indexed
      pipeline={...}
      bindGroup={...}
      vertexBuffer={cubeVertices}
    />
    <gpu-draw-indexed
      pipeline={...}
      bindGroup={...}
      vertexBuffers={[...]}
      indexBuffers={[...]}
    />
    <gpu-draw-indexed>
      <gpu-pipeline>
        <gpu-bind projectionMatrix="..." viewMatrix="..."  />
      </gpu-pipeline>
      <gpu-vertex-buffer vertices="..." />
      <gpu-vertex-buffer vertices="..." />
      <gpu-index-buffer indices="..." />
    </gpu-draw-indexed>
  </gpu-pass>
</gpu-command>

 */
