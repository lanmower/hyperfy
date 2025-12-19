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
        p.data.mover = value
        return true
      },
      position: (value) => {
        p.data.position = value
        return networkSync.updatePosition(value, p.data.mover)
      },
      quaternion: (value) => {
        p.data.quaternion = value
        return networkSync.updateQuaternion(value, p.data.mover)
      },
      scale: (value) => {
        p.data.scale = value
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
