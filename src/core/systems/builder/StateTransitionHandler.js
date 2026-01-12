import { BaseBuilderHandler } from './BaseBuilderHandler.js'
import { serializeTransform, copyTransform } from './BuilderTransformUtils.js'

const PROJECT_MAX = 50

export class StateTransitionHandler extends BaseBuilderHandler {
  constructor(parent) {
    super(parent, 'StateTransitionHandler')
    this.selectingLock = false
  }

  toggle(enabled) {
    try {
      if (!this.parent.canBuild()) return
      const isBoolean = value => typeof value === 'boolean'
      enabled = isBoolean(enabled) ? enabled : !this.parent.enabled
      if (this.parent.enabled === enabled) return

      this.parent.enabled = enabled
      if (!this.parent.enabled) this.parent.select(null)
      this.parent.updateActions()

      const EVENT = this.parent.world.events
      if (EVENT?.game) {
        this.parent.events.emit(EVENT.game.buildModeChanged, enabled)
      }
    } catch (err) {
      this.logger.error('Build mode toggle failed', { enabled })
      throw err
    }
  }

  setMode(mode) {
    try {
      this.cleanupPreviousMode()
      this.parent.modeManager?.setMode(mode)
      this.setupNewMode(mode)
      this.parent.updateActions()
    } catch (err) {
      this.logger.error('Mode switch failed', { mode })
      throw err
    }
  }

  select(app) {
    if (this.selectingLock || this.parent.selected === app) return

    this.selectingLock = true
    try {
      this.deselectCurrent(app)
      if (app) {
        this.selectNew(app)
      }
      this.parent.updateActions()
    } catch (err) {
      this.logger.error('Selection failed', { appId: app?.data.id })
      throw err
    } finally {
      this.selectingLock = false
    }
  }

  cleanupPreviousMode() {
    if (!this.parent.selected) return
    const currentMode = this.parent.modeManager?.getMode()
    if (currentMode === 'grab') {
      this.parent.control.keyC.capture = false
      this.parent.control.scrollDelta.capture = false
    }
    if (currentMode === 'translate' || currentMode === 'rotate' || currentMode === 'scale') {
      this.parent.detachGizmo()
    }
  }

  setupNewMode(mode) {
    if (!this.parent.selected) return
    if (mode === 'grab') {
      this.parent.control.keyC.capture = true
      this.parent.control.scrollDelta.capture = true
      copyTransform(this.parent.selected.root, this.parent.target)
      this.parent.target.limit = PROJECT_MAX
    }
    if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
      this.parent.attachGizmo(this.parent.selected, mode)
    }
  }

  deselectCurrent(nextApp) {
    if (!this.parent.selected || this.parent.selected === nextApp) return

    const selected = this.parent.selected
    if (!selected.dead && selected.data.mover === this.parent.network.id) {
      const transform = serializeTransform(selected.root)
      selected.data.mover = null
      selected.data.position = transform.position
      selected.data.quaternion = transform.quaternion
      selected.data.scale = transform.scale
      selected.data.state = {}
      this.sendNetwork('entityModified', {
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

  selectNew(app) {
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
      this.sendNetwork('entityModified', { id: app.data.id, mover: app.data.mover })
    }

    this.parent.selected = app
    const mode = this.parent.modeManager?.getMode()
    if (mode === 'grab') {
      this.parent.control.keyC.capture = true
      this.parent.control.scrollDelta.capture = true
      copyTransform(app.root, this.parent.target)
      this.parent.target.limit = PROJECT_MAX
    }
    if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
      this.parent.attachGizmo(app, mode)
    }
  }
}
