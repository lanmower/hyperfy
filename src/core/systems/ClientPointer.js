import * as THREE from '../extras/three.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientPointer')
const PointerEvents = { ENTER: 'pointerenter', LEAVE: 'pointerleave', DOWN: 'pointerdown', UP: 'pointerup' }
const CURSOR_DEFAULT = 'default'

class PointerEvent {
  constructor() {
    this.type = null
    this._propagationStopped = false
  }
  set(type) {
    this.type = type
    this._propagationStopped = false
  }
  stopPropagation() {
    this._propagationStopped = true
  }
}

export class ClientPointer extends System {
  static DEPS = { controls: 'controls', stage: 'stage' }

  constructor(world) {
    super(world)
    this.activePath = new Set()
    this.event = new PointerEvent()
    this.cursor = CURSOR_DEFAULT
    this.pressedNodes = new Set()
  }

  init({ ui }) { this.ui = ui }

  start() {
    this.control = this.controls.bind({ priority: ControlPriorities.POINTER })
  }

  update(delta) {
    const hit = this.control.pointer.locked ? this.stage.raycastReticle()[0] : this.screenHit
    const newPath = hit ? this.getAncestorPath(hit) : []
    const oldPath = Array.from(this.activePath)
    let i = 0
    while (i < newPath.length && i < oldPath.length && newPath[i] === oldPath[i]) i++
    for (let j = oldPath.length - 1; j >= i; j--) {
      if (oldPath[j].onPointerLeave) {
        this.event.set(PointerEvents.LEAVE)
        try { oldPath[j].onPointerLeave?.(this.event) } catch (err) { logger.error('Failed to handle pointer leave event', { node: oldPath[j].name, error: err.message }) }
      }
      this.activePath.delete(oldPath[j])
    }
    for (let j = i; j < newPath.length; j++) {
      if (newPath[j].onPointerEnter) {
        this.event.set(PointerEvents.ENTER)
        try { newPath[j].onPointerEnter?.(this.event) } catch (err) { logger.error('Failed to handle pointer enter event', { node: newPath[j].name, error: err.message }) }
        if (this.event._propagationStopped) break
      }
      this.activePath.add(newPath[j])
    }
    let cursor = CURSOR_DEFAULT
    if (newPath.length > 0) {
      for (let i = newPath.length - 1; i >= 0; i--) {
        if (newPath[i].cursor) { cursor = newPath[i].cursor; break }
      }
    }
    if (cursor !== this.cursor) {
      document.body.style.cursor = cursor
      this.cursor = cursor
    }
    if (this.control.mouseLeft.pressed) {
      for (let i = newPath.length - 1; i >= 0; i--) {
        const node = newPath[i]
        if (node.onPointerDown) {
          this.event.set(PointerEvents.DOWN)
          try { node.onPointerDown(this.event) } catch (err) { logger.error('Failed to handle pointer down event', { node: node.name, error: err.message }) }
          this.pressedNodes.add(node)
          if (this.event._propagationStopped) break
        }
      }
    }
    if (this.control.mouseLeft.released) {
      for (const node of this.pressedNodes) {
        if (node.onPointerUp) {
          this.event.set(PointerEvents.UP)
          try { node.onPointerUp(this.event) } catch (err) { logger.error('Failed to handle pointer up event', { node: node.name, error: err.message }) }
          if (this.event._propagationStopped) break
        }
      }
      this.pressedNodes.clear()
    }
  }

  setScreenHit(screenHit) {
    this.screenHit = screenHit
    this.control.mouseLeft.capture = !!screenHit
  }

  getAncestorPath(hit) {
    const path = []
    let node = hit.node?.resolveHit?.(hit) || hit.node
    while (node) {
      path.unshift(node)
      node = node.parent
    }
    return path
  }

  destroy() {
    this.control?.release()
    this.control = null
  }
}
