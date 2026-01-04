import * as pc from '../../extras/playcanvas.js'

export class MeshInserter {
  constructor(stage) {
    this.stage = stage
    this.entities = new Map()
    this.meshCache = new Map()
  }

  insert(options) {
    return this.insertSingle(options)
  }

  insertSingle({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    const entity = new pc.Entity(`mesh-${Math.random()}`)

    entity.addComponent('model', {
      type: 'asset'
    })

    const meshInstance = new pc.MeshInstance(geometry, material.pc || material)
    if (meshInstance) {
      meshInstance.castShadow = castShadow
      meshInstance.receiveShadow = receiveShadow
    }

    entity.model.meshInstances = [meshInstance]

    let pos, quat, scale

    if (matrix && matrix.decompose) {
      const v = new pc.Vec3()
      const q = new pc.Quat()
      const s = new pc.Vec3()
      matrix.decompose(v, q, s)
      pos = v
      quat = q
      scale = s
    } else {
      pos = matrix?.translation || new pc.Vec3(0, 0, 0)
      quat = matrix?.quaternion || new pc.Quat()
      scale = matrix?.scale || new pc.Vec3(1, 1, 1)
    }

    entity.setLocalPosition(pos.x, pos.y, pos.z)
    entity.setLocalRotation(quat.x, quat.y, quat.z, quat.w)
    entity.setLocalScale(scale.x, scale.y, scale.z)

    this.stage.scene.addChild(entity)

    const sItem = {
      matrix,
      geometry,
      material: material.pc || material,
      getEntity: () => node.ctx.entity,
      node,
    }
    this.stage.octree.insert(sItem)
    this.entities.set(node.id || Math.random(), entity)

    const proxy = material.proxy || {}
    const handle = {
      material: proxy,
      setColor: (color) => {
        if (proxy.setColor) proxy.setColor(color)
      },
      setEmissive: (color) => {
        if (proxy.setEmissive) proxy.setEmissive(color)
      },
      setEmissiveIntensity: (value) => {
        if (proxy.setEmissiveIntensity) proxy.setEmissiveIntensity(value)
      },
      move: (newMatrix) => {
        let newPos, newQuat, newScale
        if (newMatrix && newMatrix.decompose) {
          const v = new pc.Vec3()
          const q = new pc.Quat()
          const s = new pc.Vec3()
          newMatrix.decompose(v, q, s)
          newPos = v
          newQuat = q
          newScale = s
        } else {
          newPos = newMatrix?.translation || pos
          newQuat = newMatrix?.quaternion || quat
          newScale = newMatrix?.scale || scale
        }

        entity.setLocalPosition(newPos.x, newPos.y, newPos.z)
        entity.setLocalRotation(newQuat.x, newQuat.y, newQuat.z, newQuat.w)
        entity.setLocalScale(newScale.x, newScale.y, newScale.z)

        this.stage.octree.move(sItem)
      },
      destroy: () => {
        this.stage.scene.removeChild(entity)
        this.stage.octree.remove(sItem)
        this.entities.delete(node.id || entity.name)
      },
    }
    return handle
  }

  clean() {
    // Cleanup for linked instances would go here
  }

  clear() {
    this.entities.forEach(entity => {
      if (entity.parent) {
        entity.parent.removeChild(entity)
      }
    })
    this.entities.clear()
    this.meshCache.clear()
  }

  destroy() {
    this.clear()
  }
}
