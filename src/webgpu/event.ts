export function event<F extends (...args: any) => void>() {
  const callbacks = new Set<F>()
  return Object.assign(
    function emit(...args: Parameters<F>) {
      for (const f of callbacks) f.call(null, ...args)
    },
    {
      on(f: F) {
        callbacks.add(f)
      },
      off(f: F) {
        callbacks.delete(f)
      }
    }
  )
}
