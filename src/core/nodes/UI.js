import * as THREE from '../extras/three.js'
import { every, isArray, isBoolean, isNumber, isString } from 'lodash-es'
import Yoga from 'yoga-layout'

import { Node } from './Node.js'
import { fillRoundRect } from '../extras/roundRect.js'
import {
  AlignContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
  isAlignContent,
  isAlignItem,
  isFlexDirection,
  isFlexWrap,
  isJustifyContent,
  JustifyContent,
} from '../extras/yoga.js'
import CustomShaderMaterial from '../libs/three-custom-shader-material/index.js'
import { borderRoundRect } from '../extras/borderRoundRect.js'
import { clamp } from '../utils.js'
import { defineProps, createPropertyProxy } from '../utils/defineProperty.js'
import { schema } from '../utils/createNodeSchema.js'
import { v, q, m, e } from '../utils/TempVectors.js'
import { pivots } from '../utils/NodeConstants.js'

const FORWARD = new THREE.Vector3(0, 0, 1)

const iQuaternion = new THREE.Quaternion(0, 0, 0, 1)
const iScale = new THREE.Vector3(1, 1, 1)

const isBrowser = typeof window !== 'undefined'

const spaces = ['world', 'screen']
const billboards = ['none', 'full', 'y']

const defaults = {
  space: 'world',
  width: 100,
  height: 100,
  size: 0.01,
  res: 2,

  lit: false,
  doubleside: true,
  billboard: 'none',
  pivot: 'center',
  offset: [0, 0, 0],
  scaler: null,
  pointerEvents: true,

  transparent: true,
  backgroundColor: null,
  borderWidth: 0,
  borderColor: null,
  borderRadius: 0,
  padding: 0,
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'flex-start',
  flexWrap: 'no-wrap',
  gap: 0,
}

const rebuild = function() { this.rebuild() }
const redraw = function() { this.redraw() }
const propertySchema = schema('space', 'width', 'height', 'size', 'res', 'lit', 'doubleside', 'billboard', 'pivot', 'scaler', 'pointerEvents', 'transparent', 'backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'padding', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent', 'flexWrap', 'gap')
  .overrideAll({
    space: { default: defaults.space, onSet: rebuild },
    width: { default: defaults.width, onSet: function() { this.yogaNode?.setWidth(this._width * this._res); this.rebuild() } },
    height: { default: defaults.height, onSet: function() { this.yogaNode?.setHeight(this._height * this._res); this.rebuild() } },
    size: { default: defaults.size, onSet: rebuild },
    res: { default: defaults.res, onSet: rebuild },
    lit: { default: defaults.lit, onSet: rebuild },
    doubleside: { default: defaults.doubleside, onSet: rebuild },
    billboard: { default: defaults.billboard, onSet: rebuild },
    pivot: { default: defaults.pivot, onSet: rebuild },
    scaler: { default: defaults.scaler, onSet: rebuild },
    pointerEvents: { default: defaults.pointerEvents, onSet: redraw },
    transparent: { default: defaults.transparent, onSet: redraw },
    backgroundColor: { default: defaults.backgroundColor, onSet: redraw },
    borderWidth: { default: defaults.borderWidth, onSet: redraw },
    borderColor: { default: defaults.borderColor, onSet: redraw },
    borderRadius: { default: defaults.borderRadius, onSet: redraw },
    padding: { default: defaults.padding, onSet: function() { if (isArray(this._padding)) { const [t,r,b,l]=this._padding; this.yogaNode?.setPadding(Yoga.EDGE_TOP,t*this._res); this.yogaNode?.setPadding(Yoga.EDGE_RIGHT,r*this._res); this.yogaNode?.setPadding(Yoga.EDGE_BOTTOM,b*this._res); this.yogaNode?.setPadding(Yoga.EDGE_LEFT,l*this._res) } else { this.yogaNode?.setPadding(Yoga.EDGE_ALL,this._padding*this._res) } this.redraw() } },
    flexDirection: { default: defaults.flexDirection, onSet: function() { this.yogaNode?.setFlexDirection(FlexDirection[this._flexDirection]); this.redraw() } },
    justifyContent: { default: defaults.justifyContent, onSet: function() { this.yogaNode?.setJustifyContent(JustifyContent[this._justifyContent]); this.redraw() } },
    alignItems: { default: defaults.alignItems, onSet: function() { this.yogaNode?.setAlignItems(AlignItems[this._alignItems]); this.redraw() } },
    alignContent: { default: defaults.alignContent, onSet: function() { this.yogaNode?.setAlignContent(AlignContent[this._alignContent]); this.redraw() } },
    flexWrap: { default: defaults.flexWrap, onSet: function() { this.yogaNode?.setFlexWrap(FlexWrap[this._flexWrap]); this.redraw() } },
    gap: { default: defaults.gap, onSet: function() { this.yogaNode?.setGap(Yoga.GUTTER_ALL, this._gap * this._res); this.redraw() } },
  })
  .build()

