import * as pc from '../extras/playcanvas.js'
import { every, isArray, isBoolean, isNumber, isString } from '../utils/helpers/typeChecks.js'
import Yoga from 'yoga-layout'

import { Node } from './Node.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { isAlignContent, isAlignItem, isFlexDirection, isFlexWrap, isJustifyContent } from '../extras/yoga.js'
import { UIRenderer } from './ui/UIRenderer.js'
import { isBillboard, isPivot, isSpace, isEdge, isScaler } from '../validation/TypeValidators.js'
import { UILayoutManager } from './ui/UILayoutManager.js'
import { UIBillboardController } from './ui/UIBillboardController.js'
import { StateInitializer } from './base/StateInitializer.js'
import { UILayoutCalculations } from './UILayout.js'

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
    width: { default: defaults.width, onSet: function() { this.layoutManager.updateWidth(this.yogaNode); this.rebuild() } },
    height: { default: defaults.height, onSet: function() { this.layoutManager.updateHeight(this.yogaNode); this.rebuild() } },
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
    padding: { default: defaults.padding, onSet: function() { this.layoutManager.updatePadding(this.yogaNode); this.redraw() } },
    flexDirection: { default: defaults.flexDirection, onSet: function() { this.layoutManager.updateFlexDirection(this.yogaNode); this.redraw() } },
    justifyContent: { default: defaults.justifyContent, onSet: function() { this.layoutManager.updateJustifyContent(this.yogaNode); this.redraw() } },
    alignItems: { default: defaults.alignItems, onSet: function() { this.layoutManager.updateAlignItems(this.yogaNode); this.redraw() } },
    alignContent: { default: defaults.alignContent, onSet: function() { this.layoutManager.updateAlignContent(this.yogaNode); this.redraw() } },
    flexWrap: { default: defaults.flexWrap, onSet: function() { this.layoutManager.updateFlexWrap(this.yogaNode); this.redraw() } },
    gap: { default: defaults.gap, onSet: function() { this.layoutManager.updateGap(this.yogaNode); this.redraw() } },
  })
  .build()

export class UI extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'ui', propertySchema, {}, data)
    this._offset = new pc.Vec3(...(data.offset || defaults.offset))
    StateInitializer.mergeState(this, StateInitializer.initRenderingState())
    this.ui = this
    this.renderer = new UIRenderer(this)
    this.layoutManager = new UILayoutManager(this)
    this.billboardController = new UIBillboardController(this)
    this.layout = new UILayoutCalculations(this)
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
    if (this.parent?.ui) {
      logger.error('UI cannot be nested inside another UI', {})
      return
    }
    this.yogaNode = this.layoutManager.createYogaNode()
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
    this.billboardController.update(delta)
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
    this.markRebuild()
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
    return this.layout.resolveHit(hit)
  }

  findNodeAt(x, y) {
    return this.layout.findNodeAt(x, y)
  }

  createMaterial(lit, texture, transparent, doubleside) {
    return this.renderer.createMaterial(lit, texture, transparent, doubleside)
  }

  get offset() {
    return this._offset
  }

  set offset(value) {
    if (!value || !(value instanceof pc.Vec3)) {
      throw new Error(`[ui] offset invalid`)
    }
    this._offset.copy(value)
    this.rebuild()
  }

  getProxy() {
    return createSchemaProxy(this, propertySchema)
  }
}
