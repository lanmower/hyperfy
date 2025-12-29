import { resourceLeakDetector } from './ResourceLeakDetector.js'

export class ResourceTracker {
  static trackNode(node, metadata = {}) {
    resourceLeakDetector.trackObject('Node', node, {
      type: node.constructor.name,
      name: node.name,
      ...metadata,
    })
  }

  static untrackNode(node) {
    resourceLeakDetector.untrackObject('Node', node)
  }

  static trackMaterial(material, metadata = {}) {
    resourceLeakDetector.trackObject('Material', material, {
      type: material.constructor.name,
      ...metadata,
    })
  }

  static untrackMaterial(material) {
    resourceLeakDetector.untrackObject('Material', material)
  }

  static trackGeometry(geometry, metadata = {}) {
    resourceLeakDetector.trackObject('Geometry', geometry, {
      type: geometry.constructor.name,
      ...metadata,
    })
  }

  static untrackGeometry(geometry) {
    resourceLeakDetector.untrackObject('Geometry', geometry)
  }

  static trackEntity(entity, metadata = {}) {
    resourceLeakDetector.trackObject('Entity', entity, {
      type: entity.constructor.name,
      id: entity.data?.id,
      ...metadata,
    })
  }

  static untrackEntity(entity) {
    resourceLeakDetector.untrackObject('Entity', entity)
  }

  static trackApp(app, metadata = {}) {
    resourceLeakDetector.trackObject('App', app, {
      blueprintId: app.data?.blueprint,
      id: app.data?.id,
      ...metadata,
    })
  }

  static untrackApp(app) {
    resourceLeakDetector.untrackObject('App', app)
  }

  static trackTexture(texture, metadata = {}) {
    resourceLeakDetector.trackObject('Texture', texture, {
      type: texture.constructor.name,
      ...metadata,
    })
  }

  static untrackTexture(texture) {
    resourceLeakDetector.untrackObject('Texture', texture)
  }

  static trackListener(emitter, event, handler, metadata = {}) {
    resourceLeakDetector.trackObject('Listener', handler, {
      emitterType: emitter.constructor.name,
      event,
      ...metadata,
    })
  }

  static untrackListener(emitter, event, handler) {
    resourceLeakDetector.untrackObject('Listener', handler)
  }

  static snapshot() {
    return resourceLeakDetector.snapshot()
  }

  static getReport(threshold = 10) {
    return resourceLeakDetector.getLeakReport(threshold)
  }

  static getStats() {
    return resourceLeakDetector.getStats()
  }

  static clear() {
    resourceLeakDetector.clear()
  }
}