export class UI extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'ui'

    defineProps(this, propertySchema, data)
    this._offset = new THREE.Vector3().fromArray(data.offset || defaults.offset)

    this.ui = this

    this._offset._onChange = () => this.rebuild()
  }

  build() {
    if (!isBrowser) return
    this.unbuild()
    this.canvas = document.createElement('canvas')
    this.canvas.width = this._width * this._res
    this.canvas.height = this._height * this._res
    this.canvasCtx = this.canvas.getContext('2d')
    if (this._space === 'world') {
      this.texture = new THREE.CanvasTexture(this.canvas)
      this.texture.colorSpace = THREE.SRGBColorSpace
      this.texture.anisotropy = this.ctx.world.graphics.maxAnisotropy
      this.geometry = new THREE.PlaneGeometry(this._width, this._height)
      this.geometry.scale(this._size, this._size, this._size)
      pivotGeometry(this._pivot, this.geometry, this._width * this._size, this._height * this._size)
      this.pivotOffset = getPivotOffset(this._pivot, this._width, this._height)
      this.material = this.createMaterial(this._lit, this.texture, this._transparent, this._doubleside)
      this.mesh = new THREE.Mesh(this.geometry, this.material)
      this.mesh.matrixAutoUpdate = false
      this.mesh.matrixWorldAutoUpdate = false
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.ctx.world.stage.scene.add(this.mesh)
      if (this._pointerEvents) {
        this.sItem = {
          matrix: this.mesh.matrixWorld,
          geometry: this.geometry,
          material: this.material,
          getEntity: () => this.ctx.entity,
          node: this,
        }
        this.ctx.world.stage.octree.insert(this.sItem)
      }
      this.ctx.world.setHot(this, true)
    } else {
      this.canvas.style.position = 'absolute'
      this.canvas.style.width = this._width + 'px'
      this.canvas.style.height = this._height + 'px'
      pivotCanvas(this._pivot, this.canvas, this._width, this._height)
      this.canvas.style.left = `calc(${this.position.x * 100}% + ${this._offset.x}px)`
      this.canvas.style.top = `calc(${this.position.y * 100}% + ${this._offset.y}px)`
      this.canvas.style.pointerEvents = this._pointerEvents ? 'auto' : 'none'
      if (this._pointerEvents) {
        let hit
        const canvas = this.canvas
        const world = this.ctx.world
        const onPointerEnter = e => {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * this._res
          const y = (e.clientY - rect.top) * this._res
          hit = {
            node: this,
            coords: new THREE.Vector3(x, y, 0),
          }
          world.pointer.setScreenHit(hit)
        }
        const onPointerMove = e => {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * this._res
          const y = (e.clientY - rect.top) * this._res
          hit.coords.x = x
          hit.coords.y = y
        }
        const onPointerLeave = e => {
          hit = null
          world.pointer.setScreenHit(null)
        }
        canvas.addEventListener('pointerenter', onPointerEnter)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerleave', onPointerLeave)
        this.cleanupPointer = () => {
          if (hit) world.pointer.setScreenHit(null)
          canvas.removeEventListener('pointerenter', onPointerEnter)
          canvas.removeEventListener('pointermove', onPointerMove)
          canvas.removeEventListener('pointerleave', onPointerLeave)
        }
      }
      this.ctx.world.pointer.ui.prepend(this.canvas)
    }
    this.needsRebuild = false
  }

  unbuild() {
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.texture.dispose()
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
      this.canvas = null
      if (this.sItem) {
        this.ctx.world.stage.octree.remove(this.sItem)
        this.sItem = null
      }
      this.ctx.world.setHot(this, false)
    }
    if (this.canvas) {
      this.ctx.world.pointer.ui.removeChild(this.canvas)
      this.canvas = null
    }
    this.cleanupPointer?.()
    this.cleanupPointer = null
  }

  draw() {
    if (!isBrowser) return
    this.yogaNode.calculateLayout(this._width * this._res, this._height * this._res, Yoga.DIRECTION_LTR)
    const ctx = this.canvasCtx
    ctx.clearRect(0, 0, this._width * this._res, this._height * this._res)
    const left = this.yogaNode.getComputedLeft()
    const top = this.yogaNode.getComputedTop()
    const width = this.yogaNode.getComputedWidth()
    const height = this.yogaNode.getComputedHeight()
    if (this._backgroundColor) {
      const inset = this._borderColor && this._borderWidth ? 1 * this._res : 0
      const radius = Math.max(0, this._borderRadius * this._res - inset)
      const insetLeft = left + inset
      const insetTop = top + inset
      const insetWidth = width - inset * 2
      const insetHeight = height - inset * 2
      fillRoundRect(ctx, insetLeft, insetTop, insetWidth, insetHeight, radius, this._backgroundColor)
    }
    if (this._borderWidth && this._borderColor) {
      const radius = this._borderRadius * this._res
      const thickness = this._borderWidth * this._res
      ctx.strokeStyle = this._borderColor
      ctx.lineWidth = thickness
      if (this._borderRadius) {
        borderRoundRect(ctx, left, top, width, height, radius, thickness)
      } else {
        const insetLeft = left + thickness / 2
        const insetTop = top + thickness / 2
        const insetWidth = width - thickness
        const insetHeight = height - thickness
        ctx.strokeRect(insetLeft, insetTop, insetWidth, insetHeight)
      }
    }
    this.box = { left, top, width, height }
    this.children.forEach(child => child.draw(ctx, left, top))
    if (this.texture) this.texture.needsUpdate = true
    this.needsRedraw = false
  }

  mount() {
    if (this.ctx.world.network.isServer) return
    if (this.parent?.ui) return console.error('ui: cannot be nested inside another ui')
    this.yogaNode = Yoga.Node.create()
    this.yogaNode.setWidth(this._width * this._res)
    this.yogaNode.setHeight(this._height * this._res)
    this.yogaNode.setBorder(Yoga.EDGE_ALL, this._borderWidth * this._res)
    if (isArray(this._padding)) {
      const [top, right, bottom, left] = this._padding
      this.yogaNode.setPadding(Yoga.EDGE_TOP, top * this._res)
      this.yogaNode.setPadding(Yoga.EDGE_RIGHT, right * this._res)
      this.yogaNode.setPadding(Yoga.EDGE_BOTTOM, bottom * this._res)
      this.yogaNode.setPadding(Yoga.EDGE_LEFT, left * this._res)
    } else {
      this.yogaNode.setPadding(Yoga.EDGE_ALL, this._padding * this._res)
    }
    this.yogaNode.setFlexDirection(FlexDirection[this._flexDirection])
    this.yogaNode.setJustifyContent(JustifyContent[this._justifyContent])
    this.yogaNode.setAlignItems(AlignItems[this._alignItems])
    this.yogaNode.setAlignContent(AlignContent[this._alignContent])
    this.yogaNode.setFlexWrap(FlexWrap[this._flexWrap])
    this.yogaNode.setGap(Yoga.GUTTER_ALL, this._gap * this._res)
    this.build()
    this.needsRedraw = true
    this.setDirty()
  }

  commit(didMove) {
    if (this.ctx.world.network.isServer) {
      return
    }
    if (this.needsRebuild) {
      this.build()
    }
    if (this.needsRedraw) {
      this.draw()
    }
    if (didMove) {
    }
  }

  lateUpdate(delta) {
    if (this._space === 'world') {
      const world = this.ctx.world
      const camera = world.camera
      const camPosition = v[0].setFromMatrixPosition(camera.matrixWorld)
      const uiPosition = v[1].setFromMatrixPosition(this.matrixWorld)
      const distance = camPosition.distanceTo(uiPosition)

      const pos = v[2]
      const qua = q[0]
      const sca = v[3]
      this.matrixWorld.decompose(pos, qua, sca)
      if (this._billboard === 'full') {
        if (world.xr.session) {
          v[4].subVectors(camPosition, pos).normalize()
          qua.setFromUnitVectors(FORWARD, v[4])
          e[0].setFromQuaternion(qua)
          e[0].z = 0
          qua.setFromEuler(e[0])
        } else {
          qua.copy(world.rig.quaternion)
        }
      } else if (this._billboard === 'y') {
        if (world.xr.session) {
          v[4].subVectors(camPosition, pos).normalize()
          qua.setFromUnitVectors(FORWARD, v[4])
          e[0].setFromQuaternion(qua)
          e[0].x = 0
          e[0].z = 0
          qua.setFromEuler(e[0])
        } else {
          e[0].setFromQuaternion(world.rig.quaternion)
          e[0].x = 0
          e[0].z = 0
          qua.setFromEuler(e[0])
        }
      }
      if (this._scaler) {
        const worldToScreenFactor = world.graphics.worldToScreenFactor
        const [minDistance, maxDistance, baseScale = 1] = this._scaler
        const clampedDistance = clamp(distance, minDistance, maxDistance)
        let scaleFactor = (baseScale * (worldToScreenFactor * clampedDistance)) / this._size
        sca.setScalar(scaleFactor)
      }
      this.matrixWorld.compose(pos, qua, sca)
      this.mesh.matrixWorld.copy(this.matrixWorld)
      if (this.sItem) {
        world.stage.octree.move(this.sItem)
      }
    }
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    this.unbuild()
    this.needRebuild = false
    this.needsRedraw = false
    this.yogaNode?.free()
    this.yogaNode = null
    this.box = null
  }

  rebuild() {
    this.needsRebuild = true
    this.needsRedraw = true
    this.setDirty()
  }

  redraw() {
    this.needsRedraw = true
    this.setDirty()
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.copyProperties(source, propertySchema)
    this._offset = source._offset
    return this
  }

  resolveHit(hit) {
    if (hit?.point) {
      const inverseMatrix = m[0].copy(this.mesh.matrixWorld).invert()
      v[0].copy(hit.point)
        .applyMatrix4(inverseMatrix)
        .multiplyScalar(1 / this._size)
        .sub(this.pivotOffset)
      const x = v[0].x * this._res
      const y = -v[0].y * this._res
      return this.findNodeAt(x, y)
    }
    if (hit?.coords) {
      return this.findNodeAt(hit.coords.x, hit.coords.y)
    }
    return null
  }

  findNodeAt(x, y) {
    const findHitNode = (node, offsetX = 0, offsetY = 0) => {
      if (!node.box || node._display === 'none') return null
      const left = offsetX + node.box.left
      const top = offsetY + node.box.top
      const width = node.box.width
      const height = node.box.height
      if (x < left || x > left + width || y < top || y > top + height) {
        return null
      }
      for (let i = node.children.length - 1; i >= 0; i--) {
        const childHit = findHitNode(node.children[i], offsetX, offsetY)
        if (childHit) return childHit
      }
      return node
    }
    return findHitNode(this)
  }

  createMaterial(lit, texture, transparent, doubleside) {
    const material = lit
      ? new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 })
      : new THREE.MeshBasicMaterial({})
    material.color.set('white')
    material.transparent = transparent
    material.depthWrite = false
    material.map = texture
    material.side = doubleside ? THREE.DoubleSide : THREE.FrontSide
    this.ctx.world.setupMaterial(material)
    return material
  }

  get offset() {
    return this._offset
  }

  set offset(value) {
    if (!value || !value.isVector3) {
      throw new Error(`[ui] offset invalid`)
    }
    this._offset.copy(value)
    this.rebuild()
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}

