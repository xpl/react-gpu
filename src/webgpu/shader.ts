import { Logger } from './loggers'

export interface ManagedShader {
  handle: GPUShaderModule
  free(): void
}

export function makeShaderAllocator(device: GPUDevice, log: Logger) {
  interface ManagedShaderImpl extends ManagedShader {
    desc: GPUShaderModuleDescriptor
    compilationInfo?: Promise<GPUCompilationInfo>
    refCount: number
  }

  const shaders = new Map<GPUShaderModuleDescriptor['code'], ManagedShaderImpl>()

  return {
    alloc(
      desc: GPUShaderModuleDescriptor,
      onCompilationInfo?: (info: GPUCompilationInfo) => void
    ): ManagedShader {
      let shader = shaders.get(desc.code)
      if (shader) {
        shader.refCount++
      } else {
        log.debug(`Creating shader of size ${desc.code.length}`)
        const handle = device.createShaderModule(desc)
        shader = {
          desc,
          handle,
          refCount: 1,
          free() {
            if (!shader) {
              throw new Error('double free')
            }
            if (--shader!.refCount === 0) {
              log.debug(`Destroying shader of size ${desc.code.length}`)
              shaders.delete(desc.code)
              shader = undefined
            }
          }
        }
      }
      if (onCompilationInfo) {
        ;(shader.compilationInfo ||= shader.handle.compilationInfo()).then(onCompilationInfo)
      }
      return shader
    }
  }
}

export type ShaderAllocator = ReturnType<typeof makeShaderAllocator>
