import * as THREE from '../../extras/three.js'

const PER_ROW = 5
const PER_COLUMN = 20
const MAX_INSTANCES = PER_ROW * PER_COLUMN

const NAMETAG_WIDTH = 200 * 2
const NAMETAG_HEIGHT = 35 * 2

const defaultQuaternion = new THREE.Quaternion(0, 0, 0, 1)
const defaultScale = new THREE.Vector3(1, 1, 1)

export class NametagPositioner {
  constructor(nametags) {
    this.nametags = nametags
  }

  add(name, health) {
    const idx = this.nametags.nametags.length
    if (idx >= MAX_INSTANCES) return console.error('nametags: reached max')

    this.nametags.mesh.count++
    this.nametags.mesh.instanceMatrix.needsUpdate = true
    const row = Math.floor(idx / PER_ROW)
    const col = idx % PER_ROW
    const coords = this.nametags.mesh.geometry.attributes.coords
    coords.setXY(idx, col / PER_ROW, row / PER_COLUMN)
    coords.needsUpdate = true
    const matrix = new THREE.Matrix4()
    matrix.compose(new THREE.Vector3(), defaultQuaternion, defaultScale)
    const nametag = {
      idx,
      name,
      health,
      matrix,
      move: newMatrix => {
        matrix.elements[12] = newMatrix.elements[12]
        matrix.elements[13] = newMatrix.elements[13]
        matrix.elements[14] = newMatrix.elements[14]
        this.nametags.mesh.setMatrixAt(nametag.idx, matrix)
        this.nametags.mesh.instanceMatrix.needsUpdate = true
      },
      setName: name => {
        if (nametag.name === name) return
        nametag.name = name
        this.nametags.renderer.draw(nametag)
      },
      setHealth: health => {
        if (nametag.health === health) return
        nametag.health = health
        this.nametags.renderer.draw(nametag)
        console.log('SET HEALTH', health)
      },
      destroy: () => {
        this.remove(nametag)
      },
    }
    this.nametags.nametags[idx] = nametag
    this.nametags.renderer.draw(nametag)
    return nametag
  }

  remove(nametag) {
    if (!this.nametags.nametags.includes(nametag)) {
      return console.warn('nametags: attempted to remove non-existent nametag')
    }
    const last = this.nametags.nametags[this.nametags.nametags.length - 1]
    const isLast = nametag === last
    if (isLast) {
      this.nametags.nametags.pop()
      this.nametags.renderer.undraw(nametag)
    } else {
      this.nametags.renderer.undraw(last)
      last.idx = nametag.idx
      this.nametags.renderer.draw(last)
      const coords = this.nametags.mesh.geometry.attributes.coords
      const row = Math.floor(nametag.idx / PER_ROW)
      const col = nametag.idx % PER_ROW
      coords.setXY(nametag.idx, col / PER_ROW, row / PER_COLUMN)
      coords.needsUpdate = true
      this.nametags.mesh.setMatrixAt(last.idx, last.matrix)
      this.nametags.nametags[last.idx] = last
      this.nametags.nametags.pop()
    }
    this.nametags.mesh.count--
    this.nametags.mesh.instanceMatrix.needsUpdate = true
  }
}
