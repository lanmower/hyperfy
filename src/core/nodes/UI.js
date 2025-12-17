import * as THREE from '../extras/three.js'
import { every, isArray, isBoolean, isNumber, isString } from 'lodash-es'
import Yoga from 'yoga-layout'

import { Node } from './Node.js'
import { clamp } from '../utils.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { schema } from '../utils/validation/createNodeSchema.js'
import { v, q, m, e } from '../utils/TempVectors.js'
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
import { UIRenderer } from './ui/UIRenderer.js'
import { getPivotOffset, isBillboard, isPivot, isSpace, isEdge, isScaler } from './ui/UIHelpers.js'

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
    this.renderer = new UIRenderer(this)

    this._offset._onChange = () => this.rebuild()
  }

  build() {
    this.renderer.build()
  }

  unbuild() {
    this.renderer.unbuild()
  }

  draw() {
    this.renderer.draw()
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
    return this.renderer.createMaterial(lit, texture, transparent, doubleside)
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
