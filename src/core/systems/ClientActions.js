import { System } from './System.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import * as THREE from '../extras/three.js'
import { isTouch } from '../../client/utils.js'
import { clamp } from '../utils.js'

const BATCH_SIZE = 500
const FORWARD = new THREE.Vector3(0, 0, 1)

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

const sizes = [128, 256, 512, 2048, 4096]

function createBoard(width, height, pxToMeters, world) {
  const max = Math.max(width, height)
  const size = sizes.find(size => size >= max)
  const pr = 1
  const canvas = document.createElement('canvas')
  canvas.width = size * pr
  canvas.height = size * pr
  const ctx = canvas.getContext('2d')
  let texture
  let mesh
  return {
    canvas,
    drawBox(x, y, width, height, radius, color) {
      x *= pr
      y *= pr
      width *= pr
      height *= pr
      radius *= pr
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.arcTo(x + width, y, x + width, y + height, radius)
      ctx.arcTo(x + width, y + height, x, y + height, radius)
      ctx.arcTo(x, y + height, x, y, radius)
      ctx.arcTo(x, y, x + width, y, radius)
      ctx.closePath()
      ctx.fill()
    },
    drawCircle(x, y, radius, color) {
      x *= pr
      y *= pr
      radius *= pr
      const centerX = x + radius
      const centerY = y + radius
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    },
    drawPie(x, y, radius, percent, color, offset = 0) {
      x *= pr
      y *= pr
      radius *= pr
      const offsetRadians = (offset * Math.PI) / 180
      const startAngle = -0.5 * Math.PI + offsetRadians
      const endAngle = startAngle + (percent / 100) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(x + radius, y + radius)
      ctx.arc(x + radius, y + radius, radius, startAngle, endAngle)
      ctx.lineTo(x + radius, y + radius)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    },
    measureText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
      fontSize *= pr
      ctx.font = `${fontWeight} ${fontSize}px ${font}`
      const metrics = ctx.measureText(text)
      return { width: metrics.width / pr }
    },
    drawText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
      x *= pr
      y *= pr
      fontSize *= pr
      ctx.fillStyle = color
      ctx.font = `${fontWeight} ${fontSize}px ${font}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(text, x, y)
    },
    getMesh() {
      if (mesh) return mesh
      const offsetX = 0
      const offsetY = 0
      texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = world.graphics.maxAnisotropy
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      const geometry = new THREE.BufferGeometry()
      const halfWidth = (width * pxToMeters) / 2
      const halfHeight = (height * pxToMeters) / 2
      const vertices = new Float32Array([
        halfWidth, -halfHeight, 0,
        halfWidth, halfHeight, 0,
        -halfWidth, halfHeight, 0,
        -halfWidth, -halfHeight, 0,
      ])
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      const uvX1 = offsetX / size
      const uvY1 = 1 - offsetY / size
      const uvX2 = (offsetX + width) / size
      const uvY2 = 1 - (offsetY + height) / size
      const uvs = new Float32Array([
        uvX2, uvY2,
        uvX2, uvY1,
        uvX1, uvY1,
        uvX1, uvY2,
      ])
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      const indices = new Uint16Array([
        0, 1, 2,
        2, 3, 0
      ])
      geometry.setIndex(new THREE.BufferAttribute(indices, 1))
      const material = new THREE.MeshBasicMaterial({ map: texture })
      material.toneMapped = false
      mesh = new THREE.Mesh(geometry, material)
      material.depthTest = false
      material.depthWrite = false
      material.transparent = true
      mesh.renderOrder = 999
      return mesh
    },
    commit() {
      if (!texture) return
      texture.needsUpdate = true
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}

export class ClientActions extends System {
  static DEPS = {
    rig: 'rig',
    events: 'events',
    controls: 'controls',
  }

  constructor(world) {
    super(world)
    this.nodes = []
    this.cursor = 0
    this.current = {
      node: null,
      distance: Infinity,
    }
    this.action = null
  }

  get rig() { return this.getService(ClientActions.DEPS.rig) }
  get events() { return this.getService(ClientActions.DEPS.events) }
  get controls() { return this.getService(ClientActions.DEPS.controls) }

  start() {
    const widthPx = 300
    const heightPx = 44
    const pxToMeters = 0.01
    const board = createBoard(widthPx, heightPx, pxToMeters, this.world)
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
    let actionNode = null
    let cancelled = false
    this.action = {
      start: (node) => {
        actionNode = node
        this.world.actions.btnDown = false
        node.progress = 0
        draw(node._label, node.progress / node._duration)
        this.world.stage.scene.add(mesh)
      },
      update: (delta) => {
        if (!actionNode) return
        let distance
        if (this.world.xr.session) {
          const pos = v1
          const qua = q1
          const sca = v2
          actionNode.matrixWorld.decompose(pos, qua, sca)
          const camPosition = v3.setFromMatrixPosition(this.world.xr.camera.matrixWorld)
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
          const camPosition = v3.setFromMatrixPosition(this.world.camera.matrixWorld)
          mesh.position.setFromMatrixPosition(actionNode.matrixWorld)
          distance = camPosition.distanceTo(mesh.position)
          mesh.quaternion.setFromRotationMatrix(this.world.camera.matrixWorld)
        }
        const worldToScreenFactor = this.world.graphics.worldToScreenFactor
        const [minDistance, maxDistance, baseScale = 1] = [3, 5, 1]
        const clampedDistance = clamp(distance, minDistance, maxDistance)
        let scaleFactor = baseScale * (worldToScreenFactor * clampedDistance) * 100
        if (this.world.xr.session) scaleFactor *= 0.2
        mesh.scale.setScalar(scaleFactor)
        if (this.world.actions.btnDown) {
          if (actionNode.progress === 0) {
            cancelled = false
            try {
              actionNode._onStart()
            } catch (err) {
              console.error('action.onStart:', err)
            }
          }
          actionNode.progress += delta
          if (actionNode.progress > actionNode._duration) actionNode.progress = actionNode._duration
          draw(actionNode._label, actionNode.progress / actionNode._duration)
          if (actionNode.progress === actionNode._duration) {
            actionNode.progress = 0
            try {
              actionNode._onTrigger({ playerId: this.world.entities.player.data.id })
            } catch (err) {
              console.error('action.onTrigger:', err)
            }
          }
        } else if (actionNode.progress > 0) {
          if (!cancelled) {
            try {
              actionNode._onCancel()
            } catch (err) {
              console.error('action.onCancel:', err)
            }
            cancelled = true
          }
          actionNode.progress -= delta
          if (actionNode.progress < 0) actionNode.progress = 0
          draw(actionNode._label, actionNode.progress / actionNode._duration)
        }
      },
      stop: () => {
        actionNode = null
        if (mesh.parent) {
          this.world.stage.scene.remove(mesh)
        }
      },
    }
    this.btnDown = false
    this.control = this.controls.bind({ priority: ControlPriorities.ACTION })
  }

  register(node) {
    this.nodes.push(node)
  }

  unregister(node) {
    const idx = this.nodes.indexOf(node)
    if (idx === -1) return
    this.nodes.splice(idx, 1)
    if (this.current.node === node) {
      this.current.node = null
      this.current.distance = Infinity
      this.action.stop()
    }
  }

  update(delta) {
    const cameraPos = this.rig.position

    this.btnDown =
      this.control.keyE.down ||
      this.control.touchB.down ||
      this.control.xrLeftTrigger.down ||
      this.control.xrRightTrigger.down

    if (this.current.node) {
      const distance = this.current.node.worldPos.distanceTo(cameraPos)
      if (distance > this.current.node._distance) {
        this.current.node = null
        this.current.distance = Infinity
        this.events.emit('actionChanged', false)
        this.action.stop()
      } else {
        this.current.distance = distance
      }
    }

    let didChange
    const size = Math.min(this.nodes.length, BATCH_SIZE)
    for (let i = 0; i < size; i++) {
      const idx = (this.cursor + i) % this.nodes.length
      const node = this.nodes[idx]
      if (node.finished) continue
      if (this.current.node === node) continue
      const distance = node.worldPos.distanceTo(cameraPos)
      if (distance <= node._distance && distance < this.current.distance) {
        this.current.node = node
        this.current.distance = distance
        didChange = true
      }
    }
    if (size) {
      this.cursor = (this.cursor + size) % this.nodes.length
    }
    if (didChange) {
      this.action.start(this.current.node)
      this.events.emit('actionChanged', true)
    }
    this.action.update(delta)
  }

  destroy() {
    this.control.release()
    this.control = null
    this.nodes = []
  }
}
