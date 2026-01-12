import { Vector3 } from '../../../core/extras/three.js'

export function createSphereShape(radius, thickness) {
  const dir = new Vector3()
  return (pos, outDir) => {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)

    dir.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi))

    const radiusScale = thickness === 0 ? 1 : Math.pow(Math.random(), 1 / 3) * thickness + (1 - thickness)

    pos.copy(dir).multiplyScalar(radius * radiusScale)
    outDir.copy(dir)
  }
}
