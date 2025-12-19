import * as THREE from '../extras/three.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { System } from './System.js'
import { PointerEventManager } from './pointer/PointerEventManager.js'

export class ClientPointer extends System {
  static DEPS = {
    controls: 'controls',
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.pointerState = new PointerEventManager()
  }

  init({ ui }) {
    this.ui = ui
  }

  start() {
    this.control = this.controls.bind({
      priority: ControlPriorities.POINTER,
    })
  }

  update(delta) {
    const hit = this.control.pointer.locked ? this.stage.raycastReticle()[0] : this.screenHit
    this.pointerState.update(hit, this.control.mouseLeft.pressed, this.control.mouseLeft.released)
  }

  setScreenHit(screenHit) {
    this.screenHit = screenHit
    this.control.mouseLeft.capture = !!screenHit
  }

  destroy() {
    this.control?.release()
    this.control = null
  }
}
