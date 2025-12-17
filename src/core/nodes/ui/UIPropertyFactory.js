import Yoga from 'yoga-layout'
import { isArray, isNumber } from 'lodash-es'
import { Display } from '../../extras/yoga.js'

const redraw = function() { this.ui?.redraw() }
const markDirtyRedraw = function() { this.yogaNode?.markDirty(); this.ui?.redraw() }

export function createUIPropertyDescriptors() {
  return {
    display: {
      default: 'flex',
      onSet: function() {
        this.yogaNode?.setDisplay(Display[this._display])
        this.ui?.redraw()
      }
    },
    absolute: {
      default: false,
      onSet: function() {
        this.yogaNode?.setPositionType(
          this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE
        )
        this.ui?.redraw()
      }
    },
    top: {
      default: null,
      onSet: function() {
        this.yogaNode?.setPosition(
          Yoga.EDGE_TOP,
          isNumber(this._top) ? this._top * this.ui._res : undefined
        )
        this.ui?.redraw()
      }
    },
    right: {
      default: null,
      onSet: function() {
        this.yogaNode?.setPosition(
          Yoga.EDGE_RIGHT,
          isNumber(this._right) ? this._right * this.ui._res : undefined
        )
        this.ui?.redraw()
      }
    },
    bottom: {
      default: null,
      onSet: function() {
        this.yogaNode?.setPosition(
          Yoga.EDGE_BOTTOM,
          isNumber(this._bottom) ? this._bottom * this.ui._res : undefined
        )
        this.ui?.redraw()
      }
    },
    left: {
      default: null,
      onSet: function() {
        this.yogaNode?.setPosition(
          Yoga.EDGE_LEFT,
          isNumber(this._left) ? this._left * this.ui._res : undefined
        )
        this.ui?.redraw()
      }
    },
    backgroundColor: {
      default: null,
      onSet: redraw
    },
    borderRadius: {
      default: 0,
      onSet: redraw
    },
    margin: {
      default: 0,
      onSet: function() {
        if (isArray(this._margin)) {
          const [t, r, b, l] = this._margin
          this.yogaNode?.setMargin(Yoga.EDGE_TOP, t * this.ui._res)
          this.yogaNode?.setMargin(Yoga.EDGE_RIGHT, r * this.ui._res)
          this.yogaNode?.setMargin(Yoga.EDGE_BOTTOM, b * this.ui._res)
          this.yogaNode?.setMargin(Yoga.EDGE_LEFT, l * this.ui._res)
        } else {
          this.yogaNode?.setMargin(Yoga.EDGE_ALL, this._margin * this.ui._res)
        }
        this.ui?.redraw()
      }
    },
    padding: {
      default: 0,
      onSet: function() {
        if (isArray(this._padding)) {
          const [t, r, b, l] = this._padding
          this.yogaNode?.setPadding(Yoga.EDGE_TOP, t * this.ui._res)
          this.yogaNode?.setPadding(Yoga.EDGE_RIGHT, r * this.ui._res)
          this.yogaNode?.setPadding(Yoga.EDGE_BOTTOM, b * this.ui._res)
          this.yogaNode?.setPadding(Yoga.EDGE_LEFT, l * this.ui._res)
        } else {
          this.yogaNode?.setPadding(Yoga.EDGE_ALL, this._padding * this.ui._res)
        }
        this.ui?.redraw()
      }
    }
  }
}
