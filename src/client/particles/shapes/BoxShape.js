import { Vector3 } from '../../../core/extras/three.js'

export function createBoxShape(width, height, depth, thickness, origin, spherize) {
  const pos = new Vector3()
  const dir = new Vector3()

  function createBoxShape_recursive(w, h, d, t, o, s) {
    return (outPos, outDir) => {
      if (o === 'volume') {
        if (t === 0 || Math.random() > t) {
          const face = Math.floor(Math.random() * 6)
          switch (face) {
            case 0:
              pos.set(w / 2, (Math.random() - 0.5) * h, (Math.random() - 0.5) * d)
              if (!s) dir.set(1, 0, 0)
              break
            case 1:
              pos.set(-w / 2, (Math.random() - 0.5) * h, (Math.random() - 0.5) * d)
              if (!s) dir.set(-1, 0, 0)
              break
            case 2:
              pos.set((Math.random() - 0.5) * w, h / 2, (Math.random() - 0.5) * d)
              if (!s) dir.set(0, 1, 0)
              break
            case 3:
              pos.set((Math.random() - 0.5) * w, -h / 2, (Math.random() - 0.5) * d)
              if (!s) dir.set(0, -1, 0)
              break
            case 4:
              pos.set((Math.random() - 0.5) * w, (Math.random() - 0.5) * h, d / 2)
              if (!s) dir.set(0, 0, 1)
              break
            case 5:
              pos.set((Math.random() - 0.5) * w, (Math.random() - 0.5) * h, -d / 2)
              if (!s) dir.set(0, 0, -1)
              break
          }

          if (s) {
            dir.copy(pos).normalize()
            if (dir.length() === 0) {
              dir.set(0, 1, 0)
            }
          }
        } else {
          const randomX = (Math.random() - 0.5) * w
          const randomY = (Math.random() - 0.5) * h
          const randomZ = (Math.random() - 0.5) * d

          const distToRight = (w / 2 - Math.abs(randomX)) / (w / 2)
          const distToTop = (h / 2 - Math.abs(randomY)) / (h / 2)
          const distToFront = (d / 2 - Math.abs(randomZ)) / (d / 2)

          const minDist = Math.min(distToRight, distToTop, distToFront)

          if (minDist <= t) {
            pos.set(randomX, randomY, randomZ)

            if (s) {
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
            return createBoxShape(w, h, d, t, o, s)(outPos, outDir)
          }
        }
      } else if (o === 'edge') {
        const edge = Math.floor(Math.random() * 12)
        let x, y, z

        switch (edge) {
          case 0:
            x = (Math.random() - 0.5) * w
            y = -h / 2
            z = d / 2
            break
          case 1:
            x = (Math.random() - 0.5) * w
            y = -h / 2
            z = -d / 2
            break
          case 2:
            x = -w / 2
            y = -h / 2
            z = (Math.random() - 0.5) * d
            break
          case 3:
            x = w / 2
            y = -h / 2
            z = (Math.random() - 0.5) * d
            break
          case 4:
            x = (Math.random() - 0.5) * w
            y = h / 2
            z = d / 2
            break
          case 5:
            x = (Math.random() - 0.5) * w
            y = h / 2
            z = -d / 2
            break
          case 6:
            x = -w / 2
            y = h / 2
            z = (Math.random() - 0.5) * d
            break
          case 7:
            x = w / 2
            y = h / 2
            z = (Math.random() - 0.5) * d
            break
          case 8:
            x = -w / 2
            y = (Math.random() - 0.5) * h
            z = d / 2
            break
          case 9:
            x = w / 2
            y = (Math.random() - 0.5) * h
            z = d / 2
            break
          case 10:
            x = -w / 2
            y = (Math.random() - 0.5) * h
            z = -d / 2
            break
          case 11:
            x = w / 2
            y = (Math.random() - 0.5) * h
            z = -d / 2
            break
        }

        pos.set(x, y, z)

        if (s) {
          dir.copy(pos).normalize()
          if (dir.length() === 0) {
            dir.set(0, 1, 0)
          }
        } else {
          if (Math.abs(x) === w / 2 && Math.abs(z) === d / 2) {
            dir.set(Math.sign(x), 0, Math.sign(z)).normalize()
          } else if (Math.abs(x) === w / 2) {
            dir.set(Math.sign(x), 0, 0)
          } else if (Math.abs(y) === h / 2) {
            dir.set(0, Math.sign(y), 0)
          } else if (Math.abs(z) === d / 2) {
            dir.set(0, 0, Math.sign(z))
          }
        }
      }

      outPos.copy(pos)
      outDir.copy(dir)
    }
  }

  return createBoxShape_recursive(width, height, depth, thickness, origin, spherize)
}
