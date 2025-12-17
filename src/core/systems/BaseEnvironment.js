import { System } from './System.js'

export class BaseEnvironment extends System {
  constructor(world) {
    super(world)
    this.model = null
  }
}
