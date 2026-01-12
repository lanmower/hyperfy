import { Vector3 } from '../../../core/extras/three.js'

export function createBoxShapeRecursive(width, height, depth, thickness, origin, spherize) {
  const pos = new Vector3()
  const dir = new Vector3()

  return (outPos, outDir) => {
    if (origin === 'volume') {
      if (thickness === 0 || Math.random() > thickness) {
        const face = Math.floor(Math.random() * 6)
        switch (face) {
          case 0:
            pos.set(width / 2, (Math.random() - 0.5) * height, (Math.random() - 0.5) * depth)
            if (!spherize) dir.set(1, 0, 0)
            break
          case 1:
            pos.set(-width / 2, (Math.random() - 0.5) * height, (Math.random() - 0.5) * depth)
            if (!spherize) dir.set(-1, 0, 0)
            break
          case 2:
            pos.set((Math.random() - 0.5) * width, height / 2, (Math.random() - 0.5) * depth)
            if (!spherize) dir.set(0, 1, 0)
            break
          case 3:
            pos.set((Math.random() - 0.5) * width, -height / 2, (Math.random() - 0.5) * depth)
            if (!spherize) dir.set(0, -1, 0)
            break
          case 4:
            pos.set((Math.random() - 0.5) * width, (Math.random() - 0.5) * height, depth / 2)
            if (!spherize) dir.set(0, 0, 1)
            break
          case 5:
            pos.set((Math.random() - 0.5) * width, (Math.random() - 0.5) * height, -depth / 2)
            if (!spherize) dir.set(0, 0, -1)
            break
        }

        if (spherize) {
          dir.copy(pos).normalize()
          if (dir.length() === 0) {
            dir.set(0, 1, 0)
          }
        }
      } else {
        const randomX = (Math.random() - 0.5) * width
        const randomY = (Math.random() - 0.5) * height
        const randomZ = (Math.random() - 0.5) * depth

        const distToRight = (width / 2 - Math.abs(randomX)) / (width / 2)
        const distToTop = (height / 2 - Math.abs(randomY)) / (height / 2)
        const distToFront = (depth / 2 - Math.abs(randomZ)) / (depth / 2)

        const minDist = Math.min(distToRight, distToTop, distToFront)

        if (minDist <= thickness) {
          pos.set(randomX, randomY, randomZ)

          if (spherize) {
            dir.copy(pos).normalize()
            if (dir.length() === 0) {
              dir.set(0, 1, 0)
            }
          } else {
            if (distToRight === minDist) dir.set(Math.sign(randomX), 0, 0)
            else if (distToTop === minDist) dir.set(0, Math.sign(randomY), 0)
            else if (distToFront === minDist) dir.set(0, 0, Math.sign(randomZ))
          }
        } else {
          return createBoxShapeRecursive(width, height, depth, thickness, origin, spherize)(outPos, outDir)
        }
      }
    } else if (origin === 'edge') {
      const edge = Math.floor(Math.random() * 12)
      let x, y, z

      switch (edge) {
        case 0:
          x = (Math.random() - 0.5) * width
          y = -height / 2
          z = depth / 2
          break
        case 1:
          x = (Math.random() - 0.5) * width
          y = -height / 2
          z = -depth / 2
          break
        case 2:
          x = -width / 2
          y = -height / 2
          z = (Math.random() - 0.5) * depth
          break
        case 3:
          x = width / 2
          y = -height / 2
          z = (Math.random() - 0.5) * depth
          break
        case 4:
          x = (Math.random() - 0.5) * width
          y = height / 2
          z = depth / 2
          break
        case 5:
          x = (Math.random() - 0.5) * width
          y = height / 2
          z = -depth / 2
          break
        case 6:
          x = -width / 2
          y = height / 2
          z = (Math.random() - 0.5) * depth
          break
        case 7:
          x = width / 2
          y = height / 2
          z = (Math.random() - 0.5) * depth
          break
        case 8:
          x = -width / 2
          y = (Math.random() - 0.5) * height
          z = depth / 2
          break
        case 9:
          x = width / 2
          y = (Math.random() - 0.5) * height
          z = depth / 2
          break
        case 10:
          x = -width / 2
          y = (Math.random() - 0.5) * height
          z = -depth / 2
          break
        case 11:
          x = width / 2
          y = (Math.random() - 0.5) * height
          z = -depth / 2
          break
      }

      pos.set(x, y, z)

      if (spherize) {
        dir.copy(pos).normalize()
        if (dir.length() === 0) {
          dir.set(0, 1, 0)
        }
      } else {
        if (Math.abs(x) === width / 2 && Math.abs(z) === depth / 2) {
          dir.set(Math.sign(x), 0, Math.sign(z)).normalize()
        } else if (Math.abs(x) === width / 2) {
          dir.set(Math.sign(x), 0, 0)
        } else if (Math.abs(y) === height / 2) {
          dir.set(0, Math.sign(y), 0)
        } else if (Math.abs(z) === depth / 2) {
          dir.set(0, 0, Math.sign(z))
        }
      }
    }

    outPos.copy(pos)
    outDir.copy(dir)
  }
}
