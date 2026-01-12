import { Color } from '../../core/extras/three.js'
import { StructuredLogger } from '../../core/utils/logging/index.js'

const logger = new StructuredLogger('ValueStarters')
const color1 = new Color()

function toRGB(color) {
  try {
    color1.set(color)
    return [color1.r, color1.g, color1.b]
  } catch (error) {
    logger.warn('Color could not be parsed, using white instead', { color })
    return [1, 1, 1]
  }
}

export function createNumericStarter(str) {
  if (str.includes('-')) {
    const parts = str.split('-').map(n => parseFloat(n))
    if (parts.length >= 2) {
      return createNumericStarterLinear(parts[0], parts[1])
    }
  }
  if (str.includes('~')) {
    const parts = str.split('~').map(n => parseFloat(n))
    if (parts.length >= 2) {
      return createNumericStarterRandom(parts[0], parts[1])
    }
  }
  const n = parseFloat(str)
  return createNumericStarterFixed(n)
}

function createNumericStarterLinear(start, end) {
  const fn = progress => {
    return start + (end - start) * progress
  }
  fn.kind = 'linear'
  return fn
}

function createNumericStarterRandom(from, to) {
  const fn = () => {
    return from + Math.random() * (to - from)
  }
  fn.kind = 'random'
  return fn
}

function createNumericStarterFixed(n) {
  const fn = () => {
    return n
  }
  fn.kind = 'fixed'
  return fn
}

export function createColorStarter(str) {
  if (str.includes('-')) {
    const parts = str.split('-').map(toRGB)
    if (parts.length >= 2) {
      return createColorStarterLinear(parts[0], parts[1])
    }
  }
  if (str.includes('~')) {
    const parts = str.split('~').map(toRGB)
    if (parts.length >= 2) {
      return createColorStarterRandom(parts[0], parts[1])
    }
  }
  const rgb = toRGB(str)
  return createColorStarterFixed(rgb)
}

function createColorStarterLinear(start, end) {
  const fn = progress => {
    return [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
      start[2] + (end[2] - start[2]) * progress,
    ]
  }
  fn.kind = 'linear'
  return fn
}

function createColorStarterRandom(from, to) {
  const fn = () => {
    const t = Math.random()
    return [from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1]), from[2] + t * (to[2] - from[2])]
  }
  fn.kind = 'random'
  return fn
}

function createColorStarterFixed(rgb) {
  const fn = () => {
    return rgb
  }
  fn.kind = 'fixed'
  return fn
}
