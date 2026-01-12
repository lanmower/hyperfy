
import { Props } from './Props.js'

export class NodeBuilder {
  constructor(NodeClass, type = null) {
    this.NodeClass = NodeClass
    this.type = type
    this.data = {}
    this.schema = null
  }

  set(key, value) {
    this.data[key] = value
    return this
  }

  setAll(props) {
    Object.assign(this.data, props)
    return this
  }

  position(x, y = 0, z = 0) {
    this.data.position = Array.isArray(x) ? x : [x, y, z]
    return this
  }

  rotation(x, y = 0, z = 0) {
    this.data.rotation = Array.isArray(x) ? x : [x, y, z]
    return this
  }

  scale(x, y = 1, z = 1) {
    this.data.scale = Array.isArray(x) ? x : [x, y, z]
    return this
  }

  visible(v = true) {
    this.data.visible = v
    return this
  }

  color(c) {
    this.data.color = c
    return this
  }

  withSchema(schema) {
    this.schema = schema
    return this
  }

  build() {
    let props = this.data
    if (this.schema) {
      props = Props.validate(props, this.schema)
    }
    return new this.NodeClass(props)
  }

  buildIn(parent, id = null) {
    const node = this.build()
    if (id) {
      parent.add(node, id)
    } else {
      parent.add(node)
    }
    return node
  }

  getData() {
    return Object.assign({}, this.data)
  }

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

export function builder(NodeClass, type = null) {
  return new NodeBuilder(NodeClass, type)
}
