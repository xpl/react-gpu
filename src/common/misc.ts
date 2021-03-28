export function isIterable<T>(x: any): x is Iterable<T> {
  return Symbol.iterator in x
}

export function isArrayBufferLike(x: any): x is ArrayBufferLike {
  return x instanceof ArrayBuffer || x instanceof SharedArrayBuffer
}
