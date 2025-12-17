/**
 * Builder Mode Manager
 *
 * Manages builder interaction modes and gizmo attachment.
 * Responsibilities:
 * - Mode switching (grab, translate, rotate, scale)
 * - Gizmo attachment and detachment
 * - Local/world space toggling
 * - Mode-specific control setup
 */

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
    this.mode = 'grab'
    this.localSpace = false
    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode
  }

  /**
   * Set builder mode with gizmo attachment/detachment
   */
  setMode(mode) {
    // Cleanup previous mode
    if (this.builder.selected) {
      if (this.mode === 'grab') {
        this.builder.control.keyC.capture = false
        this.builder.control.scrollDelta.capture = false
      }
      if (this.mode === 'translate' || this.mode === 'rotate' || this.mode === 'scale') {
        this.detachGizmo()
      }
    }

    // Switch mode
    this.mode = mode

    // Setup new mode
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

  /**
   * Toggle local/world space for gizmo
   */
  toggleSpace() {
    this.localSpace = !this.localSpace
    if (this.gizmo) {
      this.gizmo.space = this.localSpace ? 'local' : 'world'
    }
  }

  /**
   * Get space label for UI
   */
  getSpaceLabel() {
    return this.localSpace ? 'World Space' : 'Local Space'
  }

  /**
   * Attach gizmo to entity for transformation
   */
  attachGizmo(app, mode) {
    if (this.gizmo) this.detachGizmo()

    // Create gizmo
    this.gizmo = new TransformControls(this.world.camera, this.builder.viewport)
    this.gizmo.setSize(0.7)
    this.gizmo.space = this.localSpace ? 'local' : 'world'

    // Hide helper icons
    this.gizmo._gizmo.helper.translate.scale.setScalar(0)
    this.gizmo._gizmo.helper.rotate.scale.setScalar(0)
    this.gizmo._gizmo.helper.scale.scale.setScalar(0)

    // Track gizmo interaction
    this.gizmo.addEventListener('mouseDown', () => {
      this.gizmoActive = true
    })
    this.gizmo.addEventListener('mouseUp', () => {
      this.gizmoActive = false
    })

    // Create target and helper
    this.gizmoTarget = new THREE.Object3D()
    this.gizmoHelper = this.gizmo.getHelper()

    // Initialize position/rotation/scale
    this.gizmoTarget.position.copy(app.root.position)
    this.gizmoTarget.quaternion.copy(app.root.quaternion)
    this.gizmoTarget.scale.copy(app.root.scale)

    // Add to scene
    this.world.stage.scene.add(this.gizmoTarget)
    this.world.stage.scene.add(this.gizmoHelper)

    // Setup rotation snapping
    this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    this.gizmo.attach(this.gizmoTarget)
    this.gizmo.mode = mode
  }

  /**
   * Detach gizmo from scene
   */
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

  /**
   * Disable rotation snapping (for no-snap mode)
   */
  disableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = null
    }
  }

  /**
   * Enable rotation snapping
   */
  enableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    }
  }

  /**
   * Check if gizmo is currently active (being dragged)
   */
  isGizmoActive() {
    return this.gizmoActive
  }

  /**
   * Get mode label for UI
   */
  getModeLabel() {
    return modeLabels[this.mode]
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.detachGizmo()
  }
}
