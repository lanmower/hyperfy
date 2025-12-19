import { ControlPriorities } from '../../extras/ControlPriorities.js'
import { EVENT } from '../../constants/EventNames.js'

export class BuilderControlSetup {
  constructor(builder) {
    this.builder = builder
  }

  setupControls() {
    this.builder.control = this.builder.controls.bind({ priority: ControlPriorities.BUILDER })
    this.builder.control.mouseLeft.onPress = () => {
      if (!this.builder.control.pointer.locked) {
        this.builder.control.pointer.lock()
        this.builder.justPointerLocked = true
        return true
      }
    }
    this.builder.updateActions()
  }

  checkLocalPlayer() {
    if (this.builder.enabled && !this.builder.canBuild()) {
      this.builder.select(null)
      this.builder.enabled = false
      this.builder.events.emit(EVENT.game.buildModeChanged, false)
    }
    this.builder.updateActions()
  }

  setupFileDropListeners(viewport, fileDropHandler) {
    viewport.addEventListener('dragover', fileDropHandler.onDragOver)
    viewport.addEventListener('dragenter', fileDropHandler.onDragEnter)
    viewport.addEventListener('dragleave', fileDropHandler.onDragLeave)
    viewport.addEventListener('drop', fileDropHandler.onDrop)
  }

  removeFileDropListeners(viewport, fileDropHandler) {
    viewport.removeEventListener('dragover', fileDropHandler.onDragOver)
    viewport.removeEventListener('dragenter', fileDropHandler.onDragEnter)
    viewport.removeEventListener('dragleave', fileDropHandler.onDragLeave)
    viewport.removeEventListener('drop', fileDropHandler.onDrop)
  }
}
