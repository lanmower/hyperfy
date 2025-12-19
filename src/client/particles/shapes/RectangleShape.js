import { Vector3 } from '../../../core/extras/three.js'

export function createRectangleShape(width, depth, thickness, spherize = false) {
  const dir = new Vector3()

  return (pos, outDir) => {
    const useEdge = thickness === 0 || Math.random() > thickness

    let x, z

    if (useEdge) {
      const edge = Math.floor(Math.random() * 4)
      switch (edge) {
        case 0:
          x = width / 2
          z = (Math.random() - 0.5) * depth
          break
        case 1:
          x = -width / 2
          z = (Math.random() - 0.5) * depth
          break
        case 2:
          x = (Math.random() - 0.5) * width
          z = depth / 2
          break
        case 3:
          x = (Math.random() - 0.5) * width
          z = -depth / 2
          break
      }
    } else {
      x = (Math.random() - 0.5) * width
      z = (Math.random() - 0.5) * depth
    }

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
