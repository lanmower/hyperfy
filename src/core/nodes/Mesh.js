import * as THREE from '../extras/three.js'

import { Node, getRef, secureRef } from './Node.js'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry.js'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial.js'
import { v } from '../utils/TempVectors.js'
import { defineProps, onSetRebuildIf, createPropertyProxy } from '../utils/defineProperty.js'
import { schema } from '../utils/createNodeSchema.js'

const propertySchema = schema('type', 'width', 'height', 'depth', 'radius', 'linked', 'castShadow', 'receiveShadow', 'visible', 'color')
  .override('type', { onSet() { this.needsRebuild = true } })
  .override('width', { onSet: onSetRebuildIf(function() { return this._type === 'box' }) })
  .override('height', { onSet: onSetRebuildIf(function() { return this._type === 'box' }) })
  .override('depth', { onSet: onSetRebuildIf(function() { return this._type === 'box' }) })
  .override('radius', { onSet: onSetRebuildIf(function() { return this._type === 'sphere' }) })
  .override('linked', { onSet() { this.needsRebuild = true } })
  .override('castShadow', { onSet() { if (this.mesh) this.mesh.castShadow = this._castShadow } })
  .override('receiveShadow', { onSet() { if (this.mesh) this.mesh.receiveShadow = this._receiveShadow } })
  .override('visible', { onSet() { if (this.mesh) this.mesh.visible = this._visible } })
  .build()

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
    this.copyProperties(source, propertySchema)
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
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        { setSize: this.setSize },
        {
          geometry: { get: function() { return this.geometry }, set: function(v) { this.geometry = v } },
          material: { get: function() { return this.material }, set: function() { throw new Error('[mesh] set material not supported') } },
        }
      )
    }
    return this.proxy
  }
}
