import Yoga from 'yoga-layout'
import { isArray, isNumber, isString } from 'lodash-es'
import { UIChildNode, uiChildDefaults, createYogaPropertyHandlers } from './base/UINodeBase.js'
import { fillRoundRect } from '../extras/roundRect.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { schema } from '../utils/validation/createNodeSchema.js'

const defaults = {
  ...uiChildDefaults,
  value: '',
  fontSize: 16,
  color: '#000000',
  lineHeight: 1.2,
  textAlign: 'left',
  fontFamily: 'Rubik',
  fontWeight: 'normal',
}

const redraw = function() { this.ui?.redraw() }
const markDirtyRedraw = function() { this.yogaNode?.markDirty(); this.ui?.redraw() }
const handlers = createYogaPropertyHandlers()

const propertySchema = schema('display', 'absolute', 'top', 'right', 'bottom', 'left', 'backgroundColor', 'borderRadius', 'margin', 'padding', 'value', 'fontSize', 'color', 'lineHeight', 'textAlign', 'fontFamily', 'fontWeight', 'flexBasis', 'flexGrow', 'flexShrink')
  .overrideAll({
    display: { default: defaults.display, onSet: handlers.display },
    absolute: { default: defaults.absolute, onSet: handlers.absolute },
    top: { default: defaults.top, onSet: handlers.top },
    right: { default: defaults.right, onSet: handlers.right },
    bottom: { default: defaults.bottom, onSet: handlers.bottom },
    left: { default: defaults.left, onSet: handlers.left },
    backgroundColor: { default: defaults.backgroundColor, onSet: redraw },
    borderRadius: { default: defaults.borderRadius, onSet: redraw },
    margin: { default: defaults.margin, onSet: handlers.margin },
    padding: { default: defaults.padding, onSet: handlers.padding },
    value: { default: defaults.value, onSet: markDirtyRedraw },
    fontSize: { default: defaults.fontSize, onSet: markDirtyRedraw },
    color: { default: defaults.color, onSet: redraw },
    lineHeight: { default: defaults.lineHeight, onSet: markDirtyRedraw },
    textAlign: { default: defaults.textAlign, onSet: markDirtyRedraw },
    fontFamily: { default: defaults.fontFamily, onSet: markDirtyRedraw },
    fontWeight: { default: defaults.fontWeight, onSet: markDirtyRedraw },
    flexBasis: { default: defaults.flexBasis, onSet: handlers.flexBasis },
    flexGrow: { default: defaults.flexGrow, onSet: handlers.flexGrow },
    flexShrink: { default: defaults.flexShrink, onSet: handlers.flexShrink },
  })
  .build()

let offscreenContext
const getOffscreenContext = () => {
  if (!offscreenContext) {
    const canvas = document.createElement('canvas')
    offscreenContext = canvas.getContext('2d')
  }
  return offscreenContext
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0]
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    if (ctx.measureText(currentLine + ' ' + word).width <= maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

export class UIText extends UIChildNode {
  constructor(data = {}) {
    super(data)
    this.name = 'uitext'
    defineProps(this, propertySchema, data)
  }

  createYogaNode() {
    const yogaNode = super.createYogaNode()
    yogaNode.setMeasureFunc(this.measureTextFunc())
    return yogaNode
  }

  draw(ctx, offsetLeft, offsetTop) {
    if (this._display === 'none') return
    const { left, top, width, height } = this.getComputedLayout(offsetLeft, offsetTop)

    this.drawBackground(ctx, left, top, width, height)

    ctx.font = `${this._fontWeight} ${this._fontSize * this.ui._res}px ${this._fontFamily}`
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = this._textAlign
    ctx.fillStyle = this._color

    const paddingLeft = this.yogaNode.getComputedPadding(Yoga.EDGE_LEFT)
    const paddingTop = this.yogaNode.getComputedPadding(Yoga.EDGE_TOP)
    const paddingRight = this.yogaNode.getComputedPadding(Yoga.EDGE_RIGHT)
    const innerWidth = width - paddingLeft - paddingRight

    let innerX = left + paddingLeft
    if (this._textAlign === 'center') innerX = left + width / 2
    else if (this._textAlign === 'right') innerX = left + width - paddingRight

    const lines = wrapText(ctx, this._value, innerWidth)
    let currentBaselineY = 0
    for (let i = 0; i < lines.length; i++) {
      const metrics = ctx.measureText(lines[i])
      const naturalLineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      if (i === 0) currentBaselineY += top + paddingTop + metrics.actualBoundingBoxAscent
      ctx.fillText(lines[i], innerX, currentBaselineY)
      currentBaselineY += naturalLineHeight * this._lineHeight
    }

    this.box = { left, top, width, height }
  }

  measureTextFunc() {
    const ctx = getOffscreenContext()
    return (width, widthMode) => {
      ctx.font = `${this._fontWeight} ${this._fontSize * this.ui._res}px ${this._fontFamily}`
      ctx.textBaseline = 'alphabetic'

      const lines = (widthMode === Yoga.MEASURE_MODE_EXACTLY || widthMode === Yoga.MEASURE_MODE_AT_MOST)
        ? wrapText(ctx, this._value, width)
        : [this._value]

      let finalHeight = 0, finalWidth = 0
      for (let i = 0; i < lines.length; i++) {
        const metrics = ctx.measureText(lines[i])
        const naturalLineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        if (metrics.width > finalWidth) finalWidth = metrics.width
        finalHeight += i === lines.length - 1 ? naturalLineHeight : naturalLineHeight * this._lineHeight
      }

      if (widthMode === Yoga.MEASURE_MODE_AT_MOST) finalWidth = Math.min(finalWidth, width)
      return { width: finalWidth, height: finalHeight }
    }
  }

  get value() { return this._value }
  set value(val = defaults.value) {
    if (isNumber(val)) val = val + ''
    if (!isString(val)) throw new Error(`[uitext] value not a string`)
    if (this._value === val) return
    this._value = val
    this.yogaNode?.markDirty()
    this.ui?.redraw()
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}
