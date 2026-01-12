import { isBoolean, isNumber, isString } from 'lodash-es'
import * as pc from '../extras/playcanvas.js'

import { Node } from './Node.js'
import { getRef, secureRef } from './NodeProxy.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { createVideoMaterialProxy } from './video/VideoMaterialProxy.js'
import { isDistanceModel, isGroup, isFit, isPivot } from '../validation/TypeValidators.js'
import { VideoHelper } from '../utils/helpers/Helpers.js'
import { StateInitializer } from './base/StateInitializer.js'
import { LifecycleHelper } from './base/LifecycleHelper.js'
import { VideoLoaderController } from './VideoLoader.js'
import { VideoPlaybackController } from './VideoPlayback.js'
const { applyPivot } = VideoHelper

const propertySchema = schema('screenId', 'src', 'linked', 'loop', 'visible', 'color', 'lit', 'doubleside', 'castShadow', 'receiveShadow', 'aspect', 'fit', 'width', 'height', 'pivot', 'volume', 'group', 'spatial', 'distanceModel', 'refDistance', 'maxDistance', 'rolloffFactor', 'coneInnerAngle', 'coneOuterAngle', 'coneOuterGain')
  .overrideAll({
    src: { onSet() { this._loading = true; this.markRebuild(); this.setDirty() } },
    linked: { onSet() { this.markRebuild(); this.setDirty() } },
    loop: { onSet(v) { if (this.instance) this.instance.loop = v } },
    visible: { onSet() { this.markRebuild(); this.setDirty() } },
    color: { onSet() { this.markRebuild(); this.setDirty() } },
    lit: { onSet() { this.markRebuild(); this.setDirty() } },
    doubleside: { onSet(v) { if (this.material) { this.material.twoSided = v; this.material.update() } } },
    castShadow: { onSet(v) { if (this.mesh) this.mesh.castShadow = v } },
    receiveShadow: { onSet(v) { if (this.mesh) this.mesh.receiveShadow = v } },
    aspect: { onSet() { this.markRebuild(); this.setDirty() } },
    fit: { onSet() { this.markRebuild(); this.setDirty() } },
    width: { onSet() { this.markRebuild(); this.setDirty() } },
    height: { onSet() { this.markRebuild(); this.setDirty() } },
    pivot: { onSet() { this.markRebuild(); this.setDirty() } },
    volume: { onSet(v) { if (this.gain) this.gain.gain.value = v } },
    group: { onSet() { this.markRebuild(); this.setDirty() } },
    spatial: { onSet() { this.markRebuild(); this.setDirty() } },
    distanceModel: { onSet(v) { if (this.pannerNode) this.pannerNode.distanceModel = v } },
    refDistance: { onSet(v) { if (this.pannerNode) this.pannerNode.refDistance = v } },
    maxDistance: { onSet(v) { if (this.pannerNode) this.pannerNode.maxDistance = v } },
    rolloffFactor: { onSet(v) { if (this.pannerNode) this.pannerNode.rolloffFactor = v } },
    coneInnerAngle: { onSet(v) { if (this.pannerNode) this.pannerNode.coneInnerAngle = v } },
    coneOuterAngle: { onSet(v) { if (this.pannerNode) this.pannerNode.coneOuterAngle = v } },
    coneOuterGain: { onSet(v) { if (this.pannerNode) this.pannerNode.coneOuterGain = v } },
  })
  .build()

export class Video extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'video', propertySchema, {}, data)
    this._geometry = getRef(data.geometry)

    StateInitializer.mergeState(
      this,
      StateInitializer.initLoadingState('n'),
      StateInitializer.initRenderingState()
    )
    this.loader = new VideoLoaderController(this)
    this.playback = new VideoPlaybackController(this)
  }

  async mount() {
    LifecycleHelper.markMounted(this)
    if (this.ctx.world.network.isServer) return
    this._loading = true
    const n = ++this.n
    this.instance = await this.loader.loadInstance(n)
    if (this._visible) {
      const material = this.playback.renderer.createMaterial(this._lit, this._doubleside, this._color)
      let geometry = this._geometry
      if (!geometry) {
        const dims = this.calculateDimensions(this.instance)
        geometry = this.createGeometry(dims.width, dims.height, this._pivot)
      }
      this.mesh = this.playback.renderer.createMesh(geometry, material, this._castShadow, this._receiveShadow)
      this.ctx.world.stage.scene.add(this.mesh)
      this.sItem = { matrix: this.matrixWorld, geometry, material, getEntity: () => this.ctx.entity, node: this }
      this.ctx.world.stage.octree.insert(this.sItem)
    }
    if (!this.instance) return
    await this.instance.prepare
    if (this.n !== n) return
    this.loader.configureInstance(this.instance, this._loop)
    this.playback.audioController.setupAudio(this.instance)
    if (this._visible) {
      const material = this.mesh.material
      const result = this.updateGeometry(this.mesh.geometry, this.instance, this._width, this._height, this._pivot)
      material.color.set('white')
      material.uniforms.uVidAspect.value = result.vidAspect
      material.uniforms.uGeoAspect.value = result.geoAspect
      material.uniforms.uMap.value = this.instance.texture
      material.uniforms.uHasMap.value = 1
      material.uniforms.uFit.value = this._fit === 'cover' ? 1 : this._fit === 'contain' ? 2 : 0
      material.needsUpdate = true
      this._loading = false
      this._onLoad?.()
      if (this.shouldPlay) {
        this.instance.play()
        this.shouldPlay = false
      }
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      if (this.mesh) this.mesh.matrixWorld.copy(this.matrixWorld)
      if (this.sItem) this.ctx.world.stage.octree.move(this.sItem)
      if (this.pannerNode) this.playback.updatePannerPosition()
    }
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    this.n++
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
    }
    this.playback.cleanup()
    this.loader.cleanup()
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.copyProperties(source, propertySchema)
    this._geometry = source._geometry
    return this
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    this._geometry = getRef(value)
    this.markRebuild()
    this.setDirty()
  }

  get loading() { return this._loading }
  get duration() { return this.instance ? this.instance.duration : 0 }
  get playing() { return this.instance ? this.instance.isPlaying : false }
  get time() { return this.instance ? this.instance.currentTime : 0 }
  set time(value) { if (this.instance) this.instance.currentTime = value }
  get material() {
    if (!this._materialProxy) this._materialProxy = createVideoMaterialProxy(this)
    return this._materialProxy
  }
  set material(value) { throw new Error('[video] cannot set material') }
  get onLoad() { return this._onLoad }
  set onLoad(value) { this._onLoad = value }

  play(restartIfPlaying) {
    this.playback.play(restartIfPlaying)
  }

  pause() {
    this.playback.pause()
  }

  stop() {
    this.playback.stop()
  }

  get loading() { return this._loading }
  get duration() { return this.playback.getDuration() }
  get playing() { return this.playback.isPlaying() }
  get time() { return this.playback.getTime() }
  set time(value) { this.playback.setTime(value) }

  getProxy() {
    return createSchemaProxy(this, propertySchema,
      { play: this.play, pause: this.pause, stop: this.stop },
      {
        loading: function() { return this.loading },
        duration: function() { return this.duration },
        playing: function() { return this.playing },
        time: { get: function() { return this.time }, set: function(v) { this.time = v } },
        material: { get: function() { return this.material }, set: function(v) { this.material = v } },
        onLoad: { get: function() { return this.onLoad }, set: function(v) { this.onLoad = v } },
      }
    )
  }
}
