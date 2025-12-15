import { isNumber, isString } from 'lodash-es'
import { Node } from './Node.js'
import { defineProps } from '../utils/defineProperty.js'
import * as THREE from '../extras/three.js'

// NOTE: actual defaults bubble up to ClientEnvironment.js
const propertySchema = {
  bg: {
    default: null,
    validate: v => v !== null && !isString(v) ? '[sky] bg not a string' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  hdr: {
    default: null,
    validate: v => v !== null && !isString(v) ? '[sky] hdr not a string' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  rotationY: {
    default: null,
    validate: v => v !== null && !isNumber(v) ? '[sky] rotationY not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  sunDirection: {
    default: null,
    validate: v => v !== null && !v?.isVector3 ? '[sky] sunDirection not a Vector3' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  sunIntensity: {
    default: null,
    validate: v => v !== null && !isNumber(v) ? '[sky] sunIntensity not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  sunColor: {
    default: null,
    validate: v => v !== null && !isString(v) ? '[sky] sunColor not a string' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  fogNear: {
    default: null,
    validate: v => v !== null && !isNumber(v) ? '[sky] fogNear not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  fogFar: {
    default: null,
    validate: v => v !== null && !isNumber(v) ? '[sky] fogFar not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  fogColor: {
    default: null,
    validate: v => v !== null && !isString(v) ? '[sky] fogColor not a string' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
}

export class Sky extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'sky'
    defineProps(this, propertySchema, data)
  }

  mount() {
    this.handle = this.ctx.world.environment.addSky?.(this)
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.handle?.destroy()
      this.handle = this.ctx.world.environment.addSky?.(this)
      this.needsRebuild = false
    }
  }

  unmount() {
    this.handle?.destroy()
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
    return this
  }

  getProxy() {
    var self = this
    if (!this.proxy) {
      let proxy = {
        get bg() {
          return self.bg
        },
        set bg(value) {
          self.bg = value
        },
        get hdr() {
          return self.hdr
        },
        set hdr(value) {
          self.hdr = value
        },
        get rotationY() {
          return self.rotationY
        },
        set rotationY(value) {
          self.rotationY = value
        },
        get sunDirection() {
          return self.sunDirection
        },
        set sunDirection(value) {
          self.sunDirection = value
        },
        get sunIntensity() {
          return self.sunIntensity
        },
        set sunIntensity(value) {
          self.sunIntensity = value
        },
        get sunColor() {
          return self.sunColor
        },
        set sunColor(value) {
          self.sunColor = value
        },
        get fogNear() {
          return self.fogNear
        },
        set fogNear(value) {
          self.fogNear = value
        },
        get fogFar() {
          return self.fogFar
        },
        set fogFar(value) {
          self.fogFar = value
        },
        get fogColor() {
          return self.fogColor
        },
        set fogColor(value) {
          self.fogColor = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
