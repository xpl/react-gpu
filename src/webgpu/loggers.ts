import { assertRecordType } from '../common'

const badge = '[react-gpu]'

export interface Logger {
  debug(...args: unknown[]): void
  error(...args: unknown[]): void
}

export const loggers = assertRecordType<string, Logger>()({
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
})
