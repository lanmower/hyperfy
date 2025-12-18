import * as THREE from '../three.js'
import { Modes } from '../../constants/AnimationModes.js'

export class LocomotionBlender {
  constructor(mixer, clips) {
    this.mixer = mixer
    this.clips = clips
    this.actions = new Map()
    this.activeActions = new Map()
    this.mode = Modes.IDLE
    this.axis = new THREE.Vector3()
    this.velocityDamping = 0.85
    this.transitionTime = 0.2
    this.initializeActions()
  }

  initializeActions() {
    for (const [mode, clip] of Object.entries(this.clips)) {
      const action = this.mixer.clipAction(clip)
      action.clampWhenFinished = true
      this.actions.set(mode, action)
    }
  }

  setMode(mode) {
    if (this.mode === mode) return

    const previousMode = this.mode
    this.mode = mode

    this.fadeOutMode(previousMode, this.transitionTime)
    this.fadeInMode(mode, this.transitionTime)
  }

  setAxis(x, y, z) {
    this.axis.set(x, y, z)
  }

  fadeInMode(mode, duration) {
    const action = this.actions.get(mode)
    if (action) {
      action.reset()
      action.fadeIn(duration)
      action.play()
      this.activeActions.set(mode, action)
    }
  }

  fadeOutMode(mode, duration) {
    const action = this.actions.get(mode)
    if (action) {
      action.fadeOut(duration)
      this.activeActions.delete(mode)
    }
  }

  update(delta) {
    this.mixer.update(delta)
    this.axis.multiplyScalar(this.velocityDamping)
  }

  dispose() {
    this.mixer.stopAllAction()
    this.actions.clear()
    this.activeActions.clear()
  }
}
