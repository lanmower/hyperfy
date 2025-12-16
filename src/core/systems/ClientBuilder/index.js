// ClientBuilder orchestrator

import { System } from '../System.js'
import { BuilderModes } from './Modes.js'
import { BuilderFileHandler } from './FileHandler.js'
import { BuilderUndoManager } from './UndoManager.js'
import { ControlPriorities } from '../../extras/ControlPriorities.js'

const modeLabels = {
  grab: 'Grab',
  translate: 'Translate',
  rotate: 'Rotate',
  scale: 'Scale',
}

export class ClientBuilder extends System {
  constructor(world) {
    super(world)
    this.enabled = false
    this.selected = null
    this.mode = 'grab'
    this.snap = false
    this.localSpace = false

    // Initialize sub-systems
    this.modes = new BuilderModes(this)
    this.fileHandler = new BuilderFileHandler(this)
    this.undoManager = new BuilderUndoManager(this)
  }

  async init() {
    this.modes.init()
    this.fileHandler.init()

    this.world.events.on('keydown', (e) => this.onKeyDown(e))
  }

  start() {
    // Listen for builder mode toggle
    this.world.events.on('builderMode', (enabled) => {
      this.setBuilderMode(enabled)
    })
  }

  setBuilderMode(enabled) {
    this.enabled = enabled
    if (enabled) {
      this.world.events.emit('builderModeChanged', true)
    }
  }

  setMode(mode) {
    if (!['grab', 'translate', 'rotate', 'scale'].includes(mode)) return
    this.mode = mode
    this.modes.setMode(mode)
    this.world.events.emit('modeChanged', mode)
  }

  selectEntity(entity) {
    this.selected = entity
    this.world.events.emit('selectionChanged', entity)
  }

  toggleSnap() {
    this.snap = !this.snap
    this.world.events.emit('snapChanged', this.snap)
  }

  toggleLocalSpace() {
    this.localSpace = !this.localSpace
  }

  preUpdate(delta) {
    if (!this.enabled) return
    this.modes.update(delta)
  }

  onKeyDown(e) {
    if (!this.enabled) return

    switch (e.code) {
      case 'KeyG':
        this.setMode('grab')
        break
      case 'KeyT':
        this.setMode('translate')
        break
      case 'KeyR':
        this.setMode('rotate')
        break
      case 'KeyS':
        this.setMode('scale')
        break
      case 'KeyZ':
        if (e.ctrlKey || e.metaKey) {
          e.shiftKey ? this.undoManager.redo() : this.undoManager.undo()
        }
        break
      case 'KeyX':
        this.toggleSnap()
        break
      case 'KeyL':
        this.toggleLocalSpace()
        break
      case 'Delete':
        if (this.selected) {
          this.selected.remove()
          this.selected = null
        }
        break
    }
  }

  destroy() {
    this.modes.destroy()
    this.fileHandler.destroy()
    this.undoManager.clear()
  }
}

export { ClientBuilder as default }
