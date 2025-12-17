import { imageFits, audioGroups, distanceModels, pivots } from '../../utils/collections/NodeConstants.js'

export function isDistanceModel(value) {
  return distanceModels.includes(value)
}

export function isGroup(value) {
  return audioGroups.includes(value)
}

export function isFit(value) {
  return imageFits.includes(value)
}

export function isPivot(value) {
  return pivots.includes(value)
}

export function applyPivot(geometry, width, height, pivot) {
  if (pivot === 'center') return
  let offsetX = 0
  let offsetY = 0
  if (pivot.includes('left')) {
    offsetX = width / 2
  } else if (pivot.includes('right')) {
    offsetX = -width / 2
  }
  if (pivot.includes('top')) {
    offsetY = -height / 2
  } else if (pivot.includes('bottom')) {
    offsetY = height / 2
  }
  if (offsetX !== 0 || offsetY !== 0) {
    geometry.translate(offsetX, offsetY, 0)
  }
}
