import { isIterable, isArrayBufferLike } from '../common'

export interface ManagedBuffer {
  handle: GPUBuffer
  free(): void
}

export function makeBufferAllocator(device: GPUDevice) {
  interface ManagedBufferImpl extends ManagedBuffer {
    data: reactgpu.BufferData
    usage: GPUBufferUsageFlags
    refCount: number
  }

  const buffers = new Map<reactgpu.BufferData, ManagedBufferImpl>()

  return {
    alloc(usage: GPUBufferUsageFlags, data: reactgpu.BufferData): ManagedBuffer {
      let buffer = buffers.get(data)
      if (buffer) {
        if (buffer.usage !== usage) {
          throw new Error('ReactGPU requires that the usage of the same buffer does not change')
        }
        buffer.refCount++
      } else {
        let arrayBuffer: ArrayBufferLike
        if (isArrayBufferLike(data)) {
          arrayBuffer = data
        } else if (
          isArrayBufferLike((arrayBuffer = ((data as unknown) as { buffer: any }).buffer))
        ) {
          /* typed array */
        } else if (isIterable<number>(data)) {
          arrayBuffer = new Float32Array(data).buffer
        }
        const handle = device.createBuffer({
          size: arrayBuffer.byteLength,
          usage,
          mappedAtCreation: true
        })
        new Uint8Array(handle.getMappedRange()).set(new Uint8Array(arrayBuffer)) // copy bytes
        handle.unmap()
        buffer = {
          data,
          usage,
          handle,
          refCount: 1,
          free() {
            if (!buffer) {
              throw new Error('double free')
            }
            if (--buffer!.refCount === 0) {
              handle.destroy()
              buffers.delete(data)
              buffer = undefined
            }
          }
        }
      }
      return buffer
    }
  }
}

export type BufferAllocator = ReturnType<typeof makeBufferAllocator>