function pivotGeometry(pivot, geometry, width, height) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  switch (pivot) {
    case 'top-left':
      geometry.translate(halfWidth, -halfHeight, 0)
      break
    case 'top-center':
      geometry.translate(0, -halfHeight, 0)
      break
    case 'top-right':
      geometry.translate(-halfWidth, -halfHeight, 0)
      break
    case 'center-left':
      geometry.translate(halfWidth, 0, 0)
      break
    case 'center-right':
      geometry.translate(-halfWidth, 0, 0)
      break
    case 'bottom-left':
      geometry.translate(halfWidth, halfHeight, 0)
      break
    case 'bottom-center':
      geometry.translate(0, halfHeight, 0)
      break
    case 'bottom-right':
      geometry.translate(-halfWidth, halfHeight, 0)
      break
    case 'center':
    default:
      break
  }
}

function pivotCanvas(pivot, canvas, width, height) {
  switch (pivot) {
    case 'top-left':
      canvas.style.transform = `translate(0%, 0%)`
      break
    case 'top-center':
      canvas.style.transform = `translate(-50%, 0%)`
      break
    case 'top-right':
      canvas.style.transform = `translate(-100%, 0%)`
      break
    case 'center-left':
      canvas.style.transform = `translate(0%, -50%)`
      break
    case 'center-right':
      canvas.style.transform = `translate(-100%, -50%)`
      break
    case 'bottom-left':
      canvas.style.transform = `translate(0%, -100%)`
      break
    case 'bottom-center':
      canvas.style.transform = `translate(-50%, -100%)`
      break
    case 'bottom-right':
      canvas.style.transform = `translate(-100%, -100%)`
      break
    case 'center':
    default:
      canvas.style.transform = `translate(-50%, -50%)`
      break
  }
}

