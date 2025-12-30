import { GizmoController } from './GizmoController.js'
import { GrabModeHandler } from './GrabModeHandler.js'
import { serializeTransform, copyTransform } from './BuilderTransformUtils.js'

export class TransformHandler {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
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
    const app = this.clientBuilder.selected
    if (!app) return

    if (!this.gizmoController.gizmo) return

    if (mode === 'translate') {
      if (this.gizmoController.gizmoTarget) {
        copyTransform(this.gizmoController.gizmoTarget, app.root)
        if (app.threeScene && !app.blueprint?.scene) {
          copyTransform(app.root, app.threeScene)
        }
      }
    }

    if (mode === 'rotate') {
      if (this.clientBuilder.control.controlLeft.pressed) {
        this.disableRotationSnap()
      }
      if (this.clientBuilder.control.controlLeft.released) {
        this.enableRotationSnap()
      }
      if (this.gizmoController.gizmoTarget) {
        copyTransform(this.gizmoController.gizmoTarget, app.root)
        if (app.threeScene && !app.blueprint?.scene) {
          copyTransform(app.root, app.threeScene)
        }
      }
    }

    if (mode === 'scale') {
      if (this.gizmoController.gizmoTarget) {
        app.root.scale.copy(this.gizmoController.gizmoTarget.scale)
        if (app.threeScene && !app.blueprint?.scene) {
          app.threeScene.scale.copy(app.root.scale)
        }
      }
    }

    if (mode === 'grab') {
      this.grabModeHandler.handle(delta)
    }
  }

  sendSelectedUpdates(delta) {
    const app = this.clientBuilder.selected
    if (!app) return

    this.lastMoveSendTime += delta
    if (this.lastMoveSendTime > this.clientBuilder.networkRate) {
      this.clientBuilder.network.send('entityModified', {
        id: app.data.id,
        ...serializeTransform(app.root),
      })
      this.lastMoveSendTime = 0
    }
  }
}
