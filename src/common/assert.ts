export const assertExtends = <T>() => <U extends T>(x: U) => x

export const assertRecordType = <K extends string | number | symbol, V = unknown>() => <
  U extends { [key in K]: V }
>(
  x: U
) => x
