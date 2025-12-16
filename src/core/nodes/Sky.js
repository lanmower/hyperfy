import { isNumber, isString } from 'lodash-es'
import { Node } from './Node.js'
import { defineProps, createPropertyProxy } from '../utils/defineProperty.js'
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

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}
