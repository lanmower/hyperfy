import { Vector3 } from '../../../core/extras/three.js'

export function createCircleShape(radius, thickness, spherize) {
  const dir = new Vector3()

  return (pos, outDir) => {
    const angle = Math.random() * Math.PI * 2

    let radiusScale
    if (thickness === 0) {
      radiusScale = 1
    } else {
      radiusScale = Math.sqrt(Math.random()) * thickness + (1 - thickness)
    }

    const x = Math.cos(angle) * radius * radiusScale
    const z = Math.sin(angle) * radius * radiusScale

    pos.set(x, 0, z)

    if (spherize) {
      dir.set(x, 0, z).normalize()
      if (dir.length() === 0) {
        dir.set(0, 1, 0)
      }
    } else {
      dir.set(0, 1, 0)
    }

    outDir.copy(dir)
  }
}
