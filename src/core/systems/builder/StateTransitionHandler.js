import { serializeTransform } from './BuilderTransformUtils.js'

const PROJECT_MAX = 50

export class StateTransitionHandler {
  constructor(parent) {
    this.parent = parent
    this.selectingLock = false
  }

  toggle(enabled) {
    const isBoolean = value => typeof value === 'boolean'
    if (!this.parent.canBuild()) return
    enabled = isBoolean(enabled) ? enabled : !this.parent.enabled
    if (this.parent.enabled === enabled) return
    this.parent.enabled = enabled
    if (!this.parent.enabled) this.parent.select(null)
    this.parent.updateActions()
    const EVENT = this.parent.world.events
    if (EVENT && EVENT.game) {
      this.parent.events.emit(EVENT.game.buildModeChanged, enabled)
    }
  }

  setMode(mode) {
    if (this.parent.selected) {
      const currentMode = this.parent.modeManager?.getMode()
      if (currentMode === 'grab') {
        this.parent.control.keyC.capture = false
        this.parent.control.scrollDelta.capture = false
      }
      if (currentMode === 'translate' || currentMode === 'rotate' || currentMode === 'scale') {
        this.parent.detachGizmo()
      }
    }

    this.parent.modeManager?.setMode(mode)

    if (mode === 'grab') {
      if (this.parent.selected) {
        this.parent.control.keyC.capture = true
        this.parent.control.scrollDelta.capture = true
        this.parent.target.position.copy(this.parent.selected.root.position)
        this.parent.target.quaternion.copy(this.parent.selected.root.quaternion)
        this.parent.target.scale.copy(this.parent.selected.root.scale)
        this.parent.target.limit = PROJECT_MAX
      }
    }

    if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
      if (this.parent.selected) {
        this.parent.attachGizmo(this.parent.selected, mode)
      }
    }

    this.parent.updateActions()
  }

  select(app) {
    if (this.selectingLock) return
    if (this.parent.selected === app) return

    this.selectingLock = true
    try {
      if (this.parent.selected && this.parent.selected !== app) {
        if (!this.parent.selected.dead && this.parent.selected.data.mover === this.parent.network.id) {
          const selected = this.parent.selected
          selected.data.mover = null
          const transform = serializeTransform(selected.root)
          selected.data.position = transform.position
          selected.data.quaternion = transform.quaternion
          selected.data.scale = transform.scale
          selected.data.state = {}
          this.parent.network.send('entityModified', {
            id: selected.data.id,
            mover: null,
            position: selected.data.position,
            quaternion: selected.data.quaternion,
            scale: selected.data.scale,
            state: selected.data.state,
          })
          selected.build()
        }
        this.parent.selected = null
        const mode = this.parent.modeManager?.getMode()
        if (mode === 'grab') {
          this.parent.control.keyC.capture = false
          this.parent.control.scrollDelta.capture = false
        }
        if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
          this.parent.detachGizmo()
        }
      }

      if (app) {
        this.parent.addUndo({
          name: 'move-entity',
          entityId: app.data.id,
          position: app.data.position.slice(),
          quaternion: app.data.quaternion.slice(),
          scale: app.data.scale.slice(),
        })
        if (app.data.mover !== this.parent.network.id) {
          app.data.mover = this.parent.network.id
          app.build()
          this.parent.network.send('entityModified', { id: app.data.id, mover: app.data.mover })
        }
        this.parent.selected = app
        const mode = this.parent.modeManager?.getMode()
        if (mode === 'grab') {
          this.parent.control.keyC.capture = true
          this.parent.control.scrollDelta.capture = true
          this.parent.target.position.copy(app.root.position)
          this.parent.target.quaternion.copy(app.root.quaternion)
          this.parent.target.scale.copy(app.root.scale)
          this.parent.target.limit = PROJECT_MAX
        }
        if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
          this.parent.attachGizmo(app, mode)
        }
      }

      this.parent.updateActions()
    } finally {
      this.selectingLock = false
    }
  }
}
