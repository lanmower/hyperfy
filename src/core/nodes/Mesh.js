import * as THREE from '../extras/three.js'

import { Node, getRef, secureRef } from './Node.js'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry.js'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial.js'
import { v } from '../utils/TempVectors.js'
import { defineProps, validators, onSetRebuild, onSetRebuildIf } from '../utils/defineProperty.js'
import { geometryTypes as types } from '../utils/NodeConstants.js'

const defaults = {
  type: 'box',
  width: 1,
  height: 1,
  depth: 1,
  radius: 0.5,
  geometry: null,
  material: null,
  linked: true,
  castShadow: true,
  receiveShadow: true,
  visible: true, // DEPRECATED: use Node.active
}

const propertySchema = {
  type: {
    default: defaults.type,
    validate: validators.enum(types),
    onSet: onSetRebuild(),
  },
  width: {
    default: defaults.width,
    validate: validators.number,
    onSet: onSetRebuildIf(function() { return this._type === 'box' }),
  },
  height: {
    default: defaults.height,
    validate: validators.number,
    onSet: onSetRebuildIf(function() { return this._type === 'box' }),
  },
  depth: {
    default: defaults.depth,
    validate: validators.number,
    onSet: onSetRebuildIf(function() { return this._type === 'box' }),
  },
  radius: {
    default: defaults.radius,
    validate: validators.number,
    onSet: onSetRebuildIf(function() { return this._type === 'sphere' }),
  },
  linked: {
    default: defaults.linked,
    validate: validators.boolean,
    onSet: onSetRebuild(),
  },
  castShadow: {
    default: defaults.castShadow,
    validate: validators.boolean,
    onSet() { if (this.mesh) this.mesh.castShadow = this._castShadow },
  },
  receiveShadow: {
    default: defaults.receiveShadow,
    validate: validators.boolean,
    onSet() { if (this.mesh) this.mesh.receiveShadow = this._receiveShadow },
  },
  visible: {
    default: defaults.visible,
    validate: validators.boolean,
    onSet() { if (this.mesh) this.mesh.visible = this._visible },
  },
}

let boxes = {}
const getBox = (width, height, depth) => {
  const key = `${width},${height},${depth}`
  if (!boxes[key]) {
    boxes[key] = new THREE.BoxGeometry(width, height, depth)
  }
  return boxes[key]
}

let spheres = {}
const getSphere = radius => {
  const key = radius
  if (!spheres[key]) {
    spheres[key] = new THREE.SphereGeometry(radius, 16, 12)
  }
  return spheres[key]
}

export class Mesh extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'mesh'
    defineProps(this, propertySchema, defaults, data)
  }

  mount() {
    this.needsRebuild = false
    if (!this._geometry) return
    let geometry
    if (this._type === 'box') {
      geometry = getBox(this._width, this._height, this._depth)
    } else if (this._type === 'sphere') {
      geometry = getSphere(this._radius)
    } else if (this._type === 'geometry') {
      geometry = this._geometry
    }
    if (this._visible) {
      this.handle = this.ctx.world.stage.insert({
        geometry,
        material: this._material,
        linked: this._linked,
        castShadow: this._castShadow,
        receiveShadow: this._receiveShadow,
        matrix: this.matrixWorld,
        node: this,
      })
    } else {
      this.sItem = {
        matrix: this.matrixWorld,
        geometry,
        material: this._material,
        getEntity: () => this.ctx.entity,
        node: this,
      }
      this.ctx.world.stage.octree.insert(this.sItem)
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      if (this.handle) {
        this.handle.move(this.matrixWorld)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
    }
  }

  unmount() {
    this.handle?.destroy()
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
    this.handle = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
    this._geometry = source._geometry
    this._material = source._material
    return this
  }

  applyStats(stats) {
    if (this._geometry && !stats.geometries.has(this._geometry.uuid)) {
      stats.geometries.add(this._geometry.uuid)
      stats.triangles += getTrianglesFromGeometry(this._geometry)
    }
    if (this._material && !stats.materials.has(this._material.uuid)) {
      stats.materials.add(this._material.uuid)
      stats.textureBytes += getTextureBytesFromMaterial(this._material)
    }
  }

  setSize(width, height, depth) {
    this.width = width
    this.height = height
    this.depth = depth
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    if (value && !value.isBufferGeometry) {
      throw new Error('[mesh] geometry invalid')
    }
    if (this._geometry === value) return
    this._geometry = value
    this.needsRebuild = true
    this.setDirty()
  }

  get material() {
    return this.handle?.material
  }

  set material(value = defaults.material) {
    if (value && !value.isMaterial) {
      throw new Error('[mesh] material invalid')
    }
    if (this._material === value) return
    this._material = value
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get depth() {
          return self.depth
        },
        set depth(value) {
          self.depth = value
        },
        setSize(width, height, depth) {
          self.setSize(width, height, depth)
        },
        get radius() {
          return self.radius
        },
        set radius(value) {
          self.radius = value
        },
        get geometry() {
          return self.geometry
        },
        set geometry(value) {
          self.geometry = value
        },
        get material() {
          return self.material
        },
        set material(value) {
          throw new Error('[mesh] set material not supported')
          // if (!value) throw new Error('[mesh] material cannot be unset')
          // self.ctx.world._allowMaterial = true
          // self.material = value._ref
          // self.ctx.world._allowMaterial = false
          // self.needsRebuild = true
          // self.setDirty()
        },
        get linked() {
          return self.linked
        },
        set linked(value) {
          self.linked = value
        },
        get castShadow() {
          return self.castShadow
        },
        set castShadow(value) {
          self.castShadow = value
        },
        get receiveShadow() {
          return self.receiveShadow
        },
        set receiveShadow(value) {
          self.receiveShadow = value
        },
        get visible() {
          return self.visible
        },
        set visible(value) {
          self.visible = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
