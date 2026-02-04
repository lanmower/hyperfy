import { isArray } from '../../utils/helpers/typeChecks.js'
import Yoga from 'yoga-layout'
import {
  AlignContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
  JustifyContent,
} from '../../extras/yoga.js'

export class UILayoutManager {
  constructor(parent) {
    this.parent = parent
  }

  createYogaNode() {
    const p = this.parent
    const yogaNode = Yoga.Node.create()
    yogaNode.setWidth(p._width * p._res)
    yogaNode.setHeight(p._height * p._res)
    yogaNode.setBorder(Yoga.EDGE_ALL, p._borderWidth * p._res)
    this.applyPadding(yogaNode)
    yogaNode.setFlexDirection(FlexDirection[p._flexDirection])
    yogaNode.setJustifyContent(JustifyContent[p._justifyContent])
    yogaNode.setAlignItems(AlignItems[p._alignItems])
    yogaNode.setAlignContent(AlignContent[p._alignContent])
    yogaNode.setFlexWrap(FlexWrap[p._flexWrap])
    yogaNode.setGap(Yoga.GUTTER_ALL, p._gap * p._res)
    return yogaNode
  }

  applyPadding(yogaNode) {
    const p = this.parent
    if (isArray(p._padding)) {
      const [top, right, bottom, left] = p._padding
      yogaNode.setPadding(Yoga.EDGE_TOP, top * p._res)
      yogaNode.setPadding(Yoga.EDGE_RIGHT, right * p._res)
      yogaNode.setPadding(Yoga.EDGE_BOTTOM, bottom * p._res)
      yogaNode.setPadding(Yoga.EDGE_LEFT, left * p._res)
    } else {
      yogaNode.setPadding(Yoga.EDGE_ALL, p._padding * p._res)
    }
  }

  updateWidth(yogaNode) {
    yogaNode?.setWidth(this.parent._width * this.parent._res)
  }

  updateHeight(yogaNode) {
    yogaNode?.setHeight(this.parent._height * this.parent._res)
  }

  updateFlexDirection(yogaNode) {
    yogaNode?.setFlexDirection(FlexDirection[this.parent._flexDirection])
  }

  updateJustifyContent(yogaNode) {
    yogaNode?.setJustifyContent(JustifyContent[this.parent._justifyContent])
  }

  updateAlignItems(yogaNode) {
    yogaNode?.setAlignItems(AlignItems[this.parent._alignItems])
  }

  updateAlignContent(yogaNode) {
    yogaNode?.setAlignContent(AlignContent[this.parent._alignContent])
  }

  updateFlexWrap(yogaNode) {
    yogaNode?.setFlexWrap(FlexWrap[this.parent._flexWrap])
  }

  updateGap(yogaNode) {
    yogaNode?.setGap(Yoga.GUTTER_ALL, this.parent._gap * this.parent._res)
  }

  updatePadding(yogaNode) {
    this.applyPadding(yogaNode)
  }
}
