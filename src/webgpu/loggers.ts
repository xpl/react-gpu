import { assertRecordType } from '../common'

export interface Logger {
  debug(...args: unknown[]): void
  error(...args: unknown[]): void
}

export const loggers = assertRecordType<string, Logger>()({
  verbose: {
    debug: console.debug,
    error: console.error
  },
  default: {
    debug(...args: unknown[]) {},
    error: console.error
  }
})
