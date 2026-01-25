import { isBoolean } from '../utils/helpers/typeChecks.js'
import { Vec3 } from '../extras/playcanvas.js'

import { Node } from './Node.js'
import { getRef } from './NodeProxy.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { validators  } from '../utils/helpers/defineProperty.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'

const defaults = {
  scaleAware: true,
}

const propertySchema = schema('scaleAware')
  .overrideAll({
    scaleAware: { default: defaults.scaleAware },
  })
  .build()

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
    const cameraPos = new Vec3()
    const itemPos = new Vec3()
    cameraPos.copy(this.ctx.world.camera.getLocalPosition ? this.ctx.world.camera.getLocalPosition() : this.ctx.world.camera.position)
    itemPos.copy(this.getLocalPosition())
    let distance = cameraPos.distance(itemPos)
    if (this._scaleAware) {
      const scale = this.getLocalScale()
      const avgScale = (scale.x + scale.y + scale.z) / 3
      distance = distance / avgScale
    }
    const lod = this.lods.find(lod => distance <= lod.maxDistance)
    if (this.lod === lod) return
    if (lod) {
      lod.node.active = true
    }
    if (this.lod) {
      this.prevLod = this.lod
    }
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
    const self = this
    return createSchemaProxy(this, propertySchema,
      {
        insert(pNode, maxDistance) {
          const node = getRef(pNode)
          self.insert(node, maxDistance)
          return this
        },
      }
    )
  }
}
