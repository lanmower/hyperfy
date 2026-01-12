import { EntityCommandHandler } from './EntityCommandHandler.js'
import { BaseManager } from '../../patterns/index.js'

export class SelectionManager extends BaseManager {
  constructor(clientBuilder) {
    super(null, 'SelectionManager')
    this.clientBuilder = clientBuilder
    this.selected = null
    this.entityCommandHandler = new EntityCommandHandler(this)
  }

  select(entity) {
    if (this.selected === entity) return
    if (this.selected) {
      this.selected.outline = null
    }
    this.selected = entity
    if (entity) {
      entity.outline = 0xff9a00
      this.clientBuilder.updateActions()
      this.clientBuilder.composer.stateTransitionHandler.select(entity)
    } else {
      this.clientBuilder.composer.stateTransitionHandler.select(null)
    }
  }

  getSelected() {
    return this.selected
  }

  handleInspect() {
    if (this.clientBuilder.control.mouseRight.pressed && this.clientBuilder.control.pointer.locked) {
      const entity = this.clientBuilder.getEntityAtReticle()
      if (entity?.isApp) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.setApp(entity)
      }
      if (entity?.isPlayer) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.togglePane('players')
      }
    }
    else if (!this.selected && !this.clientBuilder.control.pointer.locked && this.clientBuilder.control.mouseRight.pressed) {
      const entity = this.clientBuilder.getEntityAtPointer()
      if (entity?.isApp) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.setApp(entity)
      }
      if (entity?.isPlayer) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.togglePane('players')
      }
    }
  }

  handleUnlink() {
    this.entityCommandHandler.handleUnlink()
  }

  handlePin() {
    this.entityCommandHandler.handlePin()
  }

  handleSelection(delta, mode) {
    if (!this.clientBuilder.justPointerLocked && this.clientBuilder.control.pointer.locked && this.clientBuilder.control.mouseLeft.pressed) {
      if (!this.selected) {
        const entity = this.clientBuilder.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
      }
      else if (this.selected && mode === 'grab') {
        this.clientBuilder.select(null)
      }
      else if (
        this.selected &&
        (mode === 'translate' || mode === 'rotate' || mode === 'scale') &&
        !this.clientBuilder.isGizmoActive()
      ) {
        const entity = this.clientBuilder.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
        else this.clientBuilder.select(null)
      }
    }

    if (this.selected && !this.clientBuilder.control.pointer.locked) {
      this.clientBuilder.select(null)
    }

    this.entityCommandHandler.handleDuplicate()
  }

  handleDelete() {
    this.entityCommandHandler.handleDelete()
  }

  async destroyInternal() {
    this.selected = null
    this.entityCommandHandler = null
  }
}
