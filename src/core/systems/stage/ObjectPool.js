import * as THREE from '../../extras/three.js'

export class ObjectPool {
  constructor() {
    this.pools = {
      vector3: [],
      quaternion: [],
      matrix4: [],
      euler: [],
      color: [],
    }
    this.stats = {
      created: 0,
      reused: 0,
      returned: 0,
    }
  }

  getVector3() {
    if (this.pools.vector3.length > 0) {
      this.stats.reused++
      return this.pools.vector3.pop()
    }
    this.stats.created++
    return new THREE.Vector3()
  }

  returnVector3(v) {
    v.set(0, 0, 0)
    this.pools.vector3.push(v)
    this.stats.returned++
  }

  getQuaternion() {
    if (this.pools.quaternion.length > 0) {
      this.stats.reused++
      return this.pools.quaternion.pop()
    }
    this.stats.created++
    return new THREE.Quaternion()
  }

  returnQuaternion(q) {
    q.set(0, 0, 0, 1)
    this.pools.quaternion.push(q)
    this.stats.returned++
  }

  getMatrix4() {
    if (this.pools.matrix4.length > 0) {
      this.stats.reused++
      return this.pools.matrix4.pop()
    }
    this.stats.created++
    return new THREE.Matrix4()
  }

  returnMatrix4(m) {
    m.identity()
    this.pools.matrix4.push(m)
    this.stats.returned++
  }

  getEuler() {
    if (this.pools.euler.length > 0) {
      this.stats.reused++
      return this.pools.euler.pop()
    }
    this.stats.created++
    return new THREE.Euler()
  }

  returnEuler(e) {
    e.set(0, 0, 0)
    this.pools.euler.push(e)
    this.stats.returned++
  }

  getColor() {
    if (this.pools.color.length > 0) {
      this.stats.reused++
      return this.pools.color.pop()
    }
    this.stats.created++
    return new THREE.Color()
  }

  returnColor(c) {
    c.set(0xffffff)
    this.pools.color.push(c)
    this.stats.returned++
  }

  getStats() {
    const poolSizes = Object.entries(this.pools).reduce((acc, [key, pool]) => {
      acc[key] = pool.length
      return acc
    }, {})

    return {
      ...this.stats,
      poolSizes,
      reuseRate: this.stats.created > 0
        ? ((this.stats.reused / (this.stats.created + this.stats.reused)) * 100).toFixed(1) + '%'
        : '0%',
    }
  }

  clear() {
    Object.keys(this.pools).forEach(key => {
      this.pools[key] = []
    })
    this.stats = {
      created: 0,
      reused: 0,
      returned: 0,
    }
  }
}
