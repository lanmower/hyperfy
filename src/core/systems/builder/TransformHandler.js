import * as THREE from '../../extras/three.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { DEG2RAD, RAD2DEG } from '../../extras/general.js'

const FORWARD = new THREE.Vector3(0, 0, -1)
const SNAP_DISTANCE = 1
const SNAP_DEGREES = 5
const PROJECT_SPEED = 10
const PROJECT_MIN = 3
const PROJECT_MAX = 50

const v1 = new THREE.Vector3()
const e1 = new THREE.Euler()

export class TransformHandler {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
    this.localSpace = false
    this.lastMoveSendTime = 0
  }

  attachGizmo(app, mode) {
    if (this.gizmo) this.detachGizmo()

    this.gizmo = new TransformControls(this.clientBuilder.world.camera, this.clientBuilder.viewport)
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

    this.clientBuilder.world.stage.scene.add(this.gizmoTarget)
    this.clientBuilder.world.stage.scene.add(this.gizmoHelper)

    this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    this.gizmo.attach(this.gizmoTarget)
    this.gizmo.mode = mode
  }

  detachGizmo() {
    if (!this.gizmo) return

    this.clientBuilder.world.stage.scene.remove(this.gizmoTarget)
    this.clientBuilder.world.stage.scene.remove(this.gizmoHelper)
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
      this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    }
  }

  isActive() {
    return this.gizmoActive
  }

  handleModeUpdates(delta, mode) {
    const app = this.clientBuilder.selected
    if (!app) return

    if (mode === 'translate' && this.isActive()) {
      app.root.position.copy(this.gizmoTarget.position)
      app.root.quaternion.copy(this.gizmoTarget.quaternion)
      app.root.scale.copy(this.gizmoTarget.scale)
    }

    if (mode === 'rotate') {
      if (this.clientBuilder.control.controlLeft.pressed) {
        this.disableRotationSnap()
      }
      if (this.clientBuilder.control.controlLeft.released) {
        this.enableRotationSnap()
      }
      if (this.isActive()) {
        app.root.position.copy(this.gizmoTarget.position)
        app.root.quaternion.copy(this.gizmoTarget.quaternion)
        app.root.scale.copy(this.gizmoTarget.scale)
      }
    }

    if (mode === 'scale' && this.isActive()) {
      app.root.scale.copy(this.gizmoTarget.scale)
    }

    if (mode === 'grab') {
      this.handleGrabMode(delta)
    }
  }

  handleGrabMode(delta) {
    const app = this.clientBuilder.selected
    const target = this.clientBuilder.target
    const hit = this.clientBuilder.getHitAtReticle(app, true)

    const camPos = this.clientBuilder.rig.position
    const camDir = v1.copy(FORWARD).applyQuaternion(this.clientBuilder.rig.quaternion)
    const hitDistance = hit ? hit.point.distanceTo(camPos) : 0

    if (hit && hitDistance < target.limit) {
      target.position.copy(hit.point)
    } else {
      target.position.copy(camPos).add(camDir.multiplyScalar(target.limit))
    }

    let project = this.clientBuilder.control.keyF.down ? 1 : this.clientBuilder.control.keyC.down ? -1 : null
    if (project) {
      const multiplier = this.clientBuilder.control.shiftLeft.down ? 4 : 1
      target.limit += project * PROJECT_SPEED * delta * multiplier
      if (target.limit < PROJECT_MIN) target.limit = PROJECT_MIN
      if (hitDistance && target.limit > hitDistance) target.limit = hitDistance
    }

    if (this.clientBuilder.control.shiftLeft.down) {
      const scaleFactor = 1 + this.clientBuilder.control.scrollDelta.value * 0.1 * delta
      target.scale.multiplyScalar(scaleFactor)
    }
    else {
      target.rotation.y += this.clientBuilder.control.scrollDelta.value * 0.1 * delta
    }

    app.root.position.copy(target.position)
    app.root.quaternion.copy(target.quaternion)
    app.root.scale.copy(target.scale)

    if (!this.clientBuilder.control.controlLeft.down) {
      const newY = target.rotation.y
      const degrees = newY / DEG2RAD
      const snappedDegrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES
      app.root.rotation.y = snappedDegrees * DEG2RAD
    }

    app.root.clean()

    if (!this.clientBuilder.control.controlLeft.down) {
      for (const pos of app.snaps) {
        const result = this.clientBuilder.snaps.octree.query(pos, SNAP_DISTANCE)[0]
        if (result) {
          const offset = v1.copy(result.position).sub(pos)
          app.root.position.add(offset)
          break
        }
      }
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
