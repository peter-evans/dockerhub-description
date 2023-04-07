import unicodeSubstring = require('unicode-substring')

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export function truncateToBytes(s: string, n: number): string {
  let len = n
  while (Buffer.byteLength(s) > n) {
    s = unicodeSubstring(s, 0, len--)
  }
  return s
}
