import * as THREE from '../extras/three.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('SkinnedMesh')
const defaultStopOpts = { fade: 0.15 }

export class AnimationManager {
  constructor(ctx, obj, clips, animations) {
    this.ctx = ctx
    this.obj = obj
    this.clips = clips
    this.animations = animations
    this.mixer = null
    this.action = null
    this.actions = {}
  }

  play({ name, fade = 0.15, speed, loop = true }) {
    if (!this.mixer) {
      this.mixer = new THREE.AnimationMixer(this.obj)
      this.ctx.world.setHot(this.ctx.node, true)
    }
    if (this.action?._clip.name === name) return
    if (this.action) this.action.fadeOut(fade)
    this.action = this.actions[name]
    if (!this.action) {
      const clip = this.clips[name]
      if (!clip) return logger.warn('Animation not found', { animation: name })
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

  update(delta) {
    this.mixer?.update(delta)
  }

  cleanup() {
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer.uncacheRoot(this.obj)
      this.mixer = null
      this.ctx.world.setHot(this.ctx.node, false)
      Object.keys(this.clips).forEach(k => delete this.clips[k])
      Object.keys(this.actions).forEach(k => delete this.actions[k])
    }
  }
}
