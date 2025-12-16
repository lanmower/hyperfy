import Yoga from 'yoga-layout'
import { every, isArray, isBoolean, isNumber, isString } from 'lodash-es'

import { Node } from './Node.js'
import { Display, isDisplay } from '../extras/yoga.js'
import { fillRoundRect } from '../extras/roundRect.js'
import { defineProps, createPropertyProxy, validators } from '../utils/defineProperty.js'

const textAligns = ['left', 'center', 'right']

const defaults = {
  display: 'flex',
  absolute: false,
  top: null,
  right: null,
  bottom: null,
  left: null,
  backgroundColor: null,
  borderRadius: 0,
  margin: 0,
  padding: 0,
  value: '',
  fontSize: 16,
  color: '#000000',
  lineHeight: 1.2,
  textAlign: 'left',
  fontFamily: 'Rubik',
  fontWeight: 'normal',
  flexBasis: 'auto',
  flexGrow: 0,
  flexShrink: 1,
}

const propertySchema = {
  display: {
    default: defaults.display,
    validate: v => !isDisplay(v) ? `[uitext] display invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setDisplay(Display[this._display])
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  absolute: {
    default: defaults.absolute,
    validate: validators.boolean,
    onSet() {
      this.yogaNode?.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE)
      this.ui?.redraw()
    },
  },
  top: {
    default: defaults.top,
    validate: validators.numberOrNull,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  right: {
    default: defaults.right,
    validate: validators.numberOrNull,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  bottom: {
    default: defaults.bottom,
    validate: validators.numberOrNull,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  left: {
    default: defaults.left,
    validate: validators.numberOrNull,
    onSet() {
      this.yogaNode?.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined)
      this.ui?.redraw()
    },
  },
  backgroundColor: {
    default: defaults.backgroundColor,
    validate: validators.stringOrNull,
    onSet() {
      this.ui?.redraw()
    },
  },
  borderRadius: {
    default: defaults.borderRadius,
    validate: validators.number,
    onSet() {
      this.ui?.redraw()
    },
  },
  margin: {
    default: defaults.margin,
    validate: v => !isEdge(v) ? '[uitext] margin not a number or array of numbers' : null,
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
    validate: v => !isEdge(v) ? '[uitext] padding not a number or array of numbers' : null,
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
  value: {
    default: defaults.value,
    validate: v => !isString(v) && !isNumber(v) ? '[uitext] value not a string' : null,
    onSet() {
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  fontSize: {
    default: defaults.fontSize,
    validate: validators.number,
    onSet() {
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  color: {
    default: defaults.color,
    validate: validators.string,
    onSet() {
      this.ui?.redraw()
    },
  },
  lineHeight: {
    default: defaults.lineHeight,
    validate: validators.number,
    onSet() {
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  textAlign: {
    default: defaults.textAlign,
    validate: v => !isTextAlign(v) ? `[uitext] textAlign invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  fontFamily: {
    default: defaults.fontFamily,
    validate: validators.string,
    onSet() {
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  fontWeight: {
    default: defaults.fontWeight,
    validate: v => !isString(v) && !isNumber(v) ? '[uitext] fontWeight invalid' : null,
    onSet() {
      this.yogaNode?.markDirty()
      this.ui?.redraw()
    },
  },
  flexBasis: {
    default: defaults.flexBasis,
    validate: validators.stringOrNumber,
    onSet() {
      this.yogaNode?.setFlexBasis(this._flexBasis)
      this.ui?.redraw()
    },
  },
  flexGrow: {
    default: defaults.flexGrow,
    validate: validators.number,
    onSet() {
      this.yogaNode?.setFlexGrow(this._flexGrow)
      this.ui?.redraw()
    },
  },
  flexShrink: {
    default: defaults.flexShrink,
    validate: validators.number,
    onSet() {
      this.yogaNode?.setFlexShrink(this._flexShrink)
      this.ui?.redraw()
    },
  },
}

let offscreenContext
const getOffscreenContext = () => {
  if (!offscreenContext) {
    const offscreenCanvas = document.createElement('canvas')
    offscreenContext = offscreenCanvas.getContext('2d')
  }
  return offscreenContext
}

const isBrowser = typeof window !== 'undefined'

export class UIText extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'uitext'

    defineProps(this, propertySchema, data)
  }

  draw(ctx, offsetLeft, offsetTop) {
    if (this._display === 'none') return
    const left = offsetLeft + this.yogaNode.getComputedLeft()
    const top = offsetTop + this.yogaNode.getComputedTop()
    const width = this.yogaNode.getComputedWidth()
    const height = this.yogaNode.getComputedHeight()
    if (this._backgroundColor) {
      fillRoundRect(ctx, left, top, width, height, this._borderRadius * this.ui._res, this._backgroundColor)
    }
    ctx.font = `${this._fontWeight} ${this._fontSize * this.ui._res}px ${this._fontFamily}`
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = this._textAlign
    ctx.fillStyle = this._color
    ctx.fillStyle = this._color
    const paddingLeft = this.yogaNode.getComputedPadding(Yoga.EDGE_LEFT)
    const paddingTop = this.yogaNode.getComputedPadding(Yoga.EDGE_TOP)
    const paddingRight = this.yogaNode.getComputedPadding(Yoga.EDGE_RIGHT)
    const innerWidth = width - paddingLeft - paddingRight
    let innerX = left + paddingLeft
    if (this._textAlign === 'center') {
      innerX = left + width / 2
    } else if (this._textAlign === 'right') {
      innerX = left + width - paddingRight
    }
    const lines = wrapText(ctx, this._value, innerWidth)
    let currentBaselineY = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isFirst = i === 0
      const metrics = ctx.measureText(line)
      const ascent = metrics.actualBoundingBoxAscent
      const descent = metrics.actualBoundingBoxDescent
      const naturalLineHeight = ascent + descent
      const baselineGap = naturalLineHeight * this._lineHeight
      if (isFirst) currentBaselineY += top + paddingTop + metrics.actualBoundingBoxAscent
      ctx.fillText(line, innerX, currentBaselineY)
      currentBaselineY += baselineGap
    }
    this.box = { left, top, width, height }
  }

  mount() {
    if (!isBrowser) return
    this.ui = this.parent?.ui
    if (!this.ui) return console.error('uitext: must be child of ui node')
    this.yogaNode = Yoga.Node.create()
    this.yogaNode.setMeasureFunc(this.measureTextFunc())
    this.yogaNode.setDisplay(Display[this._display])
    this.yogaNode.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE)
    this.yogaNode.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined)
    this.yogaNode.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined)
    this.yogaNode.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined)
    this.yogaNode.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined)
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

  get value() {
    return this._value
  }

  set value(val = defaults.value) {
    if (isNumber(val)) {
      val = val + ''
    }
    if (!isString(val)) {
      throw new Error(`[uitext] value not a string`)
    }
    if (this._value === val) return
    this._value = val
    this.yogaNode?.markDirty()
    this.ui?.redraw()
  }

  measureTextFunc() {
    const ctx = getOffscreenContext()
    return (width, widthMode, height, heightMode) => {
      ctx.font = `${this._fontWeight} ${this._fontSize * this.ui._res}px ${this._fontFamily}`
      ctx.textBaseline = 'alphabetic'
      let lines
      if (widthMode === Yoga.MEASURE_MODE_EXACTLY || widthMode === Yoga.MEASURE_MODE_AT_MOST) {
        lines = wrapText(ctx, this._value, width)
      } else {
        lines = [this._value]
      }
      let finalHeight = 0
      let finalWidth = 0
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const isFirst = i === 0
        const isLast = i === lines.length - 1
        const metrics = ctx.measureText(line)
        const ascent = metrics.actualBoundingBoxAscent
        const descent = metrics.actualBoundingBoxDescent
        const naturalLineHeight = ascent + descent
        if (metrics.width > finalWidth) {
          finalWidth = metrics.width
        }
        if (isLast) {
          finalHeight += naturalLineHeight
        } else {
          finalHeight += naturalLineHeight * this._lineHeight
        }
      }
      if (widthMode === Yoga.MEASURE_MODE_AT_MOST) {
        finalWidth = Math.min(finalWidth, width)
      }
      return { width: finalWidth, height: finalHeight }
    }
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + ' ' + word).width
    if (width <= maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)

  return lines
}

function isTextAlign(value) {
  return textAligns.includes(value)
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
