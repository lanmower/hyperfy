import { distanceModels, audioGroups, imageFits } from '../../utils/collections/NodeConstants.js'

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
  return ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].includes(value)
}

export function applyPivot(geometry, width, height, pivot) {
  if (pivot === 'center') return
  const halfWidth = width / 2
  const halfHeight = height / 2
  switch (pivot) {
    case 'top-left':
      geometry.translate(halfWidth, -halfHeight, 0)
      break
    case 'top-center':
      geometry.translate(0, -halfHeight, 0)
      break
    case 'top-right':
      geometry.translate(-halfWidth, -halfHeight, 0)
      break
    case 'center-left':
      geometry.translate(halfWidth, 0, 0)
      break
    case 'center-right':
      geometry.translate(-halfWidth, 0, 0)
      break
    case 'bottom-left':
      geometry.translate(halfWidth, halfHeight, 0)
      break
    case 'bottom-center':
      geometry.translate(0, halfHeight, 0)
      break
    case 'bottom-right':
      geometry.translate(-halfWidth, halfHeight, 0)
      break
  }
}
