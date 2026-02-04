import { createBoxShapeRecursive } from './BoxShapeRecursive.js'

export function createBoxShape(width, height, depth, thickness, origin, spherize) {
  return createBoxShapeRecursive(width, height, depth, thickness, origin, spherize)
}
