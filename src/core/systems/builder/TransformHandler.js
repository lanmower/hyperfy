import { GizmoController } from './GizmoController.js'
import { GrabModeHandler } from './GrabModeHandler.js'

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

    if (mode === 'translate' && this.isActive()) {
      app.root.position.copy(this.gizmoController.gizmoTarget.position)
      app.root.quaternion.copy(this.gizmoController.gizmoTarget.quaternion)
      app.root.scale.copy(this.gizmoController.gizmoTarget.scale)
      app.syncThreeScene()
    }

    if (mode === 'rotate') {
      if (this.clientBuilder.control.controlLeft.pressed) {
        this.disableRotationSnap()
      }
      if (this.clientBuilder.control.controlLeft.released) {
        this.enableRotationSnap()
      }
      if (this.isActive()) {
        app.root.position.copy(this.gizmoController.gizmoTarget.position)
        app.root.quaternion.copy(this.gizmoController.gizmoTarget.quaternion)
        app.root.scale.copy(this.gizmoController.gizmoTarget.scale)
        app.syncThreeScene()
      }
    }

    if (mode === 'scale' && this.isActive()) {
      app.root.scale.copy(this.gizmoController.gizmoTarget.scale)
      app.syncThreeScene()
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
        position: app.root.position.toArray(),
        quaternion: app.root.quaternion.toArray(),
        scale: app.root.scale.toArray(),
      })
      this.lastMoveSendTime = 0
    }
  }
}
