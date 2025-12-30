/* Unified command bus for builder operations managing entity commands, state transitions, transforms, and grab mode */

import { EntityCommandHandler } from './EntityCommandHandler.js'
import { StateTransitionHandler } from './StateTransitionHandler.js'
import { TransformHandler } from './TransformHandler.js'
import { GrabModeHandler } from './GrabModeHandler.js'

export class BuilderCommandBus {
  constructor(builder, world) {
    this.builder = builder
    this.world = world
    this.entityCommand = new EntityCommandHandler(builder, world)
    this.stateTransition = new StateTransitionHandler(builder, world)
    this.transform = new TransformHandler(builder, world)
    this.grabMode = new GrabModeHandler(builder, world)
  }

  executeEntityCommand(command) {
    return this.entityCommand.handle(command)
  }

  executeStateTransition(transition) {
    return this.stateTransition.handle(transition)
  }

  executeTransform(transformData) {
    return this.transform.handle(transformData)
  }

  executeGrabMode(mode, data) {
    return this.grabMode.handle(mode, data)
  }

  destroy() {
    this.entityCommand = null
    this.stateTransition = null
    this.transform = null
    this.grabMode = null
  }
}
