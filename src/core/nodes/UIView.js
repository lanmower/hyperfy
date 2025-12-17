import Yoga from 'yoga-layout'
import * as THREE from '../extras/three.js'
import { every, isArray, isBoolean, isNumber, isString } from 'lodash-es'

import { Node } from './Node.js'
import { fillRoundRect } from '../extras/roundRect.js'
import {
  AlignItems,
  AlignContent,
  FlexDirection,
  JustifyContent,
  Display,
  FlexWrap,
  isDisplay,
  isFlexDirection,
  isJustifyContent,
  isAlignItem,
  isAlignContent,
  isFlexWrap,
} from '../extras/yoga.js'
import { borderRoundRect } from '../extras/borderRoundRect.js'
import { defineProps, createPropertyProxy, validators } from '../utils/helpers/defineProperty.js'

const defaults = {
  display: 'flex',
  width: null,
  height: null,
  absolute: false,
  top: null,
  right: null,
  bottom: null,
  left: null,
  backgroundColor: null,
  borderWidth: 0,
  borderColor: null,
  borderRadius: 0,
  margin: 0,
  padding: 0,
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'flex-start',
  flexWrap: 'no-wrap',
  gap: 0,
  flexBasis: 'auto',
  flexGrow: 0,
  flexShrink: 1,
}

const redraw = function() { this.ui?.redraw() }
const propertySchema = schema('display', 'width', 'height', 'absolute', 'top', 'right', 'bottom', 'left', 'backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'margin', 'padding', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent', 'flexWrap', 'gap', 'flexBasis', 'flexGrow', 'flexShrink')
  .overrideAll({
    display: { default: defaults.display, onSet: function() { this.yogaNode?.setDisplay(Display[this._display]); this.ui?.redraw() } },
    width: { default: defaults.width, onSet: function() { this.yogaNode?.setWidth(this._width === null ? undefined : this._width * this.ui._res); this.ui?.redraw() } },
    height: { default: defaults.height, onSet: function() { this.yogaNode?.setHeight(this._height === null ? undefined : this._height * this.ui._res); this.ui?.redraw() } },
    absolute: { default: defaults.absolute, onSet: function() { this.yogaNode?.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE); this.ui?.redraw() } },
    top: { default: defaults.top, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined); this.ui?.redraw() } },
    right: { default: defaults.right, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined); this.ui?.redraw() } },
    bottom: { default: defaults.bottom, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined); this.ui?.redraw() } },
    left: { default: defaults.left, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined); this.ui?.redraw() } },
    backgroundColor: { default: defaults.backgroundColor, onSet: redraw },
    borderWidth: { default: defaults.borderWidth, onSet: redraw },
    borderColor: { default: defaults.borderColor, onSet: redraw },
    borderRadius: { default: defaults.borderRadius, onSet: redraw },
    margin: { default: defaults.margin, onSet: function() { if (isArray(this._margin)) { const [t,r,b,l]=this._margin; this.yogaNode?.setMargin(Yoga.EDGE_TOP,t*this.ui._res); this.yogaNode?.setMargin(Yoga.EDGE_RIGHT,r*this.ui._res); this.yogaNode?.setMargin(Yoga.EDGE_BOTTOM,b*this.ui._res); this.yogaNode?.setMargin(Yoga.EDGE_LEFT,l*this.ui._res) } else { this.yogaNode?.setMargin(Yoga.EDGE_ALL,this._margin*this.ui._res) } this.ui?.redraw() } },
    padding: { default: defaults.padding, onSet: function() { if (isArray(this._padding)) { const [t,r,b,l]=this._padding; this.yogaNode?.setPadding(Yoga.EDGE_TOP,t*this.ui._res); this.yogaNode?.setPadding(Yoga.EDGE_RIGHT,r*this.ui._res); this.yogaNode?.setPadding(Yoga.EDGE_BOTTOM,b*this.ui._res); this.yogaNode?.setPadding(Yoga.EDGE_LEFT,l*this.ui._res) } else { this.yogaNode?.setPadding(Yoga.EDGE_ALL,this._padding*this.ui._res) } this.ui?.redraw() } },
    flexDirection: { default: defaults.flexDirection, onSet: function() { this.yogaNode?.setFlexDirection(FlexDirection[this._flexDirection]); this.ui?.redraw() } },
    justifyContent: { default: defaults.justifyContent, onSet: function() { this.yogaNode?.setJustifyContent(JustifyContent[this._justifyContent]); this.ui?.redraw() } },
    alignItems: { default: defaults.alignItems, onSet: function() { this.yogaNode?.setAlignItems(AlignItems[this._alignItems]); this.ui?.redraw() } },
    alignContent: { default: defaults.alignContent, onSet: function() { this.yogaNode?.setAlignContent(AlignContent[this._alignContent]); this.ui?.redraw() } },
    flexWrap: { default: defaults.flexWrap, onSet: function() { this.yogaNode?.setFlexWrap(FlexWrap[this._flexWrap]); this.ui?.redraw() } },
    gap: { default: defaults.gap, onSet: function() { this.yogaNode?.setGap(Yoga.GUTTER_ALL, this._gap * this.ui._res); this.ui?.redraw() } },
    flexBasis: { default: defaults.flexBasis, onSet: function() { this.yogaNode?.setFlexBasis(this._flexBasis); this.ui?.redraw() } },
    flexGrow: { default: defaults.flexGrow, onSet: function() { this.yogaNode?.setFlexGrow(this._flexGrow); this.ui?.redraw() } },
    flexShrink: { default: defaults.flexShrink, onSet: function() { this.yogaNode?.setFlexShrink(this._flexShrink); this.ui?.redraw() } },
  })
  .build()

