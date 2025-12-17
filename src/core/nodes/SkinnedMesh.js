import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import { Node } from './Node.js'
import { defineProps, createPropertyProxy } from '../utils/defineProperty.js'
import * as THREE from '../extras/three.js'
import { isBoolean } from 'lodash-es'
import { m } from '../utils/TempVectors.js'
import { schema } from '../utils/createNodeSchema.js'

const defaultStopOpts = { fade: 0.15 }

const propertySchema = schema('castShadow', 'receiveShadow')
  .overrideAll({
    castShadow: { default: true, onSet: function() { if (this.handle) { this.needsRebuild = true; this.setDirty() } } },
    receiveShadow: { default: true, onSet: function() { if (this.handle) { this.needsRebuild = true; this.setDirty() } } },
  })
  .build()

export class SkinnedMesh extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'skinnedmesh'

    this._object3d = data.object3d
    this._animations = data.animations

    defineProps(this, propertySchema, data)

    this.clips = {}
    this.actions = {}
    this.bones = null
    this.animNames = []
    this.boneHandles = {}
  }

  mount() {
    this.clips = {}
    this.actions = {}
    this.bones = null
    this.animNames = []

    this.obj = SkeletonUtils.clone(this._object3d)
    this.obj.matrixWorld.copy(this.matrixWorld)
    this.obj.matrixAutoUpdate = false
    this.obj.matrixWorldAutoUpdate = false
    this.obj.traverse(n => {
      if (n.isMesh) {
        n.castShadow = this._castShadow
        n.receiveShadow = this._receiveShadow
      }
    })
    this.ctx.world.stage.scene.add(this.obj)
    for (const clip of this._animations) {
      this.clips[clip.name] = clip
      this.animNames.push(clip.name)
    }
    this.needsRebuild = false
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
    }
    if (didMove) {
      if (this.obj) {
        this.obj.matrixWorld.copy(this.matrixWorld)
      }
    }
  }

  unmount() {
    if (this.obj) {
      if (this.mixer) {
        this.mixer.stopAllAction()
        this.mixer.uncacheRoot(this.obj)
        this.mixer = null
        this.ctx.world.setHot(this, false)
        this.clips = {}
        this.actions = {}
      }
      this.ctx.world.stage.scene.remove(this.obj)
      this.obj = null
      this.bones = null
      this.animNames = []
    }
  }

  update(delta) {
    this.mixer?.update(delta)
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._object3d = source._object3d
    this._animations = source._animations
    this.copyProperties(source, propertySchema)
    return this
  }

  get anims() {
    return this.animNames.slice()
  }

  play({ name, fade = 0.15, speed, loop = true }) {
    if (!this.mixer) {
      this.mixer = new THREE.AnimationMixer(this.obj)
      this.ctx.world.setHot(this, true)
    }
    if (this.action?._clip.name === name) {
      return
    }
    if (this.action) {
      this.action.fadeOut(fade)
    }
    this.action = this.actions[name]
    if (!this.action) {
      const clip = this.clips[name]
      if (!clip) return console.warn(`[skinnedmesh] animation not found: ${name}`)
      this.action = this.mixer.clipAction(clip)
      this.actions[name] = this.action
    }
    if (speed !== undefined) this.action.timeScale = speed
    this.action.clampWhenFinished = !loop
    this.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
    this.action.reset().fadeIn(fade).play()
  }

  stop(opts = defaultStopOpts) {
    if (!this.action) return
    this.action.fadeOut(opts.fade)
    this.action = null
  }

  readBone(name) {
    if (!this.obj) return null
    if (!this.bones) {
      this.bones = {}
      this.obj.traverse(obj => {
        if (obj.isBone) {
          this.bones[obj.name] = obj
        }
      })
    }
    const bone = this.bones[name]
    if (!bone) {
      console.warn(`[skinnedmesh] bone not found: ${name}`)
      return null
    }
    return bone
  }

  getBone(name) {
    let handle = this.boneHandles[name]
    if (!handle) {
      const self = this
      handle = {
        get position() {
          return self.readBone(name)?.position
        },
        get quaternion() {
          return self.readBone(name)?.quaternion
        },
        get rotation() {
          return self.readBone(name)?.rotation
        },
        get scale() {
          return self.readBone(name)?.scale
        },
        get matrixWorld() {
          const bone = self.readBone(name)
          if (!bone) return null
          if (self.isDirty) self.clean()
          bone.updateMatrixWorld(true)
          return bone.matrixWorld
        },
        set matrixWorld(mat) {
          const bone = self.readBone(name)
          if (!bone) return
          bone.matrixAutoUpdate = false
          bone.matrixWorldAutoUpdate = false
          bone.matrixWorld.copy(mat)
        },
      }
      this.boneHandles[name] = handle
    }
    return handle
  }

  getBoneTransform(name) {
    const bone = this.readBone(name)
    if (!bone) return null
    bone.updateMatrixWorld(true)
    return m[0].copy(bone.matrixWorld)
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {
          play: this.play,
          stop: this.stop,
          getBone: this.getBone,
          getBoneTransform: this.getBoneTransform,
        },
        {
          anims: function() { return this.anims },
        }
      )
    }
    return this.proxy
  }
}
