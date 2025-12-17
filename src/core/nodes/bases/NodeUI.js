

import { Node } from '../Node.js'

export class NodeUI extends Node {
  constructor(data = {}) {
    super(data)

    this.width = data.width || 100
    this.height = data.height || 100
    this.padding = data.padding || 0
    this.margin = data.margin || 0
    this.zIndex = data.zIndex || 0

    this.layout = data.layout || 'flex'
    this.flexDirection = data.flexDirection || 'row'
    this.justifyContent = data.justifyContent || 'flex-start'
    this.alignItems = data.alignItems || 'flex-start'

    this.interactive = data.interactive !== false
    this.hovered = false
    this.pressed = false
    this.disabled = data.disabled || false

    this.backgroundColor = data.backgroundColor || null
    this.borderColor = data.borderColor || null
    this.borderRadius = data.borderRadius || 0
    this.opacity = data.opacity !== undefined ? data.opacity : 1

    this.onClick = data.onClick || null
    this.onHover = data.onHover || null
    this.onPress = data.onPress || null
  }

  
  setSize(width, height) {
    this.width = width
    this.height = height
  }

  
  setLayout(direction, justify, align) {
    this.flexDirection = direction
    this.justifyContent = justify
    this.alignItems = align
  }

  
  setInteractive(enabled) {
    this.interactive = enabled
  }

  
  setDisabled(disabled) {
    this.disabled = disabled
  }

  
  setBackgroundColor(color) {
    this.backgroundColor = color
  }

  
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity))
  }

  
  click(event = {}) {
    if (this.disabled || !this.interactive) return
    if (this.onClick) this.onClick(event)
  }

  
  hover(hovering) {
    this.hovered = hovering
    if (this.onHover) this.onHover(hovering)
  }

  
  toJSON() {
    return {
      ...super.toJSON(),
      width: this.width,
      height: this.height,
      layout: this.layout,
      flexDirection: this.flexDirection,
      justifyContent: this.justifyContent,
      alignItems: this.alignItems,
      backgroundColor: this.backgroundColor,
      opacity: this.opacity,
      interactive: this.interactive,
      disabled: this.disabled,
    }
  }
}
