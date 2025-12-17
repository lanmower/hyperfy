import * as THREE from '../../extras/three.js'

export class UIRenderer {
  constructor(ui) {
    this.ui = ui
  }

  render(delta) {
    if (!this.ui.active) return

    const camera = this.ui.world.camera
    const scale = this.ui.getScale()

    this.ui.updateMatrix()
    this.ui.lookAt(camera.position)
    this.ui.scale.multiplyScalar(scale)
  }

  updateLayout() {
    if (!this.ui.container) return

    const yoga = this.ui.yoga
    if (yoga.isDirty()) {
      yoga.calculateLayout(this.ui.width, this.ui.height, yoga.DIRECTION_LTR)
    }
  }

  applyStyle(style) {
    if (style.backgroundColor) {
      this.ui.background.material.color.setStyle(style.backgroundColor)
    }
    if (style.opacity !== undefined) {
      this.ui.material.opacity = style.opacity
    }
  }
}
