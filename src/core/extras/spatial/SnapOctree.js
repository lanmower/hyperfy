import * as THREE from './three.js'

const _v1 = new THREE.Vector3()
const _sphere = new THREE.Sphere()
const _arr = []

export class SnapOctree {
  constructor({ center, size }) {
    this.root = new SnapOctreeNode(null, center, size)
  }

  insert(point) {
    let added = this.root.insert(point)
    if (!added) {
      while (!this.root.canContain(point.position)) {
        this.expand()
      }
      added = this.root.insert(point)
    }
    return added
  }

  remove(point) {
    point._node.remove(point)
  }

  move(point) {
    if (!point._node) {
      return false
    }
    if (point._node.canContain(point.position)) {
      return
    }
    const prevNode = point._node
    this.remove(point)
    const added = this.insert(point)
    if (!added) {
      console.error('octree point moved but was not re-added. did it move outside octree bounds?')
      return false
    }
    prevNode.checkCollapse()
    return true
  }

  expand() {
    let prevRoot
    let size
    let center

    prevRoot = this.root
    size = prevRoot.size * 2
    center = new THREE.Vector3(
      prevRoot.center.x + prevRoot.size,
      prevRoot.center.y + prevRoot.size,
      prevRoot.center.z + prevRoot.size
    )
    const first = new SnapOctreeNode(null, center, size)
    first.subdivide()
    first.children[0].destroy()
    first.children[0] = prevRoot
    prevRoot.parent = first
    this.root = first
    this.root.count = prevRoot.count

    prevRoot = this.root
    size = prevRoot.size * 2
    center = new THREE.Vector3(
      prevRoot.center.x - prevRoot.size,
      prevRoot.center.y - prevRoot.size,
      prevRoot.center.z - prevRoot.size
    )
    const second = new SnapOctreeNode(null, center, size)
    second.subdivide()
    second.children[7].destroy()
    second.children[7] = prevRoot
    prevRoot.parent = second
    this.root = second
    this.root.count = prevRoot.count
  }

  query(position, radius, results = []) {
    _sphere.center.copy(position)
    _sphere.radius = radius
    this.root.query(_sphere, results)
    results.sort(sortAscending)
    return results
  }

  getDepth() {
    return this.root.getDepth()
  }

  getCount() {
    return this.root.getCount()
  }
}

class SnapOctreeNode {
  constructor(parent, center, size) {
    this.parent = parent
    this.center = center
    this.size = size
    this.inner = new THREE.Box3(
      new THREE.Vector3(center.x - size, center.y - size, center.z - size),
      new THREE.Vector3(center.x + size, center.y + size, center.z + size)
    )
    this.points = []
    this.count = 0
    this.children = []
  }

  insert(point) {
    if (!this.canContain(point.position)) {
      return false
    }

    if (this.size < 1 || !this.children.length) {
      this.points.push(point)
      point._node = this
      this.inc(1)
      return true
    }

    if (!this.children.length) {
      this.subdivide()
    }

    for (const child of this.children) {
      if (child.insert(point)) {
        return true
      }
    }

    console.error('snap octree insert fail')
  }

  remove(point) {
    const idx = this.points.indexOf(point)
    this.points.splice(idx, 1)
    point._node = null
    this.dec(1)
  }

  inc(amount) {
    let node = this
    while (node) {
      node.count += amount
      node = node.parent
    }
  }

  dec(amount) {
    let node = this
    while (node) {
      node.count -= amount
      node = node.parent
    }
  }

  canContain(position) {
    return this.inner.containsPoint(position)
  }

  checkCollapse() {
    let match
    let node = this
    while (node) {
      if (node.count) break
      if (node.children.length) match = node
      node = node.parent
    }
    match?.collapse()
  }

  collapse() {
    for (const child of this.children) {
      child.collapse()
      child.destroy()
    }
    this.children = []
  }

  subdivide() {
    if (this.children.length) return // ensure we dont subdivide twice
    const halfSize = this.size / 2
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const center = new THREE.Vector3(
            this.center.x + halfSize * (2 * x - 1),
            this.center.y + halfSize * (2 * y - 1),
            this.center.z + halfSize * (2 * z - 1)
          )
          const child = new SnapOctreeNode(this, center, halfSize)
          this.children.push(child)
        }
      }
    }
  }

  query(sphere, results) {
    if (!sphere.intersectsBox(this.inner)) {
      return
    }

    for (const point of this.points) {
      if (!point.active) continue
      const distance = sphere.center.distanceTo(point.position)
      if (distance <= sphere.radius) {
        results.push({
          position: point.position,
          distance,
        })
      }
    }

    for (const child of this.children) {
      child.query(sphere, results)
    }
  }

  getDepth() {
    if (this.children.length === 0) {
      return 1
    }
    return 1 + Math.max(...this.children.map(child => child.getDepth()))
  }

  getCount() {
    let count = 1
    for (const child of this.children) {
      count += child.getCount()
    }
    return count
  }

  destroy() {
    this.points = []
    this.children = []
  }
}

function sortAscending(a, b) {
  return a.distance - b.distance
}
