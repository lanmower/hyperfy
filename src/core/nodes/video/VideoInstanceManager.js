import { uuid } from '../../utils.js'

export class VideoInstanceManager {
  constructor(parent) {
    this.parent = parent
  }

  async loadInstance(n) {
    const p = this.parent
    const key = this.getLinkedKey()

    let screen
    if (p._screenId) {
      screen = p.ctx.world.livekit.registerScreenNode(p)
    }

    if (screen) {
      return screen
    } else if (p._src) {
      let factory = p.ctx.world.loader.get('video', p._src)
      if (!factory) factory = await p.ctx.world.loader.load('video', p._src)
      if (p.n !== n) return null
      return factory.get(key)
    }
    return null
  }

  getLinkedKey() {
    const p = this.parent
    let key = ''
    if (p._linked === true) {
      key += 'default'
    } else if (p._linked === false) {
      key += uuid()
    } else {
      key += p._linked
    }
    return key
  }

  cleanup() {
    const p = this.parent
    if (p.instance) {
      p.instance.release()
      p.instance = null
    }
    p.ctx.world.livekit.unregisterScreenNode(p)
  }
}
