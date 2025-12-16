import { isBoolean } from 'lodash-es'
import * as THREE from '../extras/three.js'

import { getRef, Node } from './Node.js'
import { defineProps, validators, createPropertyProxy } from '../utils/defineProperty.js'
import { v } from '../utils/TempVectors.js'

const defaults = {
  scaleAware: true,
}

const propertySchema = {
  scaleAware: { default: defaults.scaleAware, validate: validators.boolean },
}

export class LOD extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'lod'

    defineProps(this, propertySchema, defaults)

    this.scaleAware = data.scaleAware
    this.lods = [] // [...{ node, maxDistance }]
  }

  insert(node, maxDistance) {
    this.lods.push({ node, maxDistance })
    this.lods.sort((a, b) => a.maxDistance - b.maxDistance) // ascending
    node.active = false
    this.add(node)
  }

  mount() {
    this.ctx.world.lods?.register(this)
    this.check()
  }

  check() {
    if (this.prevLod) {
      this.prevLod.node.active = false
      this.prevLod = null
    }
    const cameraPos = v[0].setFromMatrixPosition(this.ctx.world.camera.matrixWorld)
    const itemPos = v[1].setFromMatrixPosition(this.matrixWorld)
    let distance = cameraPos.distanceTo(itemPos)
    if (this._scaleAware) {
      v[2].setFromMatrixScale(this.matrixWorld)
      const avgScale = (v[2].x + v[2].y + v[2].z) / 3
      distance = distance / avgScale
    }
    const lod = this.lods.find(lod => distance <= lod.maxDistance)
    // if this lod hasnt change, stop here
    if (this.lod === lod) return
    // if we have a new lod, lets activate it immediately
    if (lod) {
      lod.node.active = true
    }
    // if we have a pre-existing active lod, queue to remove it next frame
    if (this.lod) {
      this.prevLod = this.lod
    }
    // track the new lod (if any)
    this.lod = lod
  }

  unmount() {
    this.ctx.world.lods?.unregister(this)
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[key] = source[key]
    }
    this.lods = source.lods.map(lod => {
      const node = this.children.find(node => node.id === lod.node.id)
      node.active = false
      const maxDistance = lod.maxDistance
      return {
        node,
        maxDistance,
      }
    })
    return this
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {
          insert(pNode, maxDistance) {
            const node = getRef(pNode)
            self.insert(node, maxDistance)
            return this
          },
        }
      )
    }
    return this.proxy
  }
}
