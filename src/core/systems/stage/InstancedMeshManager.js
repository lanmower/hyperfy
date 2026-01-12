import * as THREE from '../../extras/three.js'

export class InstancedMeshManager {
  constructor(stage, geometry, material, castShadow, receiveShadow) {
    this.stage = stage
    this.geometry = geometry
    this.material = material
    this.castShadow = castShadow
    this.receiveShadow = receiveShadow

    if (!geometry.boundsTree && geometry.computeBoundsTree) geometry.computeBoundsTree()

    this.iMesh = new THREE.InstancedMesh(geometry, material.raw, 10)
    this.iMesh.castShadow = castShadow
    this.iMesh.receiveShadow = receiveShadow
    this.iMesh.matrixAutoUpdate = false
    this.iMesh.matrixWorldAutoUpdate = false
    this.iMesh.frustumCulled = false

    this.items = []
    this.dirty = true
  }

  create(node, matrix) {
    const item = {
      idx: this.items.length,
      node,
      matrix,
    }
    this.items.push(item)
    this.iMesh.setMatrixAt(item.idx, item.matrix)
    this.dirty = true

    const sItem = {
      matrix,
      geometry: this.geometry,
      material: this.material.raw,
      getEntity: () => this.items[item.idx]?.node.ctx.entity,
      node,
    }
    this.stage.octree.insert(sItem)

    return {
      material: this.material.proxy,
      move: matrix => {
        item.matrix.copy(matrix)
        this.iMesh.setMatrixAt(item.idx, matrix)
        this.dirty = true
        this.stage.octree.move(sItem)
      },
      destroy: () => {
        const last = this.items[this.items.length - 1]
        const isOnly = this.items.length === 1
        const isLast = item === last

        if (isOnly) {
          this.items.length = 0
          this.dirty = true
        } else if (isLast) {
          this.items.pop()
          this.dirty = true
        } else {
          this.iMesh.setMatrixAt(item.idx, last.matrix)
          last.idx = item.idx
          this.items[item.idx] = last
          this.items.pop()
          this.dirty = true
        }
        this.stage.octree.remove(sItem)
      },
    }
  }

  clean() {
    if (!this.dirty) return

    const size = this.iMesh.instanceMatrix.array.length / 16
    const count = this.items.length

    if (size < this.items.length) {
      const newSize = count + 100
      this.iMesh.resize(newSize)
      for (let i = size; i < count; i++) {
        this.iMesh.setMatrixAt(i, this.items[i].matrix)
      }
    }

    this.iMesh.count = count

    if (this.iMesh.parent && !count) {
      this.stage.scene.remove(this.iMesh)
      this.dirty = false
      return
    }

    if (!this.iMesh.parent && count) {
      this.stage.scene.add(this.iMesh)
    }

    this.iMesh.instanceMatrix.needsUpdate = true
    this.dirty = false
  }
}
