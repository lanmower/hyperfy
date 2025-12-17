import * as THREE from 'three'
import { isTouch } from '../../../client/utils.js'
import { clamp } from '../../utils.js'
import { createBoard } from './ActionDisplay.js'

const FORWARD = new THREE.Vector3(0, 0, 1)

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

export function createAction(world) {
  const widthPx = 300
  const heightPx = 44
  const pxToMeters = 0.01
  const board = createBoard(widthPx, heightPx, pxToMeters, world)

  const draw = (label, ratio) => {
    const text = board.measureText(47, heightPx / 2, label, '#ffffff', 18, 400)
    const pillWidth = 6 + 4 + 24 + 4 + 6 + 9 + text.width + 13
    const left = (widthPx - pillWidth) / 2
    board.clear()
    board.drawBox(left, 0, pillWidth, heightPx, heightPx / 2, 'rgba(11, 10, 21, 0.97)')
    board.drawPie(left + 6, 6, 16, 100, '#5d6077')
    board.drawPie(left + 6, 6, 16, ratio * 100, '#ffffff')
    board.drawCircle(left + 10, 10, 12, '#000000')
    if (!isTouch) board.drawText(left + 16, 14, 'E', '#ffffff', 18, 400)
    board.drawText(left + 47, 14, label, '#ffffff', 18, 400)
    board.commit()
  }

  const mesh = board.getMesh()

  let node = null
  let cancelled = false

  return {
    start(_node) {
      node = _node
      world.actions.btnDown = false
      node.progress = 0
      draw(node._label, node.progress / node._duration)
      world.stage.scene.add(mesh)
    },
    update(delta) {
      if (!node) return
      let distance
      if (world.xr.session) {
        const pos = v1
        const qua = q1
        const sca = v2
        node.matrixWorld.decompose(pos, qua, sca)
        const camPosition = v3.setFromMatrixPosition(world.xr.camera.matrixWorld)
        distance = camPosition.distanceTo(pos)
        v4.subVectors(camPosition, pos).normalize()
        qua.setFromUnitVectors(FORWARD, v4)
        e1.setFromQuaternion(qua)
        e1.z = 0
        qua.setFromEuler(e1)
        mesh.position.copy(pos)
        mesh.quaternion.copy(qua)
        mesh.scale.copy(sca)
      } else {
        const camPosition = v3.setFromMatrixPosition(world.camera.matrixWorld)
        mesh.position.setFromMatrixPosition(node.matrixWorld)
        distance = camPosition.distanceTo(mesh.position)
        mesh.quaternion.setFromRotationMatrix(world.camera.matrixWorld)
      }
      const worldToScreenFactor = world.graphics.worldToScreenFactor
      const [minDistance, maxDistance, baseScale = 1] = [3, 5, 1]
      const clampedDistance = clamp(distance, minDistance, maxDistance)
      let scaleFactor = baseScale * (worldToScreenFactor * clampedDistance) * 100
      if (world.xr.session) scaleFactor *= 0.2
      mesh.scale.setScalar(scaleFactor)
      if (world.actions.btnDown) {
        if (node.progress === 0) {
          cancelled = false
          try {
            node._onStart()
          } catch (err) {
            console.error('action.onStart:', err)
          }
        }
        node.progress += delta
        if (node.progress > node._duration) node.progress = node._duration
        draw(node._label, node.progress / node._duration)
        if (node.progress === node._duration) {
          node.progress = 0
          try {
            node._onTrigger({ playerId: world.entities.player.data.id })
          } catch (err) {
            console.error('action.onTrigger:', err)
          }
        }
      } else if (node.progress > 0) {
        if (!cancelled) {
          try {
            node._onCancel()
          } catch (err) {
            console.error('action.onCancel:', err)
          }
          cancelled = true
        }
        node.progress -= delta
        if (node.progress < 0) node.progress = 0
        draw(node._label, node.progress / node._duration)
      }
    },
    stop() {
      node = null
      if (mesh.parent) {
        world.stage.scene.remove(mesh)
      }
    },
  }
}
