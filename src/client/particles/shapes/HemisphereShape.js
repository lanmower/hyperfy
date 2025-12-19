import { Vector3 } from '../../../core/extras/three.js'

export function createHemisphereShape(radius, thickness) {
  const normal = new Vector3()
  return (pos, outDir) => {
    const u = Math.random()
    const cosTheta = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(cosTheta)

    normal.set(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    )

    const radiusScale = thickness === 0 ? 1 : Math.pow(Math.random(), 1 / 3) * thickness + (1 - thickness)

    pos.copy(normal).multiplyScalar(radius * radiusScale)
    outDir.copy(normal)
  }
}
