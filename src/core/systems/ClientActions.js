import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { EVENT } from '../constants/EventNames.js'
import { isTouch } from '../../client/utils.js'
import { clamp, BatchProcessor } from '../utils.js'
import { CanvasDrawUtils } from './actions/CanvasDrawUtils.js'
import { RenderConfig } from '../config/SystemConfig.js'

const BATCH_SIZE = RenderConfig.ACTION_BATCH_SIZE
const sizes = [128, 256, 512, 2048, 4096]
const FORWARD = new THREE.Vector3(0, 0, 1)
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

export class ClientActions extends System {
  static DEPS = { rig: 'rig', events: 'events', controls: 'controls' }

  constructor(world) {
    super(world)
    this.nodes = []
    this.cursor = 0
    this.current = { node: null, distance: Infinity }
    this.actionNode = null
    this.cancelled = false
    this.btnDown = false
    const width = 300, height = 44, pxToMeters = 0.01
    const max = Math.max(width, height)
    const size = sizes.find(s => s >= max)
    this.pr = 1
    this.canvas = document.createElement('canvas')
    this.canvas.width = size * this.pr
    this.canvas.height = size * this.pr
    this.ctx = this.canvas.getContext('2d')
    this.width = width
    this.height = height
    this.pxToMeters = pxToMeters
    this.size = size
    this.texture = null
    this.mesh = null
  }

  start() {
    this.control = this.controls.bind({ priority: ControlPriorities.ACTION })
    this.mesh = this.getMesh()
  }

  register(node) { this.nodes.push(node) }

  unregister(node) {
    const idx = this.nodes.indexOf(node)
    if (idx === -1) return
    this.nodes.splice(idx, 1)
    if (this.current.node === node) {
      this.current.node = null
      this.current.distance = Infinity
      this.stop()
    }
  }

  update(delta) {
    const cameraPos = this.rig.position
    this.btnDown = this.control.keyE.down || this.control.touchB.down || this.control.xrLeftTrigger.down || this.control.xrRightTrigger.down

    if (this.current.node) {
      const distance = this.current.node.worldPos.distanceTo(cameraPos)
      if (distance > this.current.node._distance) {
        this.current.node = null
        this.current.distance = Infinity
        this.events.emit(EVENT.action.changed, false)
        this.stop()
      } else {
        this.current.distance = distance
      }
    }

    let didChange
    this.cursor = BatchProcessor.processBatchWithCursor(this.nodes, this.cursor, BATCH_SIZE, (node) => {
      if (node.finished) return
      if (this.current.node === node) return
      const distance = node.worldPos.distanceTo(cameraPos)
      if (distance <= node._distance && distance < this.current.distance) {
        this.current.node = node
        this.current.distance = distance
        didChange = true
      }
    })
    if (didChange) {
      this.startAction(this.current.node)
      this.events.emit(EVENT.action.changed, true)
    }
    this.updateAction(delta)
  }

  drawBox(x, y, width, height, radius, color) { CanvasDrawUtils.drawBox(this.ctx, this.pr, x, y, width, height, radius, color) }
  drawCircle(x, y, radius, color) { CanvasDrawUtils.drawCircle(this.ctx, this.pr, x, y, radius, color) }
  drawPie(x, y, radius, percent, color, offset = 0) { CanvasDrawUtils.drawPie(this.ctx, this.pr, x, y, radius, percent, color, offset) }
  measureText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') { return CanvasDrawUtils.measureText(this.ctx, this.pr, x, y, text, color, fontSize, fontWeight, font) }
  drawText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') { CanvasDrawUtils.drawText(this.ctx, this.pr, x, y, text, color, fontSize, fontWeight, font) }

  getMesh() {
    if (this.mesh) return this.mesh
    const offsetX = 0, offsetY = 0
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.anisotropy = this.world.graphics.maxAnisotropy
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    const geometry = new THREE.BufferGeometry()
    const halfWidth = (this.width * this.pxToMeters) / 2
    const halfHeight = (this.height * this.pxToMeters) / 2
    const vertices = new Float32Array([halfWidth, -halfHeight, 0, halfWidth, halfHeight, 0, -halfWidth, halfHeight, 0, -halfWidth, -halfHeight, 0])
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    const uvX1 = offsetX / this.size, uvY1 = 1 - offsetY / this.size, uvX2 = (offsetX + this.width) / this.size, uvY2 = 1 - (offsetY + this.height) / this.size
    const uvs = new Float32Array([uvX2, uvY2, uvX2, uvY1, uvX1, uvY1, uvX1, uvY2])
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    const indices = new Uint16Array([0, 1, 2, 2, 3, 0])
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    const material = new THREE.MeshBasicMaterial({ map: this.texture })
    material.toneMapped = false
    material.depthTest = false
    material.depthWrite = false
    material.transparent = true
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 999
    return this.mesh
  }

  draw(label, ratio) {
    const widthPx = this.width, heightPx = this.height
    const text = this.measureText(47, heightPx / 2, label, '#ffffff', 18, 400)
    const pillWidth = 6 + 4 + 24 + 4 + 6 + 9 + text.width + 13
    const left = (widthPx - pillWidth) / 2
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawBox(left, 0, pillWidth, heightPx, heightPx / 2, 'rgba(11, 10, 21, 0.97)')
    this.drawPie(left + 6, 6, 16, 100, '#5d6077')
    this.drawPie(left + 6, 6, 16, ratio * 100, '#ffffff')
    this.drawCircle(left + 10, 10, 12, '#000000')
    if (!isTouch) this.drawText(left + 16, 14, 'E', '#ffffff', 18, 400)
    this.drawText(left + 47, 14, label, '#ffffff', 18, 400)
    if (this.texture) this.texture.needsUpdate = true
  }

  startAction(node) {
    this.actionNode = node
    this.btnDown = false
    node.progress = 0
    this.draw(node._label, node.progress / node._duration)
    this.world.stage.scene.add(this.mesh)
  }

  updateAction(delta) {
    if (!this.actionNode) return
    let distance
    if (this.world.xr.session) {
      const pos = v1, qua = q1, sca = v2
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
    if (this.btnDown) {
      if (this.actionNode.progress === 0) {
        this.cancelled = false
        try { this.actionNode._onStart() } catch (err) { console.error('action.onStart:', err) }
      }
      this.actionNode.progress += delta
      if (this.actionNode.progress > this.actionNode._duration) this.actionNode.progress = this.actionNode._duration
      this.draw(this.actionNode._label, this.actionNode.progress / this.actionNode._duration)
      if (this.actionNode.progress === this.actionNode._duration) {
        this.actionNode.progress = 0
        try { this.actionNode._onTrigger({ playerId: this.world.entities.player.data.id }) } catch (err) { console.error('action.onTrigger:', err) }
      }
    } else if (this.actionNode.progress > 0) {
      if (!this.cancelled) {
        try { this.actionNode._onCancel() } catch (err) { console.error('action.onCancel:', err) }
        this.cancelled = true
      }
      this.actionNode.progress -= delta
      if (this.actionNode.progress < 0) this.actionNode.progress = 0
      this.draw(this.actionNode._label, this.actionNode.progress / this.actionNode._duration)
    }
  }

  stop() {
    this.actionNode = null
    if (this.mesh.parent) this.world.stage.scene.remove(this.mesh)
  }

  destroy() {
    this.control.release()
    this.control = null
    this.nodes = []
  }
}
