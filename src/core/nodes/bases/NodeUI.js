/**
 * NodeUI - Base class for UI nodes
 *
 * Extends Node with UI-specific properties and methods.
 * Used as parent for UI, UIText, UIImage, UIView, etc.
 *
 * Provides:
 * - Layout properties
 * - Event handling (click, hover, etc.)
 * - Interactive state management
 * - Styling properties
 */

import { Node } from '../Node.js'

export class NodeUI extends Node {
  constructor(data = {}) {
    super(data)

    // UI-specific properties
    this.width = data.width || 100
    this.height = data.height || 100
    this.padding = data.padding || 0
    this.margin = data.margin || 0
    this.zIndex = data.zIndex || 0

    // Layout
    this.layout = data.layout || 'flex'
    this.flexDirection = data.flexDirection || 'row'
    this.justifyContent = data.justifyContent || 'flex-start'
    this.alignItems = data.alignItems || 'flex-start'

    // Interactive state
    this.interactive = data.interactive !== false
    this.hovered = false
    this.pressed = false
    this.disabled = data.disabled || false

    // Styling
    this.backgroundColor = data.backgroundColor || null
    this.borderColor = data.borderColor || null
    this.borderRadius = data.borderRadius || 0
    this.opacity = data.opacity !== undefined ? data.opacity : 1

    // Event handlers
    this.onClick = data.onClick || null
    this.onHover = data.onHover || null
    this.onPress = data.onPress || null
  }

  /**
   * Set dimensions
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    this.width = width
    this.height = height
  }

  /**
   * Set layout properties
   * @param {string} direction - Flex direction
   * @param {string} justify - Justify content
   * @param {string} align - Align items
   */
  setLayout(direction, justify, align) {
    this.flexDirection = direction
    this.justifyContent = justify
    this.alignItems = align
  }

  /**
   * Enable/disable UI interaction
   * @param {boolean} enabled - Interactive state
   */
  setInteractive(enabled) {
    this.interactive = enabled
  }

  /**
   * Set disabled state
   * @param {boolean} disabled - Disabled state
   */
  setDisabled(disabled) {
    this.disabled = disabled
  }

  /**
   * Set background color
   * @param {string|number} color - CSS color or hex number
   */
  setBackgroundColor(color) {
    this.backgroundColor = color
  }

  /**
   * Set opacity
   * @param {number} opacity - Opacity 0-1
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity))
  }

  /**
   * Trigger click handler
   * @param {Object} event - Click event data
   */
  click(event = {}) {
    if (this.disabled || !this.interactive) return
    if (this.onClick) this.onClick(event)
  }

  /**
   * Trigger hover handler
   * @param {boolean} hovering - Is hovering
   */
  hover(hovering) {
    this.hovered = hovering
    if (this.onHover) this.onHover(hovering)
  }

  /**
   * Get UI properties as JSON
   * @returns {Object} JSON representation
   */
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
