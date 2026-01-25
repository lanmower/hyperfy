import Yoga from 'yoga-layout'
import { isArray, isNumber } from '../../utils/helpers/typeChecks.js'
import { Node } from '../Node.js'
import { Display, FlexDirection, JustifyContent, AlignItems, AlignContent, FlexWrap } from '../../extras/yoga.js'
import { fillRoundRect } from '../../extras/roundRect.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('UINodeBase')
const isBrowser = typeof window !== 'undefined'

export function createYogaPropertyHandlers(res) {
  return {
    display: function() { this.yogaNode?.setDisplay(Display[this._display]); this.ui?.redraw() },
    absolute: function() { this.yogaNode?.setPositionType(this._absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE); this.ui?.redraw() },
    top: function() { this.yogaNode?.setPosition(Yoga.EDGE_TOP, isNumber(this._top) ? this._top * this.ui._res : undefined); this.ui?.redraw() },
    right: function() { this.yogaNode?.setPosition(Yoga.EDGE_RIGHT, isNumber(this._right) ? this._right * this.ui._res : undefined); this.ui?.redraw() },
    bottom: function() { this.yogaNode?.setPosition(Yoga.EDGE_BOTTOM, isNumber(this._bottom) ? this._bottom * this.ui._res : undefined); this.ui?.redraw() },
    left: function() { this.yogaNode?.setPosition(Yoga.EDGE_LEFT, isNumber(this._left) ? this._left * this.ui._res : undefined); this.ui?.redraw() },
    width: function() { this.yogaNode?.setWidth(this._width === null ? undefined : this._width * this.ui._res); this.ui?.redraw() },
    height: function() { this.yogaNode?.setHeight(this._height === null ? undefined : this._height * this.ui._res); this.ui?.redraw() },
    margin: function() { applyEdgeProperty(this.yogaNode, 'setMargin', this._margin, this.ui?._res); this.ui?.redraw() },
    padding: function() { applyEdgeProperty(this.yogaNode, 'setPadding', this._padding, this.ui?._res); this.ui?.redraw() },
    flexDirection: function() { this.yogaNode?.setFlexDirection(FlexDirection[this._flexDirection]); this.ui?.redraw() },
    justifyContent: function() { this.yogaNode?.setJustifyContent(JustifyContent[this._justifyContent]); this.ui?.redraw() },
    alignItems: function() { this.yogaNode?.setAlignItems(AlignItems[this._alignItems]); this.ui?.redraw() },
    alignContent: function() { this.yogaNode?.setAlignContent(AlignContent[this._alignContent]); this.ui?.redraw() },
    flexWrap: function() { this.yogaNode?.setFlexWrap(FlexWrap[this._flexWrap]); this.ui?.redraw() },
    gap: function() { this.yogaNode?.setGap(Yoga.GUTTER_ALL, this._gap * this.ui._res); this.ui?.redraw() },
    flexBasis: function() { this.yogaNode?.setFlexBasis(this._flexBasis); this.ui?.redraw() },
    flexGrow: function() { this.yogaNode?.setFlexGrow(this._flexGrow); this.ui?.redraw() },
    flexShrink: function() { this.yogaNode?.setFlexShrink(this._flexShrink); this.ui?.redraw() },
    borderWidth: function() { this.yogaNode?.setBorder(Yoga.EDGE_ALL, this._borderWidth * this.ui._res); this.ui?.redraw() },
  }
}

export function applyEdgeProperty(yogaNode, method, value, res = 1) {
  if (!yogaNode) return
  if (isArray(value)) {
    const [top, right, bottom, left] = value
    yogaNode[method](Yoga.EDGE_TOP, top * res)
    yogaNode[method](Yoga.EDGE_RIGHT, right * res)
    yogaNode[method](Yoga.EDGE_BOTTOM, bottom * res)
    yogaNode[method](Yoga.EDGE_LEFT, left * res)
  } else {
    yogaNode[method](Yoga.EDGE_ALL, value * res)
  }
}

