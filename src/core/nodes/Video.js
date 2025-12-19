import { isBoolean, isNumber, isString } from 'lodash-es'
import * as THREE from '../extras/three.js'

import { getRef, Node, secureRef } from './Node.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { schema } from '../utils/validation/createNodeSchema.js'
import { VideoRenderer } from './video/VideoRenderer.js'
import { VideoAudioController } from './video/VideoAudioController.js'
import { VideoInstanceManager } from './video/VideoInstanceManager.js'
import { VideoGeometryHandler } from './video/VideoGeometryHandler.js'
import { createVideoMaterialProxy } from './video/VideoMaterialProxy.js'
import { isDistanceModel, isGroup, isFit, isPivot, applyPivot } from './video/VideoHelpers.js'

const propertySchema = schema('screenId', 'src', 'linked', 'loop', 'visible', 'color', 'lit', 'doubleside', 'castShadow', 'receiveShadow', 'aspect', 'fit', 'width', 'height', 'pivot', 'volume', 'group', 'spatial', 'distanceModel', 'refDistance', 'maxDistance', 'rolloffFactor', 'coneInnerAngle', 'coneOuterAngle', 'coneOuterGain')
  .overrideAll({
    src: { onSet() { this._loading = true; this.needsRebuild = true; this.setDirty() } },
    linked: { onSet() { this.needsRebuild = true; this.setDirty() } },
    loop: { onSet(v) { if (this.instance) this.instance.loop = v } },
    visible: { onSet() { this.needsRebuild = true; this.setDirty() } },
    color: { onSet() { this.needsRebuild = true; this.setDirty() } },
    lit: { onSet() { this.needsRebuild = true; this.setDirty() } },
    doubleside: { onSet(v) { if (this.mesh) { this.mesh.material.side = v ? THREE.DoubleSide : THREE.FrontSide; this.mesh.material.needsUpdate = true } } },
    castShadow: { onSet(v) { if (this.mesh) this.mesh.castShadow = v } },
    receiveShadow: { onSet(v) { if (this.mesh) this.mesh.receiveShadow = v } },
    aspect: { onSet() { this.needsRebuild = true; this.setDirty() } },
    fit: { onSet() { this.needsRebuild = true; this.setDirty() } },
    width: { onSet() { this.needsRebuild = true; this.setDirty() } },
    height: { onSet() { this.needsRebuild = true; this.setDirty() } },
    pivot: { onSet() { this.needsRebuild = true; this.setDirty() } },
    volume: { onSet(v) { if (this.gain) this.gain.gain.value = v } },
    group: { onSet() { this.needsRebuild = true; this.setDirty() } },
    spatial: { onSet() { this.needsRebuild = true; this.setDirty() } },
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
    this.name = 'video'

    defineProps(this, propertySchema, data)
    this._geometry = getRef(data.geometry)

    this.n = 0
    this._loading = true
    this.renderer = new VideoRenderer(this)
    this.audioController = new VideoAudioController(this)
    this.instanceManager = new VideoInstanceManager(this)
    this.geometryHandler = new VideoGeometryHandler(this)
  }

  async mount() {
    this.needsRebuild = false
    if (this.ctx.world.network.isServer) return
    this._loading = true

    const n = ++this.n

    this.instance = await this.instanceManager.loadInstance(n)

    if (this._visible) {
      const material = this.renderer.createMaterial(this._lit, this._doubleside, this._color)

      let geometry = this._geometry
      if (!geometry) {
        const dims = this.geometryHandler.calculateDimensions(this.instance)
        geometry = this.geometryHandler.createGeometry(dims.width, dims.height, this._pivot)
      }

      this.mesh = this.renderer.createMesh(geometry, material, this._castShadow, this._receiveShadow)
      this.ctx.world.stage.scene.add(this.mesh)
      this.sItem = {
        matrix: this.matrixWorld,
        geometry,
        material,
        getEntity: () => this.ctx.entity,
        node: this,
      }
      this.ctx.world.stage.octree.insert(this.sItem)
    }

    if (!this.instance) return

    await this.instance.prepare
    if (this.n !== n) return

    this.instance.loop = this._loop
    this.audioController.setupAudio(this.instance)

    if (this._visible) {
      const material = this.mesh.material
      const result = this.geometryHandler.updateGeometry(this.mesh.geometry, this.instance, this._width, this._height, this._pivot)

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
      if (this.mesh) {
        this.mesh.matrixWorld.copy(this.matrixWorld)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
      if (this.pannerNode) {
        this.audioController.updatePannerPosition()
      }
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
    if (this.instance) {
      this.audioController.cleanup()
    }
    this.instanceManager.cleanup()
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
  }

  updatePannerPosition() {
    this.audioController.updatePannerPosition()
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
    this.needsRebuild = true
    this.setDirty()
  }

  get loading() {
    return this._loading
  }

  get duration() {
    return this.instance ? this.instance.duration : 0
  }

  get playing() {
    return this.instance ? this.instance.isPlaying : false
  }

  get time() {
    return this.instance ? this.instance.currentTime : 0
  }

  set time(value) {
    if (this.instance) {
      this.instance.currentTime = value
    }
  }

  get material() {
    if (!this._materialProxy) {
      this._materialProxy = createVideoMaterialProxy(this)
    }
    return this._materialProxy
  }

  set material(value) {
    throw new Error('[video] cannot set material')
  }

  get onLoad() {
    return this._onLoad
  }

  set onLoad(value) {
    this._onLoad = value
  }

  play(restartIfPlaying) {
    if (this.instance) {
      this.instance.play(restartIfPlaying)
    } else {
      this.shouldPlay = true
    }
  }

  pause() {
    this.instance?.pause()
  }

  stop() {
    this.instance?.stop()
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {
          play: this.play,
          pause: this.pause,
          stop: this.stop,
        },
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
    return this.proxy
  }
}
