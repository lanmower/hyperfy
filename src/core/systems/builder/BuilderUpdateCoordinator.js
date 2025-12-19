export class BuilderUpdateCoordinator {
  constructor(builder) {
    this.builder = builder
  }

  handleFrameUpdate(delta, mode) {
    this.handleSelectionValidation()

    if (!this.builder.enabled) {
      return
    }

    this.handleInspect()
    this.handleUnlink()
    this.handlePin()
    this.builder.builderActions.handleSpaceToggle(mode)
    this.builder.builderActions.handleModeKeyPress()
    this.handleSelection(delta, mode)
    this.handleModeUpdates(delta, mode)
    this.handleSelectedUpdates(delta)
    this.handlePointerLockCleanup()
  }

  handleSelectionValidation() {
    if (this.builder.selected?.destroyed) {
      this.builder.select(null)
    }

    if (this.builder.selected && this.builder.selected?.data.mover !== this.builder.network.id) {
      this.builder.select(null)
    }
  }

  handleInspect() {
    this.builder.selectionManager.handleInspect()
  }

  handleUnlink() {
    this.builder.selectionManager.handleUnlink()
  }

  handlePin() {
    this.builder.selectionManager.handlePin()
  }

  handleSelection(delta, mode) {
    this.builder.selectionManager.handleSelection(delta, mode)

    if (
      this.builder.control.keyZ.pressed &&
      !this.builder.control.shiftLeft.down &&
      (this.builder.control.metaLeft.down || this.builder.control.controlLeft.down)
    ) {
      this.builder.undo()
    }
  }

  handleModeUpdates(delta, mode) {
    this.builder.transformHandler.handleModeUpdates(delta, mode)
  }

  handleSelectedUpdates(delta) {
    this.builder.transformHandler.sendSelectedUpdates(delta)
  }

  handlePointerLockCleanup() {
    if (this.builder.justPointerLocked) {
      this.builder.justPointerLocked = false
    }
  }
}
