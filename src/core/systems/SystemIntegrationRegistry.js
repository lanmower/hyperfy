import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('SystemIntegrationRegistry')

export class SystemIntegrationRegistry {
  constructor(world) {
    this.world = world
    this.dependencies = new Map()
    this.resolved = new Set()
    this.failures = []
  }

  registerDependency(name, dependencies, resolveFn) {
    this.dependencies.set(name, {
      dependencies: Array.isArray(dependencies) ? dependencies : [dependencies],
      resolveFn
    })
  }

  async resolve() {
    this.resolved.clear()
    this.failures = []
    const order = this.topologicalSort()
    for (const name of order) {
      const dep = this.dependencies.get(name)
      try {
        await dep.resolveFn(this.world)
        this.resolved.add(name)
        logger.debug('Dependency resolved', { name })
      } catch (error) {
        this.failures.push({ name, error: error.message })
        logger.error('Dependency resolution failed', { name, error: error.message })
      }
    }
    return {
      resolved: Array.from(this.resolved),
      failures: this.failures,
      success: this.failures.length === 0
    }
  }

  topologicalSort() {
    const visited = new Set()
    const visiting = new Set()
    const result = []
    const visit = (name) => {
      if (visited.has(name)) return
      if (visiting.has(name)) {
        logger.warn('Circular dependency detected', { name })
        return
      }
      visiting.add(name)
      const dep = this.dependencies.get(name)
      if (dep) {
        for (const depName of dep.dependencies) {
          if (this.dependencies.has(depName)) {
            visit(depName)
          }
        }
      }
      visiting.delete(name)
      visited.add(name)
      result.push(name)
    }
    for (const name of this.dependencies.keys()) {
      visit(name)
    }
    return result
  }

  getDependencyGraph() {
    const graph = {}
    for (const [name, dep] of this.dependencies) {
      graph[name] = dep.dependencies
    }
    return graph
  }
}
