/* Node state initialization boilerplate for constructor standardization */

export class StateInitializer {
  static initRenderingState() {
    return {
      mesh: null,
      material: null,
      geometry: null,
      sItem: null,
      handle: null,
      needsRebuild: true,
    }
  }

  static initAudioState() {
    return {
      source: null,
      gainNode: null,
      pannerNode: null,
      offset: 0,
      shouldPlay: false,
      startTime: null,
    }
  }

  static initPhysicsState() {
    return {
      actor: null,
      shape: null,
      shapes: new Set(),
      physicsForces: null,
      physicsProperties: null,
    }
  }

  static initLoadingState(tokenField = 'n') {
    return {
      [tokenField]: 0,
      _loading: true,
      instance: null,
    }
  }

  static initializeNode(node, stateConfig = {}) {
    Object.assign(node, stateConfig)
    return node
  }

  static mergeState(node, ...stateObjects) {
    for (const state of stateObjects) {
      Object.assign(node, state)
    }
    return node
  }
}
