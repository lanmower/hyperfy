
import { some } from 'lodash-es'
import { customAlphabet } from 'nanoid'

const ALPHABET = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


export const uuid = customAlphabet(ALPHABET, 10)

export function clamp(n, low, high) {
  return Math.max(Math.min(n, high), low)
}

export function num(min, max, dp = 0) {
  const value = Math.random() * (max - min) + min
  return parseFloat(value.toFixed(dp))
}
