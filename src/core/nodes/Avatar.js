import { isBoolean, isString } from 'lodash-es'
import { defineProps } from '../utils/defineProperty.js'
import { Node } from './Node.js'
import * as THREE from 'three'

const propertySchema = {
  src: {
    default: null,
    validate: v => v !== null && !isString(v) ? '[avatar] src not a string' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  emote: {
    default: null,
    validate: v => v !== null && !isString(v) ? '[avatar] emote not a string' : null,
    onSet(value) {
      this.instance?.setEmote(value)
    },
  },
  visible: {
    default: true,
    validate: v => !isBoolean(v) ? '[avatar] visible not a boolean' : null,
    onSet(value) {
      this.instance?.setVisible(value)
    },
  },
  onLoad: {
    default: null,
  },
}

export class Avatar extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'avatar'
    defineProps(this, propertySchema, data)

    this.factory = data.factory
    this.hooks = data.hooks
    this.instance = null
    this.n = 0
  }

  async mount() {
    this.needsRebuild = false
    if (this._src) {
      const n = ++this.n
      let avatar = this.ctx.world.loader.get('avatar', this._src)
      if (!avatar) avatar = await this.ctx.world.loader.load('avatar', this._src)
      if (this.n !== n) return
      this.factory = avatar?.factory
      this.hooks = avatar?.hooks
    }
    if (this.factory) {
      this.instance = this.factory.create(this.matrixWorld, this.hooks, this)
      this.instance.setEmote(this._emote)
      this.instance.setVisible(this._visible)
      if (this._disableRateCheck) {
        this.instance.disableRateCheck()
        // this._disableRateCheck = null
      }
      this.ctx.world?.setHot(this.instance, true)
      this.ctx.world?.avatars.add(this.instance)
      this.onLoad?.()
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
    }
    if (didMove) {
      this.instance?.move(this.matrixWorld)
    }
  }

  unmount() {
    this.n++
    if (this.instance) {
      this.ctx.world?.setHot(this.instance, false)
      this.ctx.world?.avatars.remove(this.instance)
      this.instance.destroy()
      this.instance = null
    }
  }

  applyStats(stats) {
    this.factory?.applyStats(stats)
  }

  getHeight() {
    return this.instance?.height || null
  }

  getHeadToHeight() {
    return this.instance?.headToHeight || null
  }

  getBoneTransform(boneName) {
    return this.instance?.getBoneTransform(boneName)
  }

  disableRateCheck() {
    if (this.instance) {
      this.instance.disableRateCheck()
    } else {
      this._disableRateCheck = true
    }
  }

  setLocomotion(mode, axis, gazeDir) {
    this.instance?.setLocomotion(mode, axis, gazeDir)
  }

  setEmote(url) {
    // DEPRECATED: use .emote
    this.emote = url
  }

  get height() {
    // DEPRECATED: use .getHeight()
    return this.getHeight()
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.copyProperties(source, propertySchema)
    this.factory = source.factory
    this.hooks = source.hooks
    return this
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get src() {
          return self.src
        },
        set src(value) {
          self.src = value
        },
        get emote() {
          return self.emote
        },
        set emote(value) {
          self.emote = value
        },
        get visible() {
          return self.visible
        },
        set visible(value) {
          self.visible = value
        },
        get onLoad() {
          return self.onLoad
        },
        set onLoad(value) {
          self.onLoad = value
        },
        getHeight() {
          return self.getHeight()
        },
        getHeadToHeight() {
          return self.getHeadToHeight()
        },
        getBoneTransform(boneName) {
          return self.getBoneTransform(boneName)
        },
        setLocomotion(mode, axis, gazeDir) {
          self.setLocomotion(mode, axis, gazeDir)
        },
        setEmote(url) {
          // DEPRECATED: use .emote
          return self.setEmote(url)
        },
        get height() {
          // DEPRECATED: use .getHeight()
          return self.height
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
