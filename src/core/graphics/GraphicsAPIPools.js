// PlayCanvas object pooling
import { Vec3, Quat, Mat4 } from '../extras/playcanvas.js'

export class VectorPool {
  constructor(size = 1000) {
    this.pool = []
    this.size = size
    this.index = 0
    for (let i = 0; i < size; i++) {
      this.pool.push(new Vec3())
    }
  }

  get() {
    const vec = this.pool[this.index]
    this.index = (this.index + 1) % this.size
    return vec.set(0, 0, 0)
  }

  reset() {
    this.index = 0
  }
}

export class QuaternionPool {
  constructor(size = 500) {
    this.pool = []
    this.size = size
    this.index = 0
    for (let i = 0; i < size; i++) {
      this.pool.push(new Quat())
    }
  }

  get() {
    const quat = this.pool[this.index]
    this.index = (this.index + 1) % this.size
    return quat.set(0, 0, 0, 1)
  }

  reset() {
    this.index = 0
  }
}

export class MatrixPool {
  constructor(size = 500) {
    this.pool = []
    this.size = size
    this.index = 0
    for (let i = 0; i < size; i++) {
      this.pool.push(new Mat4())
    }
  }

  get() {
    const matrix = this.pool[this.index]
    this.index = (this.index + 1) % this.size
    return matrix.setIdentity()
  }

  reset() {
    this.index = 0
  }
}
