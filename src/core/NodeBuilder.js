// Node builder - unified node creation and property management

import { Props, propSchema } from './Props.js'

export class NodeBuilder {
  static create(NodeClass, properties = {}) {
    const node = new NodeClass()

    if (properties && typeof properties === 'object') {
      this.setProperties(node, properties)
    }

    return node
  }

  static setProperties(node, properties) {
    for (const [key, value] of Object.entries(properties)) {
      if (Props[key]) {
        node[key] = value
      }
    }
  }

  static getSchema(NodeClass, keys = null) {
    if (keys && Array.isArray(keys)) {
      return propSchema(keys)
    }

    return nodeSchemas[NodeClass.name] || {}
  }

  static validate(properties, schema) {
    const errors = {}

    for (const [key, spec] of Object.entries(schema)) {
      const value = properties[key]

      if (spec.validate && value !== undefined) {
        const error = spec.validate(value)
        if (error) errors[key] = error
      }
    }

    return errors
  }

  static merge(baseProps, overrides) {
    return { ...baseProps, ...overrides }
  }

  static clone(node, modifications = {}) {
    const props = {}

    for (const key of Object.keys(Props)) {
      if (key in node) {
        props[key] = node[key]
      }
    }

    return this.create(node.constructor, this.merge(props, modifications))
  }
}

const nodeSchemas = {
  Mesh: propSchema(['type', 'width', 'height', 'depth', 'radius', 'color', 'metalness', 'roughness', 'emissive', 'castShadow', 'receiveShadow']),
  Image: propSchema(['src', 'fit', 'pivot', 'lit', 'doubleside']),
  Video: propSchema(['src', 'screenId', 'aspect', 'volume', 'loop', 'group', 'spatial']),
  Audio: propSchema(['src', 'volume', 'loop', 'group', 'spatial', 'distanceModel', 'maxDistance']),
  RigidBody: propSchema(['mass', 'linearDamping', 'angularDamping', 'staticFriction', 'dynamicFriction', 'restitution']),
  Collider: propSchema(['type', 'width', 'height', 'depth', 'radius', 'trigger', 'convex']),
  Joint: propSchema(['type', 'limitMin', 'limitMax', 'limitStiffness', 'limitDamping', 'breakForce', 'breakTorque']),
  UI: propSchema(['space', 'width', 'height', 'size', 'res', 'lit', 'doubleside', 'billboard', 'pointerEvents', 'transparent']),
  UIView: propSchema(['display', 'width', 'height', 'absolute', 'top', 'right', 'bottom', 'left', 'backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'margin', 'padding', 'flexDirection', 'justifyContent', 'alignItems', 'gap']),
  UIText: propSchema(['value', 'fontSize', 'color', 'lineHeight', 'textAlign', 'fontFamily', 'fontWeight', 'absolute', 'top', 'right', 'bottom', 'left', 'margin', 'padding']),
  UIImage: propSchema(['src', 'objectFit', 'width', 'height', 'absolute', 'top', 'right', 'bottom', 'left', 'margin', 'padding']),
  Particles: propSchema(['emitting', 'shape', 'rate', 'duration', 'max', 'life', 'speed', 'color', 'image', 'force']),
  Sky: propSchema(['bg', 'hdr', 'rotationY', 'sunDirection', 'sunIntensity', 'sunColor', 'fogNear', 'fogFar', 'fogColor']),
  Avatar: propSchema(['src', 'emote', 'visible']),
  Action: propSchema(['label', 'distance', 'duration']),
  Nametag: propSchema(['label', 'health']),
  Group: propSchema(['visible', 'active']),
}
