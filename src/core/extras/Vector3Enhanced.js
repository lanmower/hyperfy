import * as THREE from './three.js'

export class Vector3Enhanced extends THREE.Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z)
    this._onChange = null
  }

  set(x, y, z) {
    super.set(x, y, z)
    this._onChange?.()
    return this
  }

  setX(x) {
    super.setX(x)
    this._onChange?.()
    return this
  }

  setY(y) {
    super.setY(y)
    this._onChange?.()
    return this
  }

  setZ(z) {
    super.setZ(z)
    this._onChange?.()
    return this
  }

  copy(v) {
    super.copy(v)
    this._onChange?.()
    return this
  }

  add(v) {
    super.add(v)
    this._onChange?.()
    return this
  }

  sub(v) {
    super.sub(v)
    this._onChange?.()
    return this
  }

  multiply(v) {
    super.multiply(v)
    this._onChange?.()
    return this
  }

  divideScalar(s) {
    super.divideScalar(s)
    this._onChange?.()
    return this
  }

  multiplyScalar(s) {
    super.multiplyScalar(s)
    this._onChange?.()
    return this
  }

  addScalar(s) {
    super.addScalar(s)
    this._onChange?.()
    return this
  }

  normalize() {
    super.normalize()
    this._onChange?.()
    return this
  }

  setFromMatrixPosition(m) {
    super.setFromMatrixPosition(m)
    this._onChange?.()
    return this
  }

  setFromMatrixScale(m) {
    super.setFromMatrixScale(m)
    this._onChange?.()
    return this
  }

  setFromArray(array, offset = 0) {
    super.setFromArray(array, offset)
    this._onChange?.()
    return this
  }

  setLength(length) {
    super.setLength(length)
    this._onChange?.()
    return this
  }

  lerp(v, t) {
    super.lerp(v, t)
    this._onChange?.()
    return this
  }

  onChange(callback) {
    this._onChange = callback
    return this
  }
}