export class UIView extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'uiview'

    defineProps(this, propertySchema, data)
  }

  draw(ctx, offsetLeft, offsetTop) {
    if (this._display === 'none') return
    this.box = {}
    const left = offsetLeft + this.yogaNode.getComputedLeft()
    const top = offsetTop + this.yogaNode.getComputedTop()
    const width = this.yogaNode.getComputedWidth()
    const height = this.yogaNode.getComputedHeight()
    if (this._backgroundColor) {
      const inset = this._borderColor && this._borderWidth ? 0.5 * this.ui._res : 0
      const radius = Math.max(0, this._borderRadius * this.ui._res - inset)
      const insetLeft = left + inset
      const insetTop = top + inset
      const insetWidth = width - inset * 2
      const insetHeight = height - inset * 2
      fillRoundRect(ctx, insetLeft, insetTop, insetWidth, insetHeight, radius, this._backgroundColor)
    }
    if (this._borderWidth && this._borderColor) {
      const radius = this._borderRadius * this.ui._res
      const thickness = this._borderWidth * this.ui._res
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
  }

  mount() {
    if (this.ctx.world.network.isServer) return
    this.ui = this.parent?.ui
    if (!this.ui) return console.error('uiview: must be child of ui node')
    this.yogaNode = Yoga.Node.create()
    this.yogaNode.setDisplay(Display[this._display])
    this.yogaNode.setWidth(this._width === null ? undefined : this._width * this.ui._res)
    this.yogaNode.setHeight(this._height === null ? undefined : this._height * this.ui._res)
    this.yogaNode.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE)
    this.yogaNode.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined)
    this.yogaNode.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined)
    this.yogaNode.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined)
    this.yogaNode.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined)
    this.yogaNode.setBorder(Yoga.EDGE_ALL, this._borderWidth * this.ui._res)
    if (isArray(this._margin)) {
      const [top, right, bottom, left] = this._margin
      this.yogaNode.setMargin(Yoga.EDGE_TOP, top * this.ui._res)
      this.yogaNode.setMargin(Yoga.EDGE_RIGHT, right * this.ui._res)
      this.yogaNode.setMargin(Yoga.EDGE_BOTTOM, bottom * this.ui._res)
      this.yogaNode.setMargin(Yoga.EDGE_LEFT, left * this.ui._res)
    } else {
      this.yogaNode.setMargin(Yoga.EDGE_ALL, this._margin * this.ui._res)
    }
    if (isArray(this._padding)) {
      const [top, right, bottom, left] = this._padding
      this.yogaNode.setPadding(Yoga.EDGE_TOP, top * this.ui._res)
      this.yogaNode.setPadding(Yoga.EDGE_RIGHT, right * this.ui._res)
      this.yogaNode.setPadding(Yoga.EDGE_BOTTOM, bottom * this.ui._res)
      this.yogaNode.setPadding(Yoga.EDGE_LEFT, left * this.ui._res)
    } else {
      this.yogaNode.setPadding(Yoga.EDGE_ALL, this._padding * this.ui._res)
    }
    this.yogaNode.setFlexDirection(FlexDirection[this._flexDirection])
    this.yogaNode.setJustifyContent(JustifyContent[this._justifyContent])
    this.yogaNode.setAlignItems(AlignItems[this._alignItems])
    this.yogaNode.setAlignContent(AlignContent[this._alignContent])
    this.yogaNode.setFlexWrap(FlexWrap[this._flexWrap])
    this.yogaNode.setGap(Yoga.GUTTER_ALL, this._gap * this.ui._res)
    this.yogaNode.setFlexBasis(this._flexBasis)
    this.yogaNode.setFlexGrow(this._flexGrow)
    this.yogaNode.setFlexShrink(this._flexShrink)
    this.parent.yogaNode.insertChild(this.yogaNode, this.parent.yogaNode.getChildCount())
    this.ui?.redraw()
  }

  commit(didMove) {
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    if (this.yogaNode) {
      this.parent.yogaNode?.removeChild(this.yogaNode)
      this.yogaNode.free()
      this.yogaNode = null
      this.box = null
    }
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
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
