import { PropertyHandlerMixin } from '../../mixins/PropertyHandlerMixin.js'

export class AppPropertyHandlers {
  constructor(parent) {
    this.parent = parent
  }

  createHandlers(networkSync) {
    const p = this.parent
    return {
      blueprint: (value) => {
        p.data.blueprint = value
        return true
      },
      uploader: (value) => {
        p.data.uploader = value
        return true
      },
      mover: (value) => {
        if (value === p.data.mover) return false
        p.data.mover = value
        return true
      },
      position: (value) => {
        p.data.position = value
        p.root.position.x = value[0]
        p.root.position.y = value[1]
        p.root.position.z = value[2]
        if (p.threeScene && !p.blueprint?.scene) {
          p.threeScene.position.fromArray(value)
        }
        return networkSync.updatePosition(value, p.data.mover)
      },
      quaternion: (value) => {
        p.data.quaternion = value
        p.root.quaternion.x = value[0]
        p.root.quaternion.y = value[1]
        p.root.quaternion.z = value[2]
        p.root.quaternion.w = value[3]
        if (p.threeScene && !p.blueprint?.scene) {
          p.threeScene.quaternion.fromArray(value)
        }
        return networkSync.updateQuaternion(value, p.data.mover)
      },
      scale: (value) => {
        p.data.scale = value
        p.root.scale.x = value[0]
        p.root.scale.y = value[1]
        p.root.scale.z = value[2]
        if (p.threeScene && !p.blueprint?.scene) {
          p.threeScene.scale.fromArray(value)
        }
        return networkSync.updateScale(value, p.data.mover)
      },
      pinned: (value) => {
        p.data.pinned = value
        return false
      },
      state: (value) => {
        p.data.state = value
        return true
      },
    }
  }

  modify(data, networkSync) {
    const handlers = this.createHandlers(networkSync)
    const results = PropertyHandlerMixin.applyPropertyHandlers(this.parent, data, handlers)
    const rebuild = Object.values(results).some(v => v === true)
    if (rebuild) {
      this.parent.build()
    }
  }
}
