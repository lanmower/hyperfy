import { Color } from '../../core/extras/three.js'
import { StructuredLogger } from '../../core/utils/logging/index.js'

const logger = new StructuredLogger('CurveInterpolators')
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

export function createNumberCurve(str) {
  const pointsStr = str.split('|')
  const points = pointsStr.map(point => {
    const [alpha, value] = point.split(',').map(parseFloat)
    return { alpha, value }
  })
  points.sort((a, b) => a.alpha - b.alpha)
  return function (alpha) {
    if (alpha <= points[0].alpha) return points[0].value
    if (alpha >= points[points.length - 1].alpha) return points[points.length - 1].value
    let i = 0
    while (i < points.length - 1 && alpha > points[i + 1].alpha) {
      i++
    }
    const p1 = points[i]
    const p2 = points[i + 1]
    const t = (alpha - p1.alpha) / (p2.alpha - p1.alpha)
    return p1.value + t * (p2.value - p1.value)
  }
}

export function createColorCurve(str) {
  const pointsStr = str.split('|')
  const points = []
  for (const point of pointsStr) {
    const parts = point.split(',')
    const alpha = parseFloat(parts[0])
    const color = toRGB(parts[1])
    points.push({
      alpha,
      color,
    })
  }
  points.sort((a, b) => a.alpha - b.alpha)
  return function (alpha) {
    if (!points.length) return [1, 1, 1]
    if (alpha <= points[0].alpha) return [...points[0].color]
    if (alpha >= points[points.length - 1].alpha) return [...points[points.length - 1].color]
    let i = 0
    while (i < points.length - 1 && alpha > points[i + 1].alpha) {
      i++
    }
    const p1 = points[i]
    const p2 = points[i + 1]
    const t = (alpha - p1.alpha) / (p2.alpha - p1.alpha)
    return [
      p1.color[0] + t * (p2.color[0] - p1.color[0]),
      p1.color[1] + t * (p2.color[1] - p1.color[1]),
      p1.color[2] + t * (p2.color[2] - p1.color[2]),
    ]
  }
}
