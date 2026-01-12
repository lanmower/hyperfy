import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { BuilderComposer } from './builder/BuilderComposer.js'
import { BuilderCore } from './builder/BuilderCore.js'
import { BuilderCommandBus } from './builder/BuilderCommandBus.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { EVENT } from '../constants/EventNames.js'
import { BuilderConfig } from '../config/SystemConfig.js'

export class ClientBuilder extends System {
  static DEPS = {
    controls: 'controls',
    network: 'network',
    entities: 'entities',
    ui: 'ui',
    events: 'events',
    blueprints: 'blueprints',
    rig: 'rig',
    snaps: 'snaps',
    networkRate: 'networkRate',
  }

  static EVENTS = {
    player: 'checkLocalPlayer',
    settingChanged: 'checkLocalPlayer',
  }

  constructor(world) {
    super(world)
    this.enabled = false
    this.selected = null
    this.justPointerLocked = false

    this.target = new THREE.Object3D()
    this.target.rotation.reorder('YXZ')
    this.target.limit = BuilderConfig.TRANSFORM_LIMIT

    this.core = new BuilderCore()
    this.commandBus = new BuilderCommandBus(this, world)
    this.composer = new BuilderComposer(this)
  }

  async init({ viewport }) {
    this.viewport = viewport
    this.composer.init({ world: this.world, viewport })
  }

  start() {
    this.control = this.controls.bind({ priority: ControlPriorities.BUILDER })
    this.control.mouseLeft.onPress = () => {
      if (!this.control.pointer.locked) {
        this.control.pointer.lock()
        this.justPointerLocked = true
        return true
      }
    }
    this.updateActions()
  }

  checkLocalPlayer = () => {
    if (this.enabled && !this.canBuild()) {
      this.select(null)
      this.enabled = false
      this.events.emit(EVENT.game.buildModeChanged, false)
    }
    this.updateActions()
  }

  canBuild() {
    return this.entities.player?.isBuilder()
  }

  updateActions() {
    this.composer.updateActions()
  }

  update(delta) {
    const mode = this.composer.getMode()

    if (this.control.tab.pressed) {
      this.toggle()
    }

    if (this.selected?.destroyed) {
      this.select(null)
    }

    if (this.selected && this.selected?.data.mover !== this.network.id) {
      this.select(null)
    }

    if (!this.enabled) {
      if (this.justPointerLocked) {
        this.justPointerLocked = false
      }
      return
    }

    this.composer.update(delta, mode)

    if (
      this.control.keyZ.pressed &&
      !this.control.shiftLeft.down &&
      (this.control.metaLeft.down || this.control.controlLeft.down)
    ) {
      this.undo()
    }

    if (this.justPointerLocked) {
      this.justPointerLocked = false
    }
  }

  addUndo(action) {
    this.core.pushUndo(action)
    this.composer.addUndo(action)
  }

  undo() {
    this.core.undo()
    this.composer.executeUndo()
  }

  toggle(enabled) {
    this.composer.toggle(enabled)
  }

  select(app) {
    if (app) this.core.select(app)
    else this.core.clearSelection()
    this.composer.select(app)
  }

  getMode() {
    return this.core.mode
  }

  setMode(mode) {
    this.core.setMode(mode)
    this.composer.setMode(mode)
  }

  toggleSpace() {
    this.composer.toggleSpace()
  }

  getSpaceLabel() {
    return this.composer.getSpaceLabel()
  }

  attachGizmo(app, mode) {
    this.core.setGizmo(app)
    this.composer.attachGizmo(app, mode)
  }

  detachGizmo() {
    this.core.setGizmo(null)
    this.composer.detachGizmo()
  }

  disableRotationSnap() {
    this.composer.disableRotationSnap()
  }

  enableRotationSnap() {
    this.composer.enableRotationSnap()
  }

  isGizmoActive() {
    return this.composer.isGizmoActive()
  }

  getModeLabel() {
    return this.composer.getModeLabel()
  }

  getEntityAtReticle() {
    return this.composer.getEntityAtReticle()
  }

  getEntityAtPointer() {
    return this.composer.getEntityAtPointer()
  }

  getHitAtReticle(ignoreEntity, ignorePlayers) {
    return this.composer.getHitAtReticle(ignoreEntity, ignorePlayers)
  }

  getSpawnTransform(atReticle) {
    return this.composer.getSpawnTransform(atReticle)
  }

  destroy() {
    this.composer.destroy()
    this.composer.detachGizmo()
    this.commandBus.destroy()
  }
}
