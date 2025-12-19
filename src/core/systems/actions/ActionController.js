import * as THREE from '../../extras/three.js'
import { isTouch } from '../../../client/utils.js'
import { clamp } from '../../utils.js'

const FORWARD = new THREE.Vector3(0, 0, 1)

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

export class ActionController {
  constructor(world, board) {
    this.world = world
    this.board = board
    this.actionNode = null
    this.cancelled = false
    this.mesh = board.getMesh()
  }

  draw(label, ratio) {
    const widthPx = this.board.width
    const heightPx = this.board.height
    const text = this.board.measureText(47, heightPx / 2, label, '#ffffff', 18, 400)
    const pillWidth = 6 + 4 + 24 + 4 + 6 + 9 + text.width + 13
    const left = (widthPx - pillWidth) / 2
    this.board.clear()
    this.board.drawBox(left, 0, pillWidth, heightPx, heightPx / 2, 'rgba(11, 10, 21, 0.97)')
    this.board.drawPie(left + 6, 6, 16, 100, '#5d6077')
    this.board.drawPie(left + 6, 6, 16, ratio * 100, '#ffffff')
    this.board.drawCircle(left + 10, 10, 12, '#000000')
    if (!isTouch) this.board.drawText(left + 16, 14, 'E', '#ffffff', 18, 400)
    this.board.drawText(left + 47, 14, label, '#ffffff', 18, 400)
    this.board.commit()
  }

  start(node) {
    this.actionNode = node
    this.world.actions.btnDown = false
    node.progress = 0
    this.draw(node._label, node.progress / node._duration)
    this.world.stage.scene.add(this.mesh)
  }

  update(delta) {
    if (!this.actionNode) return

    let distance
    if (this.world.xr.session) {
      const pos = v1
      const qua = q1
      const sca = v2
      this.actionNode.matrixWorld.decompose(pos, qua, sca)
      const camPosition = v3.setFromMatrixPosition(this.world.xr.camera.matrixWorld)
      distance = camPosition.distanceTo(pos)
      v4.subVectors(camPosition, pos).normalize()
      qua.setFromUnitVectors(FORWARD, v4)
      e1.setFromQuaternion(qua)
      e1.z = 0
      qua.setFromEuler(e1)
      this.mesh.position.copy(pos)
      this.mesh.quaternion.copy(qua)
      this.mesh.scale.copy(sca)
    } else {
      const camPosition = v3.setFromMatrixPosition(this.world.camera.matrixWorld)
      this.mesh.position.setFromMatrixPosition(this.actionNode.matrixWorld)
      distance = camPosition.distanceTo(this.mesh.position)
      this.mesh.quaternion.setFromRotationMatrix(this.world.camera.matrixWorld)
    }

    const worldToScreenFactor = this.world.graphics.worldToScreenFactor
    const [minDistance, maxDistance, baseScale = 1] = [3, 5, 1]
    const clampedDistance = clamp(distance, minDistance, maxDistance)
    let scaleFactor = baseScale * (worldToScreenFactor * clampedDistance) * 100
    if (this.world.xr.session) scaleFactor *= 0.2
    this.mesh.scale.setScalar(scaleFactor)

    if (this.world.actions.btnDown) {
      if (this.actionNode.progress === 0) {
        this.cancelled = false
        try {
          this.actionNode._onStart()
        } catch (err) {
          console.error('action.onStart:', err)
        }
      }
      this.actionNode.progress += delta
      if (this.actionNode.progress > this.actionNode._duration) this.actionNode.progress = this.actionNode._duration
      this.draw(this.actionNode._label, this.actionNode.progress / this.actionNode._duration)
      if (this.actionNode.progress === this.actionNode._duration) {
        this.actionNode.progress = 0
        try {
          this.actionNode._onTrigger({ playerId: this.world.entities.player.data.id })
        } catch (err) {
          console.error('action.onTrigger:', err)
        }
      }
    } else if (this.actionNode.progress > 0) {
      if (!this.cancelled) {
        try {
          this.actionNode._onCancel()
        } catch (err) {
          console.error('action.onCancel:', err)
        }
        this.cancelled = true
      }
      this.actionNode.progress -= delta
      if (this.actionNode.progress < 0) this.actionNode.progress = 0
      this.draw(this.actionNode._label, this.actionNode.progress / this.actionNode._duration)
    }
  }

  stop() {
    this.actionNode = null
    if (this.mesh.parent) {
      this.world.stage.scene.remove(this.mesh)
    }
  }
}
