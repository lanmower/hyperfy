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
import { defineProps } from '../utils/defineProperty.js'

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

const propertySchema = {
  display: {
    default: defaults.display,
    validate: v => !isDisplay(v) ? `[uiview] display invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setDisplay(Display[this._display])
      this.ui?.redraw()
    },
  },
  width: {
    default: defaults.width,
    validate: v => v !== null && !isNumber(v) ? '[uiview] width not a number' : null,
    onSet() {
      this.yogaNode?.setWidth(this._width === null ? undefined : this._width * this.ui._res)
      this.ui?.redraw()
    },
  },
  height: {
    default: defaults.height,
    validate: v => v !== null && !isNumber(v) ? '[uiview] height not a number' : null,
    onSet() {
      this.yogaNode?.setHeight(this._height === null ? undefined : this._height * this.ui._res)
      this.ui?.redraw()
    },
  },
  absolute: {
    default: defaults.absolute,
    validate: v => !isBoolean(v) ? '[uiview] absolute not a boolean' : null,
    onSet() {
      this.yogaNode?.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE)
      this.ui?.redraw()
    },
  },
  top: {
    default: defaults.top,
    validate: v => v !== null && !isNumber(v) ? '[uiview] top must be a number or null' : null,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  right: {
    default: defaults.right,
    validate: v => v !== null && !isNumber(v) ? '[uiview] right must be a number or null' : null,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  bottom: {
    default: defaults.bottom,
    validate: v => v !== null && !isNumber(v) ? '[uiview] bottom must be a number or null' : null,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  left: {
    default: defaults.left,
    validate: v => v !== null && !isNumber(v) ? '[uiview] left must be a number or null' : null,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  backgroundColor: {
    default: defaults.backgroundColor,
    validate: v => v !== null && !isString(v) ? '[uiview] backgroundColor not a string' : null,
    onSet() {
      this.ui?.redraw()
    },
  },
  borderWidth: {
    default: defaults.borderWidth,
    validate: v => !isNumber(v) ? '[uiview] borderWidth not a number' : null,
    onSet() {
      this.ui?.redraw()
    },
  },
  borderColor: {
    default: defaults.borderColor,
    validate: v => v !== null && !isString(v) ? '[uiview] borderColor not a string' : null,
    onSet() {
      this.ui?.redraw()
    },
  },
  borderRadius: {
    default: defaults.borderRadius,
    validate: v => !isNumber(v) ? '[uiview] borderRadius not a number' : null,
    onSet() {
      this.ui?.redraw()
    },
  },
  margin: {
    default: defaults.margin,
    validate: v => !isEdge(v) ? '[uiview] margin not a number or array of numbers' : null,
    onSet() {
      if (isArray(this._margin)) {
        const [top, right, bottom, left] = this._margin
        this.yogaNode?.setMargin(Yoga.EDGE_TOP, top * this.ui._res)
        this.yogaNode?.setMargin(Yoga.EDGE_RIGHT, right * this.ui._res)
        this.yogaNode?.setMargin(Yoga.EDGE_BOTTOM, bottom * this.ui._res)
        this.yogaNode?.setMargin(Yoga.EDGE_LEFT, left * this.ui._res)
      } else {
        this.yogaNode?.setMargin(Yoga.EDGE_ALL, this._margin * this.ui._res)
      }
      this.ui?.redraw()
    },
  },
  padding: {
    default: defaults.padding,
    validate: v => !isEdge(v) ? '[uiview] padding not a number or array of numbers' : null,
    onSet() {
      if (isArray(this._padding)) {
        const [top, right, bottom, left] = this._padding
        this.yogaNode?.setPadding(Yoga.EDGE_TOP, top * this.ui._res)
        this.yogaNode?.setPadding(Yoga.EDGE_RIGHT, right * this.ui._res)
        this.yogaNode?.setPadding(Yoga.EDGE_BOTTOM, bottom * this.ui._res)
        this.yogaNode?.setPadding(Yoga.EDGE_LEFT, left * this.ui._res)
      } else {
        this.yogaNode?.setPadding(Yoga.EDGE_ALL, this._padding * this.ui._res)
      }
      this.ui?.redraw()
    },
  },
  flexDirection: {
    default: defaults.flexDirection,
    validate: v => !isFlexDirection(v) ? `[uiview] flexDirection invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setFlexDirection(FlexDirection[this._flexDirection])
      this.ui?.redraw()
    },
  },
  justifyContent: {
    default: defaults.justifyContent,
    validate: v => !isJustifyContent(v) ? `[uiview] justifyContent invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setJustifyContent(JustifyContent[this._justifyContent])
      this.ui?.redraw()
    },
  },
  alignItems: {
    default: defaults.alignItems,
    validate: v => !isAlignItem(v) ? `[uiview] alignItems invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setAlignItems(AlignItems[this._alignItems])
      this.ui?.redraw()
    },
  },
  alignContent: {
    default: defaults.alignContent,
    validate: v => !isAlignContent(v) ? `[uiview] alignContent invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setAlignContent(AlignContent[this._alignContent])
      this.ui?.redraw()
    },
  },
  flexWrap: {
    default: defaults.flexWrap,
    validate: v => !isFlexWrap(v) ? `[uiview] flexWrap invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setFlexWrap(FlexWrap[this._flexWrap])
      this.ui?.redraw()
    },
  },
  gap: {
    default: defaults.gap,
    validate: v => !isNumber(v) ? '[uiview] gap not a number' : null,
    onSet() {
      this.yogaNode?.setGap(Yoga.GUTTER_ALL, this._gap * this.ui._res)
      this.ui?.redraw()
    },
  },
  flexBasis: {
    default: defaults.flexBasis,
    validate: v => !isNumber(v) && !isString(v) ? '[uiview] flexBasis invalid' : null,
    onSet() {
      this.yogaNode?.setFlexBasis(this._flexBasis)
      this.ui?.redraw()
    },
  },
  flexGrow: {
    default: defaults.flexGrow,
    validate: v => !isNumber(v) ? '[uiview] flexGrow not a number' : null,
    onSet() {
      this.yogaNode?.setFlexGrow(this._flexGrow)
      this.ui?.redraw()
    },
  },
  flexShrink: {
    default: defaults.flexShrink,
    validate: v => !isNumber(v) ? '[uiview] flexShrink not a number' : null,
    onSet() {
      this.yogaNode?.setFlexShrink(this._flexShrink)
      this.ui?.redraw()
    },
  },
}

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
      // when theres a border, slightly inset to prevent bleeding
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
      // todo: migrate to new roundRect { strokeRoundRect }
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
    // ...
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

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
    return this
  }

  getProxy() {
    var self = this
    if (!this.proxy) {
      let proxy = {
        get display() {
          return self.display
        },
        set display(value) {
          self.display = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get absolute() {
          return self.absolute
        },
        set absolute(value) {
          self.absolute = value
        },
        get top() {
          return self.top
        },
        set top(value) {
          self.top = value
        },
        get right() {
          return self.right
        },
        set right(value) {
          self.right = value
        },
        get bottom() {
          return self.bottom
        },
        set bottom(value) {
          self.bottom = value
        },
        get left() {
          return self.left
        },
        set left(value) {
          self.left = value
        },
        get backgroundColor() {
          return self.backgroundColor
        },
        set backgroundColor(value) {
          self.backgroundColor = value
        },
        get borderWidth() {
          return self.borderWidth
        },
        set borderWidth(value) {
          self.borderWidth = value
        },
        get borderColor() {
          return self.borderColor
        },
        set borderColor(value) {
          self.borderColor = value
        },
        get borderRadius() {
          return self.borderRadius
        },
        set borderRadius(value) {
          self.borderRadius = value
        },
        get margin() {
          return self.margin
        },
        set margin(value) {
          self.margin = value
        },
        get padding() {
          return self.padding
        },
        set padding(value) {
          self.padding = value
        },
        get flexDirection() {
          return self.flexDirection
        },
        set flexDirection(value) {
          self.flexDirection = value
        },
        get justifyContent() {
          return self.justifyContent
        },
        set justifyContent(value) {
          self.justifyContent = value
        },
        get alignItems() {
          return self.alignItems
        },
        set alignItems(value) {
          self.alignItems = value
        },
        get alignContent() {
          return self.alignContent
        },
        set alignContent(value) {
          self.alignContent = value
        },
        get flexWrap() {
          return self.flexWrap
        },
        set flexWrap(value) {
          self.flexWrap = value
        },
        get gap() {
          return self.gap
        },
        set gap(value) {
          self.gap = value
        },
        get flexBasis() {
          return self.flexBasis
        },
        set flexBasis(value) {
          self.flexBasis = value
        },
        get flexGrow() {
          return self.flexGrow
        },
        set flexGrow(value) {
          self.flexGrow = value
        },
        get flexShrink() {
          return self.flexShrink
        },
        set flexShrink(value) {
          self.flexShrink = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
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
