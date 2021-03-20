export function combineHashes(a: number, b: number) {
  return a ^ rotateLeft(b, 16)
}

export function mulberry32hash(x: number) {
  var t = (x += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return (t ^ (t >>> 14)) >>> 0
}

function rotateLeft(x: number, n: number) {
  return (x << n) | (x >> (32 - n))
}
