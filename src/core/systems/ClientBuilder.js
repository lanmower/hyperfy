import * as THREE from '../extras/three.js'
import { isBoolean } from 'lodash-es'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

import { System } from './System.js'
import { uuid } from '../utils-client.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { EVENT } from '../constants/EventNames.js'
import { ACTION_CONFIGS, MODE_LABELS } from './builder/ActionConfigs.js'
import { UndoManager } from './builder/UndoManager.js'
import { ModeManager } from './builder/ModeManager.js'
import { GizmoManager } from './builder/GizmoManager.js'
import { FileDropHandler } from './builder/FileDropHandler.js'
import { SelectionManager } from './builder/SelectionManager.js'
import { TransformHandler } from './builder/TransformHandler.js'
import { RaycastUtilities } from './builder/RaycastUtilities.js'
import { SpawnTransformCalculator } from './builder/SpawnTransformCalculator.js'
import { BuilderActions } from './builder/BuilderActions.js'

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
    this.target.limit = 50

    this.undoManager = new UndoManager()
    this.modeManager = new ModeManager()
    this.gizmoManager = null
    this.fileDropHandler = null
    this.selectionManager = new SelectionManager(this)
    this.transformHandler = new TransformHandler(this)
    this.raycastUtilities = new RaycastUtilities(this)
    this.spawnTransformCalculator = new SpawnTransformCalculator(this)
    this.builderActions = new BuilderActions(this)
  }

  async init({ viewport }) {
    this.viewport = viewport
    this.gizmoManager = new GizmoManager(this.world, viewport)
    this.fileDropHandler = new FileDropHandler(this)
    this.viewport.addEventListener('dragover', this.fileDropHandler.onDragOver)
    this.viewport.addEventListener('dragenter', this.fileDropHandler.onDragEnter)
    this.viewport.addEventListener('dragleave', this.fileDropHandler.onDragLeave)
    this.viewport.addEventListener('drop', this.fileDropHandler.onDrop)
  }

  start() {
    this.control = this.controls.bind({ priority: ControlPriorities.BUILDER })
    this.control.mouseLeft.onPress = () => {
      if (!this.control.pointer.locked) {
        this.control.pointer.lock()
        this.justPointerLocked = true
        return true // capture
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
    this.builderActions.updateActions()
  }

  update(delta) {
    const mode = this.modeManager.getMode()

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
      return
    }

    this._handleInspect()

    this._handleUnlink()

    this._handlePin()

    this.builderActions.handleSpaceToggle(mode)
    this.builderActions.handleModeKeyPress()

    this._handleSelection(delta, mode)

    this._handleModeUpdates(delta, mode)

    this._sendSelectedUpdates(delta)

    if (this.justPointerLocked) {
      this.justPointerLocked = false
    }
  }

  _handleInspect() {
    this.selectionManager.handleInspect()
  }

  _handleUnlink() {
    this.selectionManager.handleUnlink()
  }

  _handlePin() {
    this.selectionManager.handlePin()
  }

  _handleSelection(delta, mode) {
    this.selectionManager.handleSelection(delta, mode)

    if (
      this.control.keyZ.pressed &&
      !this.control.shiftLeft.down &&
      (this.control.metaLeft.down || this.control.controlLeft.down)
    ) {
      this.undo()
    }
  }

  _handleModeUpdates(delta, mode) {
    this.transformHandler.handleModeUpdates(delta, mode)
  }

  _sendSelectedUpdates(delta) {
    this.transformHandler.sendSelectedUpdates(delta)
  }

  addUndo(action) {
    this.undoManager.addUndo(action)
  }

  undo() {
    const result = this.undoManager.undo()
    if (!result) return
    if (this.selected) this.select(null)
    if (result.type === 'add-entity') {
      this.entities.add(result.data, true)
      return
    }
    if (result.type === 'move-entity') {
      const entity = this.entities.get(result.entityId)
      if (!entity) return
      entity.data.position = result.position
      entity.data.quaternion = result.quaternion
      this.network.send('entityModified', {
        id: result.entityId,
        position: entity.data.position,
        quaternion: entity.data.quaternion,
        scale: entity.data.scale,
      })
      entity.build()
      return
    }
    if (result.type === 'remove-entity') {
      const entity = this.entities.get(result.entityId)
      if (!entity) return
      entity.destroy(true)
      return
    }
  }

  toggle(enabled) {
    if (!this.canBuild()) return
    enabled = isBoolean(enabled) ? enabled : !this.enabled
    if (this.enabled === enabled) return
    this.enabled = enabled
    if (!this.enabled) this.select(null)
    this.updateActions()
    this.events.emit(EVENT.game.buildModeChanged, enabled)
  }

  select(app) {
    if (this.selected === app) return

    if (this.selected && this.selected !== app) {
      if (!this.selected.dead && this.selected.data.mover === this.network.id) {
        const selected = this.selected
        selected.data.mover = null
        selected.data.position = selected.root.position.toArray()
        selected.data.quaternion = selected.root.quaternion.toArray()
        selected.data.scale = selected.root.scale.toArray()
        selected.data.state = {}
        this.network.send('entityModified', {
          id: selected.data.id,
          mover: null,
          position: selected.data.position,
          quaternion: selected.data.quaternion,
          scale: selected.data.scale,
          state: selected.data.state,
        })
        selected.build()
      }
      this.selected = null
      const mode = this.modeManager.getMode()
      if (mode === 'grab') {
        this.control.keyC.capture = false
        this.control.scrollDelta.capture = false
      }
      if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
        this.detachGizmo()
      }
    }

    if (app) {
      this.addUndo({
        name: 'move-entity',
        entityId: app.data.id,
        position: app.data.position.slice(),
        quaternion: app.data.quaternion.slice(),
        scale: app.data.scale.slice(),
      })
      if (app.data.mover !== this.network.id) {
        app.data.mover = this.network.id
        app.build()
        this.network.send('entityModified', { id: app.data.id, mover: app.data.mover })
      }
      this.selected = app
      const mode = this.modeManager.getMode()
      if (mode === 'grab') {
        this.control.keyC.capture = true
        this.control.scrollDelta.capture = true
        this.target.position.copy(app.root.position)
        this.target.quaternion.copy(app.root.quaternion)
        this.target.scale.copy(app.root.scale)
        this.target.limit = PROJECT_MAX
      }
      if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
        this.attachGizmo(app, mode)
      }
    }

    this.updateActions()
  }

  getMode() {
    return this.modeManager.getMode()
  }

  setMode(mode) {
    if (this.selected) {
      const currentMode = this.modeManager.getMode()
      if (currentMode === 'grab') {
        this.control.keyC.capture = false
        this.control.scrollDelta.capture = false
      }
      if (currentMode === 'translate' || currentMode === 'rotate' || currentMode === 'scale') {
        this.detachGizmo()
      }
    }

    this.modeManager.setMode(mode)

    if (mode === 'grab') {
      if (this.selected) {
        this.control.keyC.capture = true
        this.control.scrollDelta.capture = true
        this.target.position.copy(this.selected.root.position)
        this.target.quaternion.copy(this.selected.root.quaternion)
        this.target.scale.copy(this.selected.root.scale)
        this.target.limit = PROJECT_MAX
      }
    }

    if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
      if (this.selected) {
        this.attachGizmo(this.selected, mode)
      }
    }

    this.updateActions()
  }

  toggleSpace() {
    this.transformHandler.toggleSpace()
  }

  getSpaceLabel() {
    return this.transformHandler.getSpaceLabel()
  }

  attachGizmo(app, mode) {
    this.transformHandler.attachGizmo(app, mode)
  }

  detachGizmo() {
    this.transformHandler.detachGizmo()
  }

  disableRotationSnap() {
    this.transformHandler.disableRotationSnap()
  }

  enableRotationSnap() {
    this.transformHandler.enableRotationSnap()
  }

  isGizmoActive() {
    return this.transformHandler.isActive()
  }

  getModeLabel() {
    return this.modeManager.getModeLabel()
  }

  getEntityAtReticle() {
    return this.raycastUtilities.getEntityAtReticle()
  }

  getEntityAtPointer() {
    return this.raycastUtilities.getEntityAtPointer()
  }

  getHitAtReticle(ignoreEntity, ignorePlayers) {
    return this.raycastUtilities.getHitAtReticle(ignoreEntity, ignorePlayers)
  }

  getSpawnTransform(atReticle) {
    return this.spawnTransformCalculator.calculate(atReticle)
  }

  destroy() {
    this.viewport.removeEventListener('dragover', this.fileDropHandler.onDragOver)
    this.viewport.removeEventListener('dragenter', this.fileDropHandler.onDragEnter)
    this.viewport.removeEventListener('dragleave', this.fileDropHandler.onDragLeave)
    this.viewport.removeEventListener('drop', this.fileDropHandler.onDrop)
    this.detachGizmo()
  }
}
