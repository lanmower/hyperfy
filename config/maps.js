import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const Maps = {
  schwust: {
    name: 'schwust',
    model: join(__dirname, '../world/schwust.glb'),
    spawnPoints: [
      [0, 5, 0],
      [20, 5, -20],
      [-20, 5, 20],
      [0, 5, -30]
    ],
    bounds: [-64, -10, -94, 48, 20, 38],
    gravity: [0, -9.81, 0],
    collider: 'trimesh_static'
  },

  arena: {
    name: 'arena',
    model: null,
    spawnPoints: [
      [-10, 2, 0],
      [10, 2, 0],
      [0, 2, -10],
      [0, 2, 10]
    ],
    bounds: [-20, -5, -20, 20, 20, 20],
    gravity: [0, -9.81, 0],
    collider: 'box'
  }
}

export function getMap(name) {
  return Maps[name]
}

export function getSpawnPoint(map, playerIndex) {
  const points = getMap(map).spawnPoints
  return points[playerIndex % points.length]
}

export function isInBounds(map, position) {
  const [minX, minY, minZ, maxX, maxY, maxZ] = getMap(map).bounds
  return position[0] >= minX && position[0] <= maxX &&
         position[1] >= minY && position[1] <= maxY &&
         position[2] >= minZ && position[2] <= maxZ
}
