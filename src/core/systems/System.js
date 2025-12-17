import EventEmitter from 'eventemitter3'

export class System extends EventEmitter {
  constructor(world) {
    super()
    this.world = world
  }

  getService(name) {
    if (this.world.di?.has?.(name)) {
      return this.world.di.get(name)
    }
    return this.world[name]
  }

  async init() {
  }

  start() {
  }

  preTick() {
  }

  preFixedUpdate(willFixedStep) {
  }

  fixedUpdate(delta) {
  }

  postFixedUpdate() {
  }

  preUpdate(alpha) {
  }

  update(delta) {
  }

  postUpdate() {
  }

  lateUpdate(delta) {
  }

  postLateUpdate() {
  }

  commit() {
  }

  postTick() {
  }

  destroy() {
  }
}
