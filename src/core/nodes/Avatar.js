import { isBoolean, isString } from 'lodash-es'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { Node } from './Node.js'
import * as THREE from 'three'
import { StateInitializer } from './base/StateInitializer.js'
import { LifecycleHelper } from './base/LifecycleHelper.js'

const propertySchema = schema('src', 'emote', 'visible', 'onLoad')
  .overrideAll({
    src: { default: null, onSet: function() { this.needsRebuild = true; this.setDirty() } },
    emote: { default: null, onSet: function() { this.instance?.setEmote(this._emote) } },
    visible: { default: true, onSet: function() { this.instance?.setVisible(this._visible) } },
    onLoad: { default: null },
  })
  .build()

export class Avatar extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'avatar', propertySchema, {}, data)
    StateInitializer.mergeState(this, StateInitializer.initLoadingState('n'))
    this.factory = data.factory
    this.hooks = data.hooks
  }

  async mount() {
    LifecycleHelper.markMounted(this)
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
    this.emote = url
  }

  get height() {
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
    return createSchemaProxy(this, propertySchema,
      {
        getHeight: this.getHeight,
        getHeadToHeight: this.getHeadToHeight,
        getBoneTransform: this.getBoneTransform,
        setLocomotion: this.setLocomotion,
        setEmote: this.setEmote,
      },
      {
        height: function() { return this.height },
      }
    )
  }
}
