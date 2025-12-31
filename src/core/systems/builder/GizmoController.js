import * as THREE from '../../extras/three.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { DEG2RAD } from '../../extras/general.js'
import { copyTransform } from './BuilderTransformUtils.js'

export class GizmoController {
  constructor(parent) {
    this.parent = parent
    this.gizmo = null
    this.gizmoTarget = null
  }

  attach(app, mode) {
    const world = this.parent.clientBuilder.world
    const viewport = this.parent.clientBuilder.viewport
    if (!world || !viewport) return

    this.detach()

    this.gizmo = new TransformControls(world.camera, viewport)
    this.gizmo.setSize(0.7)
    this.gizmoTarget = new THREE.Object3D()
    copyTransform(app.root, this.gizmoTarget)
    this.setMode(mode)
  }

  detach() {
    if (this.gizmo) {
      this.gizmo.dispose()
      this.gizmo = null
    }
    this.gizmoTarget = null
  }

  setMode(mode) {
    if (!this.gizmo) return
    this.gizmo.setMode(mode)
  }

  toggleSpace() {
    if (!this.gizmo) return
    this.gizmo.setSpace(this.gizmo.space === 'world' ? 'local' : 'world')
  }

  getSpaceLabel() {
    return this.gizmo?.space === 'local' ? 'Local' : 'World'
  }

  disableRotationSnap() {
    if (!this.gizmo) return
    this.gizmo.setRotationSnap(null)
  }

  enableRotationSnap() {
    if (!this.gizmo) return
    this.gizmo.setRotationSnap(45 * DEG2RAD)
  }

  isActive() {
    return !!this.gizmo
  }
}
