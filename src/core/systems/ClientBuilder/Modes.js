// ClientBuilder modes (grab, translate, rotate, scale)

import * as THREE from '../../extras/three.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

const SNAP_DISTANCE = 1
const SNAP_DEGREES = 5
const PROJECT_SPEED = 10
const PROJECT_MIN = 3
const PROJECT_MAX = 50

const v1 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const e1 = new THREE.Euler()

export class BuilderModes {
  constructor(builder) {
    this.builder = builder
    this.controls = null
  }

  init() {
    const { world } = this.builder
    this.controls = new TransformControls(world.camera, world.graphics.renderer.domElement)
    this.controls.setSize(1.2)
    world.stage.scene.add(this.controls)
  }

  setMode(mode) {
    if (!this.controls) return
    if (mode === 'translate') {
      this.controls.setMode('translate')
    } else if (mode === 'rotate') {
      this.controls.setMode('rotate')
    } else if (mode === 'scale') {
      this.controls.setMode('scale')
    }
  }

  update(delta) {
    if (!this.controls || !this.builder.selected) return

    const selected = this.builder.selected
    this.controls.attach(selected)

    // Handle snapping for translate/rotate
    if (this.builder.mode === 'translate' && this.builder.snap) {
      this.snapTranslate(selected, SNAP_DISTANCE)
    } else if (this.builder.mode === 'rotate' && this.builder.snap) {
      this.snapRotate(selected, SNAP_DEGREES)
    }
  }

  snapTranslate(obj, distance) {
    obj.position.x = Math.round(obj.position.x / distance) * distance
    obj.position.y = Math.round(obj.position.y / distance) * distance
    obj.position.z = Math.round(obj.position.z / distance) * distance
  }

  snapRotate(obj, degrees) {
    const radians = degrees * Math.PI / 180
    obj.rotation.x = Math.round(obj.rotation.x / radians) * radians
    obj.rotation.y = Math.round(obj.rotation.y / radians) * radians
    obj.rotation.z = Math.round(obj.rotation.z / radians) * radians
  }

  destroy() {
    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }
  }
}
