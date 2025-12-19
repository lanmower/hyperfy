import * as THREE from '../../extras/three.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { DEG2RAD } from '../../extras/general.js'
import { BuilderConfig } from '../../config/SystemConfig.js'

export class GizmoController {
  constructor(parent) {
    this.parent = parent
    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
    this.localSpace = false
  }

  attach(app, mode) {
    if (this.gizmo) this.detach()

    this.gizmo = new TransformControls(this.parent.clientBuilder.world.camera, this.parent.clientBuilder.viewport)
    this.gizmo.setSize(0.7)
    this.gizmo.space = this.localSpace ? 'local' : 'world'

    this.gizmo._gizmo.helper.translate.scale.setScalar(0)
    this.gizmo._gizmo.helper.rotate.scale.setScalar(0)
    this.gizmo._gizmo.helper.scale.scale.setScalar(0)

    this.gizmo.addEventListener('mouseDown', () => {
      this.gizmoActive = true
    })
    this.gizmo.addEventListener('mouseUp', () => {
      this.gizmoActive = false
    })

    this.gizmoTarget = new THREE.Object3D()
    this.gizmoHelper = this.gizmo.getHelper()

    this.gizmoTarget.position.copy(app.root.position)
    this.gizmoTarget.quaternion.copy(app.root.quaternion)
    this.gizmoTarget.scale.copy(app.root.scale)

    this.parent.clientBuilder.world.stage.scene.add(this.gizmoTarget)
    this.parent.clientBuilder.world.stage.scene.add(this.gizmoHelper)

    this.gizmo.rotationSnap = BuilderConfig.SNAP_DEGREES * DEG2RAD
    this.gizmo.attach(this.gizmoTarget)
    this.gizmo.mode = mode
  }

  detach() {
    if (!this.gizmo) return

    this.parent.clientBuilder.world.stage.scene.remove(this.gizmoTarget)
    this.parent.clientBuilder.world.stage.scene.remove(this.gizmoHelper)
    this.gizmo.detach()
    this.gizmo.disconnect()
    this.gizmo.dispose()

    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
  }

  toggleSpace() {
    this.localSpace = !this.localSpace
    if (this.gizmo) {
      this.gizmo.space = this.localSpace ? 'local' : 'world'
    }
  }

  getSpaceLabel() {
    return this.localSpace ? 'World Space' : 'Local Space'
  }

  disableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = null
    }
  }

  enableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = BuilderConfig.SNAP_DEGREES * DEG2RAD
    }
  }

  isActive() {
    return this.gizmoActive
  }
}
