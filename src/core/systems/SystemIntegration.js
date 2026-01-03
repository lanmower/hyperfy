import { StructuredLogger } from '../utils/logging/index.js'
import { SystemIntegrationRegistry } from './SystemIntegrationRegistry.js'
import { SystemIntegrationVerifier, HealthMonitor } from './SystemIntegrationLifecycle.js'

const logger = new StructuredLogger('SystemIntegration')

export class SystemIntegration {
  constructor(world) {
    this.world = world
    this.registry = new SystemIntegrationRegistry(world)
    this.verifier = new SystemIntegrationVerifier(world)
    this.healthMonitor = new HealthMonitor(world)
  }

  registerDependency(name, dependencies, resolveFn) {
    this.registry.registerDependency(name, dependencies, resolveFn)
  }

  async resolveDependencies() {
    return this.registry.resolve()
  }

  registerCheck(name, checkFn, options = {}) {
    this.verifier.registerCheck(name, checkFn, options)
  }

  async verify() {
    return this.verifier.verify()
  }

  registerHealthCheck(name, checkFn, options = {}) {
    this.healthMonitor.registerHealthCheck(name, checkFn, options)
  }

  async checkHealth() {
    return this.healthMonitor.checkHealth()
  }

  getHealthStatus() {
    return this.healthMonitor.getStatus()
  }

  getVerificationResults() {
    return this.verifier.getLatestResults()
  }

  getDependencyGraph() {
    return this.registry.getDependencyGraph()
  }

  destroy() {
    this.registry = null
    this.verifier = null
    this.healthMonitor = null
  }
}

export { SystemIntegrationRegistry, SystemIntegrationVerifier, HealthMonitor }