export function setupYogaNode(node, config = {}) {
  const yogaNode = Yoga.Node.create()
  const res = node.ui?._res ?? 1

  if (config.display !== undefined) yogaNode.setDisplay(Display[config.display])
  if (config.width !== undefined && config.width !== null) yogaNode.setWidth(config.width * res)
  if (config.height !== undefined && config.height !== null) yogaNode.setHeight(config.height * res)
  if (config.absolute !== undefined) yogaNode.setPositionType(config.absolute ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE)
  if (isNumber(config.top)) yogaNode.setPosition(Yoga.EDGE_TOP, config.top * res)
  if (isNumber(config.right)) yogaNode.setPosition(Yoga.EDGE_RIGHT, config.right * res)
  if (isNumber(config.bottom)) yogaNode.setPosition(Yoga.EDGE_BOTTOM, config.bottom * res)
  if (isNumber(config.left)) yogaNode.setPosition(Yoga.EDGE_LEFT, config.left * res)
  if (config.margin !== undefined) applyEdgeProperty(yogaNode, 'setMargin', config.margin, res)
  if (config.padding !== undefined) applyEdgeProperty(yogaNode, 'setPadding', config.padding, res)
  if (config.borderWidth !== undefined) yogaNode.setBorder(Yoga.EDGE_ALL, config.borderWidth * res)
  if (config.flexDirection !== undefined) yogaNode.setFlexDirection(FlexDirection[config.flexDirection])
  if (config.justifyContent !== undefined) yogaNode.setJustifyContent(JustifyContent[config.justifyContent])
  if (config.alignItems !== undefined) yogaNode.setAlignItems(AlignItems[config.alignItems])
  if (config.alignContent !== undefined) yogaNode.setAlignContent(AlignContent[config.alignContent])
  if (config.flexWrap !== undefined) yogaNode.setFlexWrap(FlexWrap[config.flexWrap])
  if (config.gap !== undefined) yogaNode.setGap(Yoga.GUTTER_ALL, config.gap * res)
  if (config.flexBasis !== undefined) yogaNode.setFlexBasis(config.flexBasis)
  if (config.flexGrow !== undefined) yogaNode.setFlexGrow(config.flexGrow)
  if (config.flexShrink !== undefined) yogaNode.setFlexShrink(config.flexShrink)

  return yogaNode
}

export const uiChildDefaults = {
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
  flexBasis: 'auto',
  flexGrow: 0,
  flexShrink: 1,
}

export const uiContainerDefaults = {
  ...uiChildDefaults,
  width: null,
  height: null,
  borderWidth: 0,
  borderColor: null,
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'flex-start',
  flexWrap: 'no-wrap',
  gap: 0,
}

export class UIChildNode extends Node {
  mount() {
    if (!isBrowser) return
    this.ui = this.parent?.ui
    if (!this.ui) {
      logger.error('Node must be child of UI node', { nodeName: this.name })
      return
    }
    this.yogaNode = this.createYogaNode()
    this.parent.yogaNode?.insertChild(this.yogaNode, this.parent.yogaNode.getChildCount())
    this.ui?.redraw()
  }

  createYogaNode() {
    return setupYogaNode(this, {
      display: this._display,
      absolute: this._absolute,
      top: this._top,
      right: this._right,
      bottom: this._bottom,
      left: this._left,
      margin: this._margin,
      padding: this._padding,
      flexBasis: this._flexBasis,
      flexGrow: this._flexGrow,
      flexShrink: this._flexShrink,
    })
  }

  commit() {}

  unmount() {
    if (this.ctx?.world?.network?.isServer) return
    if (this.yogaNode) {
      this.parent.yogaNode?.removeChild(this.yogaNode)
      this.yogaNode.free()
      this.yogaNode = null
      this.box = null
    }
  }

  drawBackground(ctx, left, top, width, height) {
    if (this._backgroundColor) {
      fillRoundRect(ctx, left, top, width, height, this._borderRadius * this.ui._res, this._backgroundColor)
    }
  }

  getComputedLayout(offsetLeft = 0, offsetTop = 0) {
    return {
      left: offsetLeft + this.yogaNode.getComputedLeft(),
      top: offsetTop + this.yogaNode.getComputedTop(),
      width: this.yogaNode.getComputedWidth(),
      height: this.yogaNode.getComputedHeight(),
    }
  }
}

export class UIContainerNode extends UIChildNode {
  createYogaNode() {
    return setupYogaNode(this, {
      display: this._display,
      width: this._width,
      height: this._height,
      absolute: this._absolute,
      top: this._top,
      right: this._right,
      bottom: this._bottom,
      left: this._left,
      margin: this._margin,
      padding: this._padding,
      borderWidth: this._borderWidth,
      flexDirection: this._flexDirection,
      justifyContent: this._justifyContent,
      alignItems: this._alignItems,
      alignContent: this._alignContent,
      flexWrap: this._flexWrap,
      gap: this._gap,
      flexBasis: this._flexBasis,
      flexGrow: this._flexGrow,
      flexShrink: this._flexShrink,
    })
  }
}
