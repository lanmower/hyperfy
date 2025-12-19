import * as THREE from '../../extras/three.js'

const PER_ROW = 5
const PER_COLUMN = 20
const MAX_INSTANCES = PER_ROW * PER_COLUMN

export class NametagManager {
  constructor(mesh, canvas) {
    this.mesh = mesh
    this.canvas = canvas
    this.nametags = []
  }

  add(name, health) {
    const idx = this.nametags.length
    if (idx >= MAX_INSTANCES) return console.error('nametags: reached max')

    this.mesh.count++
    this.mesh.instanceMatrix.needsUpdate = true

    const row = Math.floor(idx / PER_ROW)
    const col = idx % PER_ROW
    const coords = this.mesh.geometry.attributes.coords
    coords.setXY(idx, col / PER_ROW, row / PER_COLUMN)
    coords.needsUpdate = true

    const matrix = new THREE.Matrix4()
    matrix.compose(new THREE.Vector3(), new THREE.Quaternion(0, 0, 0, 1), new THREE.Vector3(1, 1, 1))

    const nametag = {
      idx,
      name,
      health,
      matrix,
      move: newMatrix => {
        matrix.elements[12] = newMatrix.elements[12]
        matrix.elements[13] = newMatrix.elements[13]
        matrix.elements[14] = newMatrix.elements[14]
        this.mesh.setMatrixAt(nametag.idx, matrix)
        this.mesh.instanceMatrix.needsUpdate = true
      },
      setName: name => {
        if (nametag.name === name) return
        nametag.name = name
        this.canvas.draw(nametag)
      },
      setHealth: health => {
        if (nametag.health === health) return
        nametag.health = health
        this.canvas.draw(nametag)
      },
      destroy: () => {
        this.remove(nametag)
      },
    }

    this.nametags[idx] = nametag
    this.canvas.draw(nametag)
    return nametag
  }

  remove(nametag) {
    if (!this.nametags.includes(nametag)) {
      return console.warn('nametags: attempted to remove non-existent nametag')
    }

    const last = this.nametags[this.nametags.length - 1]
    const isLast = nametag === last

    if (isLast) {
      this.nametags.pop()
      this.canvas.clear(nametag)
    } else {
      this.canvas.clear(last)
      last.idx = nametag.idx
      this.canvas.draw(last)

      const coords = this.mesh.geometry.attributes.coords
      const row = Math.floor(nametag.idx / PER_ROW)
      const col = nametag.idx % PER_ROW
      coords.setXY(nametag.idx, col / PER_ROW, row / PER_COLUMN)
      coords.needsUpdate = true

      this.mesh.setMatrixAt(last.idx, last.matrix)
      this.nametags[last.idx] = last
      this.nametags.pop()
    }

    this.mesh.count--
    this.mesh.instanceMatrix.needsUpdate = true
  }
}
