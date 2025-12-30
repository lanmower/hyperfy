import * as THREE from '../../extras/three.js'
import { isBillboard, isPivot, isSpace, isEdge, isScaler } from '../../validation/TypeValidators.js'

export { isBillboard, isPivot, isSpace, isEdge, isScaler }

export function pivotGeometry(pivot, geometry, width, height) {
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
    case 'center':
    default:
      break
  }
}

export function pivotCanvas(pivot, canvas, width, height) {
  switch (pivot) {
    case 'top-left':
      canvas.style.transform = `translate(0%, 0%)`
      break
    case 'top-center':
      canvas.style.transform = `translate(-50%, 0%)`
      break
    case 'top-right':
      canvas.style.transform = `translate(-100%, 0%)`
      break
    case 'center-left':
      canvas.style.transform = `translate(0%, -50%)`
      break
    case 'center-right':
      canvas.style.transform = `translate(-100%, -50%)`
      break
    case 'bottom-left':
      canvas.style.transform = `translate(0%, -100%)`
      break
    case 'bottom-center':
      canvas.style.transform = `translate(-50%, -100%)`
      break
    case 'bottom-right':
      canvas.style.transform = `translate(-100%, -100%)`
      break
    case 'center':
    default:
      canvas.style.transform = `translate(-50%, -50%)`
      break
  }
}

export function getPivotOffset(pivot, width, height) {
  const halfW = width / 2
  const halfH = height / 2
  let tx = 0,
    ty = 0
  switch (pivot) {
    case 'top-left':
      tx = +halfW
      ty = -halfH
      break
    case 'top-center':
      tx = 0
      ty = -halfH
      break
    case 'top-right':
      tx = -halfW
      ty = -halfH
      break
    case 'center-left':
      tx = +halfW
      ty = 0
      break
    case 'center-right':
      tx = -halfW
      ty = 0
      break
    case 'bottom-left':
      tx = +halfW
      ty = +halfH
      break
    case 'bottom-center':
      tx = 0
      ty = +halfH
      break
    case 'bottom-right':
      tx = -halfW
      ty = +halfH
      break
    case 'center':
    default:
      tx = 0
      ty = 0
      break
  }

  return new THREE.Vector2(-halfW + tx, +halfH + ty)
}