function isBillboard(value) {
  return billboards.includes(value)
}

function isPivot(value) {
  return pivots.includes(value)
}

function isSpace(value) {
  return spaces.includes(value)
}

function getPivotOffset(pivot, width, height) {
  const halfW = width / 2
  const halfH = height / 2
  let tx = 0,
    ty = 0
  switch (pivot) {
    case 'top-left':
      tx = +halfW
      ty = -halfH
      break
    case 'top-center':
      tx = 0
      ty = -halfH
      break
    case 'top-right':
      tx = -halfW
      ty = -halfH
      break
    case 'center-left':
      tx = +halfW
      ty = 0
      break
    case 'center-right':
      tx = -halfW
      ty = 0
      break
    case 'bottom-left':
      tx = +halfW
      ty = +halfH
      break
    case 'bottom-center':
      tx = 0
      ty = +halfH
      break
    case 'bottom-right':
      tx = -halfW
      ty = +halfH
      break
    case 'center':
    default:
      tx = 0
      ty = 0
      break
  }

  return new THREE.Vector2(-halfW + tx, +halfH + ty)
}

function isEdge(value) {
  if (isNumber(value)) {
    return true
  }
  if (isArray(value)) {
    return value.length === 4 && every(value, n => isNumber(n))
  }
  return false
}

function isScaler(value) {
  return isArray(value) && isNumber(value[0]) && isNumber(value[1])
}
