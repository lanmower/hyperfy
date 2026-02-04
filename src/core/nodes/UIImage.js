import Yoga from 'yoga-layout'
import { isArray, isNumber } from '../utils/helpers/typeChecks.js'
import { UIChildNode, uiChildDefaults, createYogaPropertyHandlers } from './base/UINodeBase.js'
import { fillRoundRect, imageRoundRect } from '../extras/roundRect.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'

const defaults = {
  ...uiChildDefaults,
  src: null,
  width: null,
  height: null,
  objectFit: 'contain',
}

const redraw = function() { this.ui?.redraw() }
const markDirtyRedraw = function() { this.yogaNode?.markDirty(); this.ui?.redraw() }
const handlers = createYogaPropertyHandlers()

const propertySchema = schema('display', 'src', 'width', 'height', 'absolute', 'top', 'right', 'bottom', 'left', 'objectFit', 'backgroundColor', 'borderRadius', 'margin')
  .overrideAll({
    display: { default: defaults.display, onSet: handlers.display },
    src: { default: defaults.src, onSet: function() { if (this._src) this.loadImage(this._src); else { this.img = null; this.ui?.redraw() } } },
    width: { default: defaults.width, onSet: markDirtyRedraw },
    height: { default: defaults.height, onSet: markDirtyRedraw },
    absolute: { default: defaults.absolute, onSet: handlers.absolute },
    top: { default: defaults.top, onSet: handlers.top },
    right: { default: defaults.right, onSet: handlers.right },
    bottom: { default: defaults.bottom, onSet: handlers.bottom },
    left: { default: defaults.left, onSet: handlers.left },
    objectFit: { default: defaults.objectFit, onSet: redraw },
    backgroundColor: { default: defaults.backgroundColor, onSet: redraw },
    borderRadius: { default: defaults.borderRadius, onSet: redraw },
    margin: { default: defaults.margin, onSet: handlers.margin },
  })
  .build()

export class UIImage extends UIChildNode {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'uiimage', propertySchema, {}, data)
    this.img = null
  }

  createYogaNode() {
    const yogaNode = super.createYogaNode()
    yogaNode.setMeasureFunc(this.measureFunc())
    return yogaNode
  }

  mount() {
    super.mount()
    if (this._src && !this.img) this.loadImage(this._src)
  }

  unmount() {
    super.unmount()
    this.img = null
  }

  draw(ctx, offsetLeft, offsetTop) {
    if (this._display === 'none') return
    const { left, top, width, height } = this.getComputedLayout(offsetLeft, offsetTop)

    this.drawBackground(ctx, left, top, width, height)

    if (this.img) {
      const params = this.calculateDrawParameters(this.img.width, this.img.height, width, height)
      imageRoundRect(ctx, left, top, width, height, this._borderRadius * this.ui._res, this.img, left + params.x, top + params.y, params.width, params.height)
    }

    this.box = { left, top, width, height }
  }

  async loadImage(src) {
    if (!this.ctx?.world) return
    const url = this.ctx.world.resolveURL(src)
    this.img = this.ctx.world.loader.get('image', url)
    if (!this.img) this.img = await this.ctx.world.loader.load('image', url)
    if (!this.ui) return
    this.yogaNode?.markDirty()
    this.ui?.redraw()
  }

  measureFunc() {
    return (width, widthMode, height, heightMode) => {
      if (this._width !== null && this._height !== null) {
        return { width: this._width * this.ui._res, height: this._height * this.ui._res }
      }
      if (!this.img) return { width: 0, height: 0 }

      const aspectRatio = this.img.width / this.img.height
      let finalWidth, finalHeight

      if (this._width !== null) {
        finalWidth = this._width * this.ui._res
        finalHeight = finalWidth / aspectRatio
      } else if (this._height !== null) {
        finalHeight = this._height * this.ui._res
        finalWidth = finalHeight * aspectRatio
      } else {
        if (widthMode === Yoga.MEASURE_MODE_EXACTLY) {
          finalWidth = width
          finalHeight = width / aspectRatio
        } else if (widthMode === Yoga.MEASURE_MODE_AT_MOST) {
          finalWidth = Math.min(this.img.width * this.ui._res, width)
          finalHeight = finalWidth / aspectRatio
        } else {
          finalWidth = this.img.width * this.ui._res
          finalHeight = this.img.height * this.ui._res
        }
        if (heightMode === Yoga.MEASURE_MODE_EXACTLY) {
          finalHeight = height
          if (this._objectFit === 'contain') finalWidth = Math.min(finalWidth, height * aspectRatio)
        } else if (heightMode === Yoga.MEASURE_MODE_AT_MOST && finalHeight > height) {
          finalHeight = height
          finalWidth = height * aspectRatio
        }
      }
      return { width: finalWidth, height: finalHeight }
    }
  }

  calculateDrawParameters(imgWidth, imgHeight, containerWidth, containerHeight) {
    const aspectRatio = imgWidth / imgHeight
    if (this._objectFit === 'cover') {
      if (containerWidth / containerHeight > aspectRatio) {
        const w = containerWidth, h = w / aspectRatio
        return { width: w, height: h, x: 0, y: (containerHeight - h) / 2 }
      }
      const h = containerHeight, w = h * aspectRatio
      return { width: w, height: h, x: (containerWidth - w) / 2, y: 0 }
    }
    if (this._objectFit === 'contain') {
      if (containerWidth / containerHeight > aspectRatio) {
        const h = containerHeight, w = h * aspectRatio
        return { width: w, height: h, x: (containerWidth - w) / 2, y: 0 }
      }
      const w = containerWidth, h = w / aspectRatio
      return { width: w, height: h, x: 0, y: (containerHeight - h) / 2 }
    }
    return { width: containerWidth, height: containerHeight, x: 0, y: 0 }
  }

  getProxy() {
    return createSchemaProxy(this, propertySchema)
  }
}
