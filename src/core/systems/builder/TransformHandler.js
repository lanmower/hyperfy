import { BaseBuilderHandler } from './BaseBuilderHandler.js'
import { GizmoController } from './GizmoController.js'
import { GrabModeHandler } from './GrabModeHandler.js'
import { serializeTransform, copyTransform } from './BuilderTransformUtils.js'

export class TransformHandler extends BaseBuilderHandler {
  constructor(clientBuilder) {
    super(clientBuilder, 'TransformHandler')
    this.gizmoController = new GizmoController(this)
    this.grabModeHandler = new GrabModeHandler(this)
    this.lastMoveSendTime = 0
  }

  attachGizmo(app, mode) {
    this.gizmoController.attach(app, mode)
  }

  detachGizmo() {
    this.gizmoController.detach()
  }

  toggleSpace() {
    this.gizmoController.toggleSpace()
  }

  getSpaceLabel() {
    return this.gizmoController.getSpaceLabel()
  }

  disableRotationSnap() {
    this.gizmoController.disableRotationSnap()
  }

  enableRotationSnap() {
    this.gizmoController.enableRotationSnap()
  }

  isActive() {
    return this.gizmoController.isActive()
  }

  handleModeUpdates(delta, mode) {
    try {
      const app = this.parent.selected
      if (!app || !this.gizmoController.gizmo) return

      if (mode === 'translate') {
        this.applyGizmoTransform(app)
      } else if (mode === 'rotate') {
        this.handleRotateMode()
        this.applyGizmoTransform(app)
      } else if (mode === 'scale') {
        this.applyScaleTransform(app)
      } else if (mode === 'grab') {
        this.grabModeHandler.handle(delta)
      }
    } catch (err) {
      this.logger.error('Mode update failed', { mode })
    }
  }

  sendSelectedUpdates(delta) {
    try {
      const app = this.parent.selected
      if (!app) return

      this.lastMoveSendTime += delta
      if (this.lastMoveSendTime > this.parent.networkRate) {
        this.sendNetwork('entityModified', {
          id: app.data.id,
          ...serializeTransform(app.root),
        })
        this.lastMoveSendTime = 0
      }
    } catch (err) {
      this.logger.error('Send updates failed', { appId: this.parent.selected?.data.id })
    }
  }

  applyGizmoTransform(app) {
    if (!this.gizmoController.gizmoTarget) return
    copyTransform(this.gizmoController.gizmoTarget, app.root)
    if (app.threeScene && !app.blueprint?.scene) {
      copyTransform(app.root, app.threeScene)
    }
  }

  applyScaleTransform(app) {
    if (!this.gizmoController.gizmoTarget) return
    app.root.scale.copy(this.gizmoController.gizmoTarget.scale)
    if (app.threeScene && !app.blueprint?.scene) {
      app.threeScene.scale.copy(app.root.scale)
    }
  }

  handleRotateMode() {
    if (this.parent.control.controlLeft.pressed) {
      this.disableRotationSnap()
    }
    if (this.parent.control.controlLeft.released) {
      this.enableRotationSnap()
    }
  }
}
