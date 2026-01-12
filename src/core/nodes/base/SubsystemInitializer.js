/* Consolidates node subsystem initialization pattern for 20+ node types */

export class SubsystemInitializer {
  constructor(node) {
    this.node = node
    this.subsystems = []
  }

  add(name, factory) {
    if (typeof factory !== 'function') throw new Error(`[SubsystemInitializer] ${name} factory must be function`)
    const instance = factory(this.node)
    this.node[name] = instance
    this.subsystems.push({ name, instance })
    return this
  }

  async initializeAsync(name, asyncFactory) {
    if (typeof asyncFactory !== 'function') throw new Error(`[SubsystemInitializer] ${name} async factory must be function`)
    const instance = await asyncFactory(this.node)
    this.node[name] = instance
    this.subsystems.push({ name, instance })
    return this
  }

  cleanup() {
    for (const { instance } of this.subsystems) {
      instance?.cleanup?.()
      instance?.destroy?.()
      instance?.release?.()
      instance?.dispose?.()
    }
    this.subsystems = []
  }

  get(name) {
    return this.node[name]
  }
}
