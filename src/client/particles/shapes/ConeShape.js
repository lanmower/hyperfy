import { Vector3 } from '../../../core/extras/three.js'
import { DEG2RAD } from '../../../core/extras/general.js'

export function createConeShape(baseRadius, thickness, angleFromCenter) {
  const dir = new Vector3()
  const angleRad = angleFromCenter * DEG2RAD

  return (pos, outDir) => {
    const angle = Math.random() * Math.PI * 2

    let radiusScale
    if (thickness === 0) {
      radiusScale = 1
    } else {
      radiusScale = Math.sqrt(Math.random()) * thickness + (1 - thickness)
    }

    const x = Math.cos(angle) * baseRadius * radiusScale
    const z = Math.sin(angle) * baseRadius * radiusScale

    pos.set(x, 0, z)

    dir
      .set(
        Math.sin(angleRad) * Math.cos(angle),
        Math.cos(angleRad),
        Math.sin(angleRad) * Math.sin(angle)
      )
      .normalize()

    outDir.copy(dir)
  }
}
