
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { DEG2RAD } from '../../extras/general.js'
import * as THREE from '../../extras/three.js'

const SNAP_DEGREES = 5
const modeLabels = {
  grab: 'Grab',
  translate: 'Translate',
  rotate: 'Rotate',
  scale: 'Scale',
}

export class BuilderModeManager {
  constructor(world, builder, picker) {
    this.world = world
    this.builder = builder
    this.picker = picker
    this.camera = world.camera
    this.stage = world.stage
    this.mode = 'grab'
    this.localSpace = false
    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
  }

  getMode() {
    return this.mode
  }

  setMode(mode) {
    if (this.builder.selected) {
      if (this.mode === 'grab') {
        this.builder.control.keyC.capture = false
        this.builder.control.scrollDelta.capture = false
      }
      if (this.mode === 'translate' || this.mode === 'rotate' || this.mode === 'scale') {
        this.detachGizmo()
      }
    }

    this.mode = mode

    if (this.mode === 'grab') {
      if (this.builder.selected) {
        const app = this.builder.selected
        this.builder.control.keyC.capture = true
        this.builder.control.scrollDelta.capture = true
        this.builder.target.position.copy(app.root.position)
        this.builder.target.quaternion.copy(app.root.quaternion)
        this.builder.target.scale.copy(app.root.scale)
        this.builder.target.limit = 50 // PROJECT_MAX
      }
    }

    if (this.mode === 'translate' || this.mode === 'rotate' || this.mode === 'scale') {
      if (this.builder.selected) {
        this.attachGizmo(this.builder.selected, this.mode)
      }
    }

    this.builder.updateActions()
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

  attachGizmo(app, mode) {
    if (this.gizmo) this.detachGizmo()

    this.gizmo = new TransformControls(this.camera, this.builder.viewport)
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

    this.stage.scene.add(this.gizmoTarget)
    this.stage.scene.add(this.gizmoHelper)

    this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    this.gizmo.attach(this.gizmoTarget)
    this.gizmo.mode = mode
  }

  detachGizmo() {
    if (!this.gizmo) return

    this.stage.scene.remove(this.gizmoTarget)
    this.stage.scene.remove(this.gizmoHelper)
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

  isGizmoActive() {
    return this.gizmoActive
  }

  getModeLabel() {
    return modeLabels[this.mode]
  }

  destroy() {
    this.detachGizmo()
  }
}
