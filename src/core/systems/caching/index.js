export { Memoizer, ComputedValue, DependencyGraph, CacheInvalidationManager } from './Memoizer.js'

let memoizer = null
let dependencyGraph = null
let invalidationManager = null

export function initializeCaching(options = {}) {
  memoizer = new Memoizer(options.memoizer || {})
  dependencyGraph = new DependencyGraph()
  invalidationManager = new CacheInvalidationManager()

  return {
    memoizer,
    dependencyGraph,
    invalidationManager
  }
}

export function getMemoizer() {
  return memoizer
}

export function getDependencyGraph() {
  return dependencyGraph
}

export function getInvalidationManager() {
  return invalidationManager
}
