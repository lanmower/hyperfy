import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('DependencyValidator')

export class DependencyValidator {
  constructor() {
    this.systemDependencies = new Map()
    this.systemMetadata = new Map()
  }

  registerSystem(name, dependencies = [], metadata = {}) {
    this.systemDependencies.set(name, new Set(dependencies))
    this.systemMetadata.set(name, {
      name,
      dependencies: Array.from(dependencies),
      ...metadata,
    })
  }

  validateGraph() {
    const errors = []
    const warnings = []

    for (const [system, deps] of this.systemDependencies.entries()) {
      const cycle = this.detectCycle(system)
      if (cycle) {
        errors.push({
          type: 'CIRCULAR_DEPENDENCY',
          system,
          cycle: cycle.join(' → '),
          severity: 'error',
        })
      }

      for (const dep of deps) {
        if (!this.systemDependencies.has(dep)) {
          warnings.push({
            type: 'MISSING_DEPENDENCY',
            system,
            dependency: dep,
            severity: 'warning',
          })
        }
      }
    }

    const unreachable = this.findUnreachableSystems()
    for (const system of unreachable) {
      warnings.push({
        type: 'UNREACHABLE_SYSTEM',
        system,
        severity: 'warning',
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      systemCount: this.systemDependencies.size,
      dependencyCount: Array.from(this.systemDependencies.values()).reduce((sum, set) => sum + set.size, 0),
    }
  }

  detectCycle(startSystem, visited = new Set(), recursionStack = new Set()) {
    if (recursionStack.has(startSystem)) {
      return Array.from(recursionStack).concat(startSystem)
    }

    if (visited.has(startSystem)) {
      return null
    }

    visited.add(startSystem)
    recursionStack.add(startSystem)

    const deps = this.systemDependencies.get(startSystem) || new Set()
    for (const dep of deps) {
      const cycle = this.detectCycle(dep, visited, new Set(recursionStack))
      if (cycle) {
        return cycle
      }
    }

    recursionStack.delete(startSystem)
    return null
  }

  findUnreachableSystems() {
    const reachable = new Set()
    const queue = Array.from(this.systemDependencies.keys())

    const visited = new Set()
    while (queue.length > 0) {
      const system = queue.shift()
      if (visited.has(system)) continue

      visited.add(system)
      reachable.add(system)

      const deps = this.systemDependencies.get(system) || new Set()
      for (const dep of deps) {
        if (!visited.has(dep)) {
          queue.push(dep)
        }
      }
    }

    return Array.from(this.systemDependencies.keys()).filter(s => !reachable.has(s))
  }

  getExecutionOrder() {
    const visited = new Set()
    const order = []

    const visit = (system) => {
      if (visited.has(system)) return
      visited.add(system)

      const deps = this.systemDependencies.get(system) || new Set()
      for (const dep of deps) {
        visit(dep)
      }

      order.push(system)
    }

    for (const system of this.systemDependencies.keys()) {
      visit(system)
    }

    return order
  }

  getDependencyGraph() {
    const graph = {}
    for (const [system, deps] of this.systemDependencies.entries()) {
      graph[system] = {
        dependencies: Array.from(deps),
        dependents: Array.from(this.systemDependencies.entries())
          .filter(([, d]) => d.has(system))
          .map(([s]) => s),
      }
    }
    return graph
  }

  getReport() {
    const validation = this.validateGraph()
    const graph = this.getDependencyGraph()
    const executionOrder = this.getExecutionOrder()

    return {
      timestamp: new Date().toISOString(),
      validation,
      graph,
      executionOrder,
      statistics: {
        totalSystems: this.systemDependencies.size,
        totalDependencies: Array.from(this.systemDependencies.values()).reduce((sum, set) => sum + set.size, 0),
        averageDependenciesPerSystem: (Array.from(this.systemDependencies.values()).reduce((sum, set) => sum + set.size, 0) / this.systemDependencies.size).toFixed(2),
        systemsWithMostDependencies: Array.from(this.systemDependencies.entries())
          .sort(([, a], [, b]) => b.size - a.size)
          .slice(0, 5)
          .map(([system, deps]) => ({ system, count: deps.size })),
      },
    }
  }

  log() {
    const report = this.getReport()
    const { validation } = report

    if (validation.valid) {
      logger.info('Dependency graph validation passed', {
        systems: validation.systemCount,
        dependencies: validation.dependencyCount,
      })
    } else {
      logger.error('Dependency graph validation failed', {
        errors: validation.errors.length,
        warnings: validation.warnings.length,
      })

      for (const error of validation.errors) {
        logger.error(`  ${error.type}: ${error.system} ${error.cycle ? `(${error.cycle})` : ''}`)
      }
    }

    for (const warning of validation.warnings.slice(0, 5)) {
      logger.warn(`  ${warning.type}: ${warning.system || warning.dependency}`)
    }

    if (validation.warnings.length > 5) {
      logger.warn(`  ... and ${validation.warnings.length - 5} more warnings`)
    }
  }
}

export const dependencyValidator = new DependencyValidator()
