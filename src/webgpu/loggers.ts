const badge = '[react-gpu]'

export const loggers = {
  verbose: {
    debug(...args: unknown[]) {
      console.debug(badge, ...args)
    },
    error(...args: unknown[]) {
      console.error(badge, ...args)
    }
  },
  default: {
    debug(...args: unknown[]) {},
    error(...args: unknown[]) {
      console.error(badge, ...args)
    }
  }
}
