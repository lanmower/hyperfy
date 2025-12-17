import Yoga from 'yoga-layout'
import { every, isArray, isBoolean, isNumber, isString } from 'lodash-es'
import { Node } from './Node.js'
import { Display, isDisplay } from '../extras/yoga.js'
import { fillRoundRect, imageRoundRect } from '../extras/roundRect.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { schema } from '../utils/validation/createNodeSchema.js'

const objectFits = ['contain', 'cover', 'fill']

const defaults = {
  display: 'flex',
  src: null,
  width: null,
  height: null,
  absolute: false,
  top: null,
  right: null,
  bottom: null,
  left: null,
  objectFit: 'contain',
  backgroundColor: null,
  borderRadius: 0,
  margin: 0,
}

const redraw = function() { this.ui?.redraw() }
const markDirtyRedraw = function() { this.yogaNode?.markDirty(); this.ui?.redraw() }
const propertySchema = schema('display', 'src', 'width', 'height', 'absolute', 'top', 'right', 'bottom', 'left', 'objectFit', 'backgroundColor', 'borderRadius', 'margin')
  .overrideAll({
    display: { default: defaults.display, onSet: function() { this.yogaNode?.setDisplay(Display[this._display]); this.ui?.redraw() } },
    src: { default: defaults.src, onSet: function() { if (this._src) { this.loadImage(this._src) } else { this.img = null; this.ui?.redraw() } } },
    width: { default: defaults.width, onSet: markDirtyRedraw },
    height: { default: defaults.height, onSet: markDirtyRedraw },
    absolute: { default: defaults.absolute, onSet: function() { this.yogaNode?.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE); this.ui?.redraw() } },
    top: { default: defaults.top, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined); this.ui?.redraw() } },
    right: { default: defaults.right, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined); this.ui?.redraw() } },
    bottom: { default: defaults.bottom, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined); this.ui?.redraw() } },
    left: { default: defaults.left, onSet: function() { this.yogaNode?.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined); this.ui?.redraw() } },
    objectFit: { default: defaults.objectFit, onSet: redraw },
    backgroundColor: { default: defaults.backgroundColor, onSet: redraw },
    borderRadius: { default: defaults.borderRadius, onSet: redraw },
    margin: { default: defaults.margin, onSet: function() { if (isArray(this._margin)) { const [t,r,b,l]=this._margin; this.yogaNode?.setMargin(Yoga.EDGE_TOP,t*this.ui._res); this.yogaNode?.setMargin(Yoga.EDGE_RIGHT,r*this.ui._res); this.yogaNode?.setMargin(Yoga.EDGE_BOTTOM,b*this.ui._res); this.yogaNode?.setMargin(Yoga.EDGE_LEFT,l*this.ui._res) } else { this.yogaNode?.setMargin(Yoga.EDGE_ALL,this._margin*this.ui._res) } this.ui?.redraw() } },
  })
  .build()

export class UIImage extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'uiimage'

    defineProps(this, propertySchema, data)

    this.img = null
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
    if (this.img) {
      const drawParams = this.calculateDrawParameters(this.img.width, this.img.height, width, height)
      imageRoundRect(
        ctx,
        left,
        top,
        width,
        height,
        this._borderRadius * this.ui._res,
        this.img,
        left + drawParams.x,
        top + drawParams.y,
        drawParams.width,
        drawParams.height
      )
    }
    this.box = { left, top, width, height }
  }

  mount() {
    if (this.ctx.world.network.isServer) return
    this.ui = this.parent?.ui
    if (!this.ui) return console.error('uiimage: must be child of ui node')
    this.yogaNode = Yoga.Node.create()
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
    this.yogaNode.setMeasureFunc((width, widthMode, height, heightMode) => {
      if (this._width !== null && this._height !== null) {
        return {
          width: this._width * this.ui._res,
          height: this._height * this.ui._res,
        }
      }
      if (!this.img) {
        return { width: 0, height: 0 }
      }
      const imgAspectRatio = this.img.width / this.img.height
      let finalWidth
      let finalHeight
      if (this._width !== null) {
        finalWidth = this._width * this.ui._res
        finalHeight = finalWidth / imgAspectRatio
      } else if (this._height !== null) {
        finalHeight = this._height * this.ui._res
        finalWidth = finalHeight * imgAspectRatio
      } else {
        if (widthMode === Yoga.MEASURE_MODE_EXACTLY) {
          finalWidth = width
          finalHeight = width / imgAspectRatio
        } else if (widthMode === Yoga.MEASURE_MODE_AT_MOST) {
          finalWidth = Math.min(this.img.width * this.ui._res, width)
          finalHeight = finalWidth / imgAspectRatio
        } else {
          finalWidth = this.img.width * this.ui._res
          finalHeight = this.img.height * this.ui._res
        }
        if (heightMode === Yoga.MEASURE_MODE_EXACTLY) {
          finalHeight = height
          if (this._objectFit === 'contain') {
            finalWidth = Math.min(finalWidth, height * imgAspectRatio)
          }
        } else if (heightMode === Yoga.MEASURE_MODE_AT_MOST && finalHeight > height) {
          finalHeight = height
          finalWidth = height * imgAspectRatio
        }
      }
      return { width: finalWidth, height: finalHeight }
    })
    this.parent.yogaNode.insertChild(this.yogaNode, this.parent.yogaNode.getChildCount())
    if (this._src && !this.img) {
      this.loadImage(this._src)
    }
    this.ui?.redraw()
  }

  commit() {
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    if (this.yogaNode) {
      this.parent.yogaNode?.removeChild(this.yogaNode)
      this.yogaNode.free()
      this.yogaNode = null
      this.box = null
      this.img = null
      this.ui?.redraw()
    }
  }

  async loadImage(src) {
    if (!this.ctx?.world) return
    const url = this.ctx.world.resolveURL(src)
    this.img = this.ctx.world.loader.get('image', url)
    if (!this.img) {
      this.img = await this.ctx.world.loader.load('image', url)
    }
    if (!this.ui) return
    this.yogaNode?.markDirty()
    this.ui?.redraw()
  }

  calculateDrawParameters(imgWidth, imgHeight, containerWidth, containerHeight) {
    const aspectRatio = imgWidth / imgHeight
    switch (this._objectFit) {
      case 'cover': {
        if (containerWidth / containerHeight > aspectRatio) {
          const width = containerWidth
          const height = width / aspectRatio
          return {
            width,
            height,
            x: 0,
            y: (containerHeight - height) / 2,
          }
        } else {
          const height = containerHeight
          const width = height * aspectRatio
          return {
            width,
            height,
            x: (containerWidth - width) / 2,
            y: 0,
          }
        }
      }
      case 'contain': {
        if (containerWidth / containerHeight > aspectRatio) {
          const height = containerHeight
          const width = height * aspectRatio
          return {
            width,
            height,
            x: (containerWidth - width) / 2,
            y: 0,
          }
        } else {
          const width = containerWidth
          const height = width / aspectRatio
          return {
            width,
            height,
            x: 0,
            y: (containerHeight - height) / 2,
          }
        }
      }
      case 'fill':
      default:
        return {
          width: containerWidth,
          height: containerHeight,
          x: 0,
          y: 0,
        }
    }
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}

function isObjectFit(value) {
  return objectFits.includes(value)
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
