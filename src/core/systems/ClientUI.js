import { isBoolean } from '../utils/helpers/typeChecks.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { System } from './System.js'

const appPanes = ['app', 'script', 'nodes', 'meta']

export class ClientUI extends System {
  static DEPS = {
    controls: 'controls',
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.state = {
      visible: true,
      active: false,
      app: null,
      pane: null,
      reticleSuppressors: 0,
    }
    this.lastAppPane = 'app'
    this.control = null
    this.ui = null
  }

  init() {
    if (typeof document !== 'undefined') {
      this.ui = document.createElement('div')
      this.ui.style.position = 'fixed'
      this.ui.style.top = '0'
      this.ui.style.left = '0'
      this.ui.style.pointerEvents = 'none'
      this.ui.style.zIndex = '1000'
      document.body.appendChild(this.ui)
    }
  }

  start() {
    this.control = this.controls.bind({ priority: ControlPriorities.CORE_UI })
  }

  update() {
    if (this.control.escape.pressed) {
      if (this.state.pane) {
        this.state.pane = null
        this.broadcast()
      } else if (this.state.app) {
        this.state.app = null
        this.broadcast()
      }
    }
    if (
      this.control.keyZ.pressed &&
      !this.control.metaLeft.down &&
      !this.control.controlLeft.down &&
      !this.control.shiftLeft.down
    ) {
      this.state.visible = !this.state.visible
      this.broadcast()
    }
    if (this.control.pointer.locked && this.state.active) {
      this.state.active = false
      this.broadcast()
    }
    if (!this.control.pointer.locked && !this.state.active) {
      this.state.active = true
      this.broadcast()
    }
  }

  togglePane(pane) {
    if (pane === null || this.state.pane === pane) {
      this.state.pane = null
    } else {
      this.state.pane = pane
      if (appPanes.includes(pane)) {
        this.lastAppPane = pane
      }
    }
    this.broadcast()
  }

  toggleVisible(value) {
    value = isBoolean(value) ? value : !this.state.visible
    if (this.state.visible === value) return
    this.state.visible = value
    this.broadcast()
  }

  setApp(app) {
    this.state.app = app
    this.state.pane = app ? this.lastAppPane : null
    this.broadcast()
  }

  suppressReticle() {
    this.state.reticleSuppressors++
    let released
    this.broadcast()
    return () => {
      if (released) return
      this.state.reticleSuppressors--
      this.broadcast()
      released = true
    }
  }

  confirm(options) {
    const promise = new Promise(resolve => {
      options.confirm = () => {
        this.events.emit('confirm', null)
        resolve(true)
      }
      options.cancel = () => {
        this.events.emit('confirm', null)
        resolve(false)
      }
    })
    this.events.emit('confirm', options)
    return promise
  }

  broadcast() {
    this.events.emit('ui', { ...this.state })
  }

  destroy() {
    this.control?.release()
    this.control = null
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui)
    }
    this.ui = null
  }
}
