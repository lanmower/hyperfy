export class PerformanceBudget {
  static FRAME_BUDGETS = {
    world: {
      phase: 1.0,
      total: 16.67,
    },
    preTick: 0.5,
    preFixedUpdate: 0.5,
    fixedUpdate: 3.0,
    postFixedUpdate: 0.5,
    preUpdate: 0.5,
    update: 3.0,
    postUpdate: 0.5,
    lateUpdate: 3.0,
    postLateUpdate: 1.0,
    commit: 2.0,
    postTick: 0.5,
  }

  static SYSTEM_BUDGETS = {
    preTick: {
      clientGraphics: 0.1,
      animation: 0.2,
      physics: 0.2,
    },
    fixedUpdate: {
      physics: 2.0,
    },
    update: {
      clientNetwork: 0.5,
      controls: 0.3,
      animation: 0.2,
      builder: 0.5,
    },
    lateUpdate: {
      clientGraphics: 0.5,
      stage: 0.3,
      animation: 0.2,
    },
    postLateUpdate: {
      stage: 0.5,
    },
  }

  static ENTITY_BUDGETS = {
    hotIteration: {
      count: 50,
      timePerEntity: 0.02,
    },
    playerLocal: {
      fixedUpdate: 0.5,
      update: 0.3,
      lateUpdate: 0.3,
    },
  }

  static INIT_BUDGETS = {
    world: 5000,
    entitySpawn: 100,
    blueprintLoad: 2000,
    snapshotProcess: 500,
    systemInit: {
      clientLoader: 2000,
      clientGraphics: 1000,
      stage: 500,
      physx: 1000,
    },
  }

  static NETWORK_BUDGETS = {
    packetProcess: 50,
    handlerProcess: {
      entityAdded: 100,
      entityModified: 20,
      snapshot: 500,
      chatAdded: 10,
      blueprintModified: 50,
    },
    upload: 30000,
    assetPreload: 2000,
  }

  static ASSET_BUDGETS = {
    modelLoad: 2000,
    textureLoad: 500,
    scriptLoad: 100,
    avatarLoad: 1000,
    emoteLoad: 500,
  }

  static BUDGETS = {
    FRAME: this.FRAME_BUDGETS,
    SYSTEM: this.SYSTEM_BUDGETS,
    ENTITY: this.ENTITY_BUDGETS,
    INIT: this.INIT_BUDGETS,
    NETWORK: this.NETWORK_BUDGETS,
    ASSET: this.ASSET_BUDGETS,
  }

  static getBudget(category, path) {
    const categoryBudgets = this.BUDGETS[category]
    if (!categoryBudgets) return null

    const keys = path.split('.')
    let current = categoryBudgets

    for (const key of keys) {
      current = current?.[key]
      if (current === undefined) return null
    }

    return current
  }

  static isBudgetExceeded(category, path, actualTime) {
    const budget = this.getBudget(category, path)
    if (budget === null) return false

    return actualTime > budget
  }

  static getExcessAmount(category, path, actualTime) {
    const budget = this.getBudget(category, path)
    if (budget === null) return 0

    return Math.max(0, actualTime - budget)
  }

  static getExcessPercentage(category, path, actualTime) {
    const budget = this.getBudget(category, path)
    if (budget === null || budget === 0) return 0

    return ((actualTime - budget) / budget) * 100
  }
}
