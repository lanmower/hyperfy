// Builder pattern for node creation with fluent API and automatic property validation

import { Props } from './Props.js'

export class NodeBuilder {
  constructor(NodeClass, type = null) {
    this.NodeClass = NodeClass
    this.type = type
    this.data = {}
    this.schema = null
  }

  // Set property value
  set(key, value) {
    this.data[key] = value
    return this
  }

  // Set multiple properties
  setAll(props) {
    Object.assign(this.data, props)
    return this
  }

  // Set position
  position(x, y = 0, z = 0) {
    this.data.position = Array.isArray(x) ? x : [x, y, z]
    return this
  }

  // Set rotation
  rotation(x, y = 0, z = 0) {
    this.data.rotation = Array.isArray(x) ? x : [x, y, z]
    return this
  }

  // Set scale
  scale(x, y = 1, z = 1) {
    this.data.scale = Array.isArray(x) ? x : [x, y, z]
    return this
  }

  // Set visibility
  visible(v = true) {
    this.data.visible = v
    return this
  }

  // Set color
  color(c) {
    this.data.color = c
    return this
  }

  // Set with schema validation
  withSchema(schema) {
    this.schema = schema
    return this
  }

  // Build the node
  build() {
    let props = this.data
    if (this.schema) {
      props = Props.validate(props, this.schema)
    }
    return new this.NodeClass(props)
  }

  // Build and add to parent
  buildIn(parent, id = null) {
    const node = this.build()
    if (id) {
      parent.add(node, id)
    } else {
      parent.add(node)
    }
    return node
  }

  // Get current data
  getData() {
    return Object.assign({}, this.data)
  }

  // Clone builder
  clone() {
    const builder = new NodeBuilder(this.NodeClass, this.type)
    builder.data = Object.assign({}, this.data)
    builder.schema = this.schema
    return builder
  }

  toString() {
    const className = this.NodeClass.name
    const propCount = Object.keys(this.data).length
    return "NodeBuilder(" + (this.type || className) + ", " + propCount + " props)"
  }
}

// Factory function for creating builders
export function builder(NodeClass, type = null) {
  return new NodeBuilder(NodeClass, type)
}
