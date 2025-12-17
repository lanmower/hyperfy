import { every, isArray, isNumber } from 'lodash-es'
import { UIContainerNode, uiContainerDefaults, createYogaPropertyHandlers } from './base/UINodeBase.js'
import { fillRoundRect } from '../extras/roundRect.js'
import { borderRoundRect } from '../extras/borderRoundRect.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { schema } from '../utils/validation/createNodeSchema.js'

const defaults = uiContainerDefaults

const redraw = function() { this.ui?.redraw() }
const handlers = createYogaPropertyHandlers()

const propertySchema = schema('display', 'width', 'height', 'absolute', 'top', 'right', 'bottom', 'left', 'backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'margin', 'padding', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent', 'flexWrap', 'gap', 'flexBasis', 'flexGrow', 'flexShrink')
  .overrideAll({
    display: { default: defaults.display, onSet: handlers.display },
    width: { default: defaults.width, onSet: handlers.width },
    height: { default: defaults.height, onSet: handlers.height },
    absolute: { default: defaults.absolute, onSet: handlers.absolute },
    top: { default: defaults.top, onSet: handlers.top },
    right: { default: defaults.right, onSet: handlers.right },
    bottom: { default: defaults.bottom, onSet: handlers.bottom },
    left: { default: defaults.left, onSet: handlers.left },
    backgroundColor: { default: defaults.backgroundColor, onSet: redraw },
    borderWidth: { default: defaults.borderWidth, onSet: handlers.borderWidth },
    borderColor: { default: defaults.borderColor, onSet: redraw },
    borderRadius: { default: defaults.borderRadius, onSet: redraw },
    margin: { default: defaults.margin, onSet: handlers.margin },
    padding: { default: defaults.padding, onSet: handlers.padding },
    flexDirection: { default: defaults.flexDirection, onSet: handlers.flexDirection },
    justifyContent: { default: defaults.justifyContent, onSet: handlers.justifyContent },
    alignItems: { default: defaults.alignItems, onSet: handlers.alignItems },
    alignContent: { default: defaults.alignContent, onSet: handlers.alignContent },
    flexWrap: { default: defaults.flexWrap, onSet: handlers.flexWrap },
    gap: { default: defaults.gap, onSet: handlers.gap },
    flexBasis: { default: defaults.flexBasis, onSet: handlers.flexBasis },
    flexGrow: { default: defaults.flexGrow, onSet: handlers.flexGrow },
    flexShrink: { default: defaults.flexShrink, onSet: handlers.flexShrink },
  })
  .build()

export class UIView extends UIContainerNode {
  constructor(data = {}) {
    super(data)
    this.name = 'uiview'
    defineProps(this, propertySchema, data)
  }

  draw(ctx, offsetLeft, offsetTop) {
    if (this._display === 'none') return
    const { left, top, width, height } = this.getComputedLayout(offsetLeft, offsetTop)

    if (this._backgroundColor) {
      const inset = this._borderColor && this._borderWidth ? 0.5 * this.ui._res : 0
      const radius = Math.max(0, this._borderRadius * this.ui._res - inset)
      fillRoundRect(ctx, left + inset, top + inset, width - inset * 2, height - inset * 2, radius, this._backgroundColor)
    }

    if (this._borderWidth && this._borderColor) {
      const radius = this._borderRadius * this.ui._res
      const thickness = this._borderWidth * this.ui._res
      ctx.strokeStyle = this._borderColor
      ctx.lineWidth = thickness
      if (this._borderRadius) {
        borderRoundRect(ctx, left, top, width, height, radius, thickness)
      } else {
        ctx.strokeRect(left + thickness / 2, top + thickness / 2, width - thickness, height - thickness)
      }
    }

    this.box = { left, top, width, height }
    this.children.forEach(child => child.draw(ctx, left, top))
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}
