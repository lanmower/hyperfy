export class OctreeNode {
  constructor(bounds, depth = 0, maxDepth = 8, maxItems = 4) {
    this.bounds = bounds
    this.depth = depth
    this.maxDepth = maxDepth
    this.maxItems = maxItems
    this.items = []
    this.children = null
    this.divided = false
  }

  subdivide() {
    if (this.divided || this.depth >= this.maxDepth) return
    this.divided = true
    this.children = []

    const [minX, minY, minZ, maxX, maxY, maxZ] = this.bounds
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    const midZ = (minZ + maxZ) / 2

    const childBounds = [
      [minX, minY, minZ, midX, midY, midZ],
      [midX, minY, minZ, maxX, midY, midZ],
      [minX, midY, minZ, midX, maxY, midZ],
      [midX, midY, minZ, maxX, maxY, midZ],
      [minX, minY, midZ, midX, midY, maxZ],
      [midX, minY, midZ, maxX, midY, maxZ],
      [minX, midY, midZ, midX, maxY, maxZ],
      [midX, midY, midZ, maxX, maxY, maxZ]
    ]

    for (const bounds of childBounds) {
      this.children.push(
        new OctreeNode(bounds, this.depth + 1, this.maxDepth, this.maxItems)
      )
    }
  }

  insert(item) {
    const [x, y, z, r] = [item.x, item.y, item.z, item.radius || 0]

    if (!this._boundsContainPoint([x, y, z])) {
      return false
    }

    if (this.items.length < this.maxItems || !this.divided) {
      this.items.push(item)
      return true
    }

    if (!this.divided) {
      this.subdivide()
    }

    for (const child of this.children) {
      if (child.insert(item)) {
        this.items = this.items.filter(it => it !== item)
        return true
      }
    }

    this.items.push(item)
    return true
  }

  query(queryBounds, results = []) {
    if (!this._boundsBoundsOverlap(queryBounds)) {
      return results
    }

    for (const item of this.items) {
      if (this._boundsContainPoint([item.x, item.y, item.z])) {
        if (!results.includes(item)) results.push(item)
      }
    }

    if (this.divided) {
      for (const child of this.children) {
        child.query(queryBounds, results)
      }
    }

    return results
  }

  queryRadius(center, radius, results = []) {
    const bounds = [
      center[0] - radius, center[1] - radius, center[2] - radius,
      center[0] + radius, center[1] + radius, center[2] + radius
    ]

    if (!this._boundsBoundsOverlap(bounds)) {
      return results
    }

    for (const item of this.items) {
      const dist = Math.sqrt(
        (item.x - center[0]) ** 2 +
        (item.y - center[1]) ** 2 +
        (item.z - center[2]) ** 2
      )
      if (dist <= radius && !results.includes(item)) {
        results.push(item)
      }
    }

    if (this.divided) {
      for (const child of this.children) {
        child.queryRadius(center, radius, results)
      }
    }

    return results
  }

  remove(item) {
    this.items = this.items.filter(it => it !== item)

    if (this.divided) {
      for (const child of this.children) {
        child.remove(item)
      }
    }
  }

  clear() {
    this.items = []
    if (this.divided) {
      for (const child of this.children) {
        child.clear()
      }
      this.children = null
      this.divided = false
    }
  }

  getStats() {
    let totalItems = this.items.length
    let totalNodes = 1

    if (this.divided) {
      for (const child of this.children) {
        const stats = child.getStats()
        totalItems += stats.items
        totalNodes += stats.nodes
      }
    }

    return { items: totalItems, nodes: totalNodes }
  }

  _boundsContainPoint(point) {
    const [x, y, z] = point
    const [minX, minY, minZ, maxX, maxY, maxZ] = this.bounds
    return x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ
  }

  _boundsBoundsOverlap(other) {
    const [minX1, minY1, minZ1, maxX1, maxY1, maxZ1] = this.bounds
    const [minX2, minY2, minZ2, maxX2, maxY2, maxZ2] = other
    return minX1 <= maxX2 && maxX1 >= minX2 &&
           minY1 <= maxY2 && maxY1 >= minY2 &&
           minZ1 <= maxZ2 && maxZ1 >= minZ2
  }
}

export class Octree {
  constructor(bounds = [-100, -100, -100, 100, 100, 100], maxDepth = 8, maxItems = 4) {
    this.root = new OctreeNode(bounds, 0, maxDepth, maxItems)
    this.items = new Map()
    this.bounds = bounds
  }

  insert(id, x, y, z, radius = 0) {
    this.remove(id)
    const item = { id, x, y, z, radius }
    this.items.set(id, item)
    this.root.insert(item)
  }

  update(id, x, y, z) {
    const item = this.items.get(id)
    if (item) {
      item.x = x
      item.y = y
      item.z = z
      this.root.remove(item)
      this.root.insert(item)
    }
  }

  remove(id) {
    const item = this.items.get(id)
    if (item) {
      this.root.remove(item)
      this.items.delete(id)
    }
  }

  query(bounds) {
    return this.root.query(bounds)
  }

  queryRadius(center, radius) {
    return this.root.queryRadius(center, radius)
  }

  clear() {
    this.root.clear()
    this.items.clear()
  }

  getStats() {
    const stats = this.root.getStats()
    return {
      totalItems: stats.items,
      totalNodes: stats.nodes,
      itemsInMap: this.items.size
    }
  }
}
