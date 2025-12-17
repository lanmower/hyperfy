
export class ObjectPool {
  constructor(Factory, initialSize = 10, maxSize = 100) {
    this.Factory = Factory
    this.maxSize = maxSize
    this.available = []
    this.inUse = new Set()
    for (let i = 0; i < initialSize; i++) {
      this.available.push(new Factory())
    }
  }

  acquire() {
    let obj
    if (this.available.length > 0) {
      obj = this.available.pop()
    } else {
      obj = new this.Factory()
    }
    this.inUse.add(obj)
    if (obj.reset) obj.reset()
    return obj
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj)
      if (this.available.length < this.maxSize) {
        this.available.push(obj)
      }
    }
  }

  releaseAll() {
    for (const obj of this.inUse) {
      this.available.push(obj)
    }
    this.inUse.clear()
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxSize: this.maxSize
    }
  }

  toString() {
    const stats = this.getStats()
    return `ObjectPool(${stats.inUse}/${stats.total} in use)`
  }
}
