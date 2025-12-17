import * as THREE from '../extras/three.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'

import { System } from './System.js'


export class ClientPointer extends System {
  static DEPS = {
    controls: 'controls',
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.pointerState = new PointerState()
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

const PointerEvents = {
  ENTER: 'pointerenter',
  LEAVE: 'pointerleave',
  DOWN: 'pointerdown',
  UP: 'pointerup',
}

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

class PointerState {
  constructor() {
    this.activePath = new Set()
    this.event = new PointerEvent()
    this.cursor = CURSOR_DEFAULT
    this.pressedNodes = new Set()
  }

  update(hit, pointerPressed, pointerReleased) {
    const newPath = hit ? this.getAncestorPath(hit) : []
    const oldPath = Array.from(this.activePath)

    let i = 0
    while (i < newPath.length && i < oldPath.length && newPath[i] === oldPath[i]) i++

    for (let j = oldPath.length - 1; j >= i; j--) {
      if (oldPath[j].onPointerLeave) {
        this.event.set(PointerEvents.LEAVE)
        try {
          oldPath[j].onPointerLeave?.(this.event)
        } catch (err) {
          console.error(err)
        }
      }
      this.activePath.delete(oldPath[j])
    }

    for (let j = i; j < newPath.length; j++) {
      if (newPath[j].onPointerEnter) {
        this.event.set(PointerEvents.ENTER)
        try {
          newPath[j].onPointerEnter?.(this.event)
        } catch (err) {
          console.error(err)
        }
        if (this.event._propagationStopped) break
      }
      this.activePath.add(newPath[j])
    }

    let cursor = CURSOR_DEFAULT
    if (newPath.length > 0) {
      for (let i = newPath.length - 1; i >= 0; i--) {
        if (newPath[i].cursor) {
          cursor = newPath[i].cursor
          break
        }
      }
    }
    if (cursor !== this.cursor) {
      document.body.style.cursor = cursor
      this.cursor = cursor
    }

    if (pointerPressed) {
      for (let i = newPath.length - 1; i >= 0; i--) {
        const node = newPath[i]
        if (node.onPointerDown) {
          this.event.set(PointerEvents.DOWN)
          try {
            node.onPointerDown(this.event)
          } catch (err) {
            console.error(err)
          }
          this.pressedNodes.add(node)
          if (this.event._propagationStopped) break
        }
      }
    }

    if (pointerReleased) {
      for (const node of this.pressedNodes) {
        if (node.onPointerUp) {
          this.event.set(PointerEvents.UP)
          try {
            node.onPointerUp(this.event)
          } catch (err) {
            console.error(err)
          }
          if (this.event._propagationStopped) break
        }
      }
      this.pressedNodes.clear()
    }
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
}
