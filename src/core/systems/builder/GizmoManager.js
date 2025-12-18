import * as THREE from '../../extras/three.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { DEG2RAD } from '../../extras/general.js'

const SNAP_DEGREES = 5

export class GizmoManager {
  constructor(world, viewport) {
    this.world = world
    this.viewport = viewport
    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
  }

  attachGizmo(app, mode, localSpace) {
    if (this.gizmo) this.detachGizmo()

    this.gizmo = new TransformControls(this.world.camera, this.viewport)
    this.gizmo.setSize(0.7)
    this.gizmo.space = localSpace ? 'local' : 'world'

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

    this.world.stage.scene.add(this.gizmoTarget)
    this.world.stage.scene.add(this.gizmoHelper)

    this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    this.gizmo.attach(this.gizmoTarget)
    this.gizmo.mode = mode
  }

  detachGizmo() {
    if (!this.gizmo) return

    this.world.stage.scene.remove(this.gizmoTarget)
    this.world.stage.scene.remove(this.gizmoHelper)
    this.gizmo.detach()
    this.gizmo.disconnect()
    this.gizmo.dispose()

    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
  }

  disableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = null
    }
  }

  enableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    }
  }

  isActive() {
    return this.gizmoActive
  }

  setSpace(localSpace) {
    if (this.gizmo) {
      this.gizmo.space = localSpace ? 'local' : 'world'
    }
  }

  getTarget() {
    return this.gizmoTarget
  }

  hasGizmo() {
    return this.gizmo !== null
  }
}
