import { isTouch } from '../../../client/utils.js'

export class PointerLockManager {
  constructor(clientControls) {
    this.controls = clientControls
  }

  async lockPointer() {
    if (isTouch) return
    this.controls.pointer.shouldLock = true
    try {
      await this.controls.viewport.requestPointerLock()
      return true
    } catch (err) {
      console.log('pointerlock denied, too quick?')
      return false
    }
  }

  unlockPointer() {
    this.controls.pointer.shouldLock = false
    if (!this.controls.pointer.locked) return
    document.exitPointerLock()
    this.onPointerLockEnd()
  }

  onPointerLockChange = e => {
    const didPointerLock = !!document.pointerLockElement
    if (didPointerLock) {
      this.onPointerLockStart()
    } else {
      this.onPointerLockEnd()
    }
  }

  onPointerLockStart() {
    if (this.controls.pointer.locked) return
    this.controls.pointer.locked = true
    this.controls.events.emit('pointerLockChanged', true)
    if (!this.controls.pointer.shouldLock) this.unlockPointer()
  }

  onPointerLockEnd() {
    if (!this.controls.pointer.locked) return
    this.controls.pointer.locked = false
    this.controls.events.emit('pointerLockChanged', false)
  }
}
