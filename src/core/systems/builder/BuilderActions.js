import { ACTION_CONFIGS, MODE_LABELS } from './ActionConfigs.js'

export class BuilderActions {
  constructor(builder) {
    this.builder = builder
  }

  updateActions() {
    const mode = this.builder.composer.modeManager.getMode()
    let actions = []

    if (!this.builder.enabled) {
      actions = ACTION_CONFIGS.disabled
    } else if (!this.builder.selected) {
      actions = [...ACTION_CONFIGS.noSelection]
      actions[0].label = this.builder.composer.modeManager.getModeLabel()
    } else if (mode === 'grab') {
      actions = ACTION_CONFIGS.grab
    } else if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
      actions = ACTION_CONFIGS.transform
      const spaceAction = actions.find(a => a.type === 'keyT')
      if (spaceAction) spaceAction.label = this.builder.transformHandler.getSpaceLabel()
    }

    this.builder.control.setActions(actions)
  }

  handleModeKeyPress() {
    if (this.builder.control.digit1.pressed) this.builder.setMode('grab')
    if (this.builder.control.digit2.pressed) this.builder.setMode('translate')
    if (this.builder.control.digit3.pressed) this.builder.setMode('rotate')
    if (this.builder.control.digit4.pressed) this.builder.setMode('scale')
  }

  handleSpaceToggle(mode) {
    if (this.builder.control.keyT.pressed && (mode === 'translate' || mode === 'rotate' || mode === 'scale')) {
      this.builder.transformHandler.toggleSpace()
      this.updateActions()
    }
  }
}
