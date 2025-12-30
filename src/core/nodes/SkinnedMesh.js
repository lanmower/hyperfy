import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import { Node } from './Node.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import * as THREE from '../extras/three.js'
import { isBoolean } from 'lodash-es'
import { m } from '../utils/TempVectors.js'
import { schema } from '../utils/validation/createNodeSchema.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('SkinnedMesh')

const defaultStopOpts = { fade: 0.15 }

const propertySchema = schema('castShadow', 'receiveShadow')
  .overrideAll({
    castShadow: { default: true, onSet: function() { if (this.handle) { this.markRebuild(); this.setDirty() } } },
    receiveShadow: { default: true, onSet: function() { if (this.handle) { this.markRebuild(); this.setDirty() } } },
  })
  .build()

function createAnimationManager(ctx, obj, clips, animations) {
  let mixer = null
  let action = null
  const actions = {}

  return {
    get mixer() { return mixer },

    play({ name, fade = 0.15, speed, loop = true }) {
      if (!mixer) {
        mixer = new THREE.AnimationMixer(obj)
        ctx.world.setHot(ctx.node, true)
      }
      if (action?._clip.name === name) {
        return
      }
      if (action) {
        action.fadeOut(fade)
      }
      action = actions[name]
      if (!action) {
        const clip = clips[name]
        if (!clip) return logger.warn('Animation not found', { animation: name })
        action = mixer.clipAction(clip)
        actions[name] = action
      }
      if (speed !== undefined) action.timeScale = speed
      action.clampWhenFinished = !loop
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
      action.reset().fadeIn(fade).play()
    },

    stop(opts = defaultStopOpts) {
      if (!action) return
      action.fadeOut(opts.fade)
      action = null
    },

    update(delta) {
      mixer?.update(delta)
    },

    cleanup() {
      if (mixer) {
        mixer.stopAllAction()
        mixer.uncacheRoot(obj)
        mixer = null
        ctx.world.setHot(ctx.node, false)
        Object.keys(clips).forEach(k => delete clips[k])
        Object.keys(actions).forEach(k => delete actions[k])
      }
    }
  }
}

export class SkinnedMesh extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'skinnedmesh'

    this._object3d = data.object3d
    this._animations = data.animations

    defineProps(this, propertySchema, data)

    this.clips = {}
    this.bones = null
    this.animNames = []
    this.boneHandles = {}
    this.animManager = null
  }

  mount() {
    this.clips = {}
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
    this.animManager = createAnimationManager({ world: this.ctx.world, node: this }, this.obj, this.clips, this._animations)
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
      this.animManager?.cleanup()
      this.animManager = null
      this.ctx.world.stage.scene.remove(this.obj)
      this.obj = null
      this.bones = null
      this.animNames = []
    }
  }

  update(delta) {
    this.animManager?.update(delta)
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

  play(opts) {
    this.animManager?.play(opts)
  }

  stop(opts) {
    this.animManager?.stop(opts)
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
      logger.warn('Bone not found', { bone: name })
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
    return createSchemaProxy(this, propertySchema,
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
}
