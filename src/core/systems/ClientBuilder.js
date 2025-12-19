import * as THREE from '../extras/three.js'
import { isBoolean } from 'lodash-es'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

import { System } from './System.js'
import { uuid } from '../utils-client.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { EVENT } from '../constants/EventNames.js'
import { ACTION_CONFIGS, MODE_LABELS } from './builder/ActionConfigs.js'
import { UndoManager } from './builder/UndoManager.js'
import { ModeManager } from './builder/ModeManager.js'
import { GizmoManager } from './builder/GizmoManager.js'
import { FileDropHandler } from './builder/FileDropHandler.js'
import { SelectionManager } from './builder/SelectionManager.js'
import { TransformHandler } from './builder/TransformHandler.js'

const SNAP_DISTANCE = 1
const SNAP_DEGREES = 5

const e1 = new THREE.Euler()
const q1 = new THREE.Quaternion()

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
    const mode = this.modeManager.getMode()
    let actions = []

    if (!this.enabled) {
      actions = ACTION_CONFIGS.disabled
    } else if (!this.selected) {
      actions = [...ACTION_CONFIGS.noSelection]
      actions[0].label = this.modeManager.getModeLabel()
    } else if (mode === 'grab') {
      actions = ACTION_CONFIGS.grab
    } else if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
      actions = ACTION_CONFIGS.transform
      const spaceAction = actions.find(a => a.type === 'keyT')
      if (spaceAction) spaceAction.label = this.modeManager.getSpaceLabel()
    }

    this.control.setActions(actions)
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

    if (this.control.keyT.pressed && (mode === 'translate' || mode === 'rotate' || mode === 'scale')) {
      this.toggleSpace()
      this.updateActions()
    }

    if (this.control.digit1.pressed) this.setMode('grab')
    if (this.control.digit2.pressed) this.setMode('translate')
    if (this.control.digit3.pressed) this.setMode('rotate')
    if (this.control.digit4.pressed) this.setMode('scale')

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
    this.undos.push(action)
    if (this.undos.length > 50) {
      this.undos.shift()
    }
  }

  undo() {
    const undo = this.undos.pop()
    if (!undo) return
    if (this.selected) this.select(null)
    if (undo.name === 'add-entity') {
      this.entities.add(undo.data, true)
      return
    }
    if (undo.name === 'move-entity') {
      const entity = this.entities.get(undo.entityId)
      if (!entity) return
      entity.data.position = undo.position
      entity.data.quaternion = undo.quaternion
      this.network.send('entityModified', {
        id: undo.entityId,
        position: entity.data.position,
        quaternion: entity.data.quaternion,
        scale: entity.data.scale,
      })
      entity.build()
      return
    }
    if (undo.name === 'remove-entity') {
      const entity = this.entities.get(undo.entityId)
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

  setMode(mode) {
    this.setMode(mode)
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
      const mode = this.getMode()
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
      const mode = this.getMode()
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
    return this.mode
  }

  setMode(mode) {
    if (this.selected) {
      if (this.mode === 'grab') {
        this.control.keyC.capture = false
        this.control.scrollDelta.capture = false
      }
      if (this.mode === 'translate' || this.mode === 'rotate' || this.mode === 'scale') {
        this.detachGizmo()
      }
    }

    this.mode = mode

    if (this.mode === 'grab') {
      if (this.selected) {
        this.control.keyC.capture = true
        this.control.scrollDelta.capture = true
        this.target.position.copy(this.selected.root.position)
        this.target.quaternion.copy(this.selected.root.quaternion)
        this.target.scale.copy(this.selected.root.scale)
        this.target.limit = PROJECT_MAX
      }
    }

    if (this.mode === 'translate' || this.mode === 'rotate' || this.mode === 'scale') {
      if (this.selected) {
        this.attachGizmo(this.selected, this.mode)
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
    return MODE_LABELS[this.mode]
  }

  getEntityAtReticle() {
    const hits = this.world.stage.raycastReticle()
    let entity
    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }
    return entity
  }

  getEntityAtPointer() {
    const hits = this.world.stage.raycastPointer(this.control.pointer.position)
    let entity
    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }
    return entity
  }

  getHitAtReticle(ignoreEntity, ignorePlayers) {
    const hits = this.world.stage.raycastReticle()
    let hit
    for (const _hit of hits) {
      const entity = _hit.getEntity?.()
      if (entity === ignoreEntity || (entity?.isPlayer && ignorePlayers)) continue
      hit = _hit
      break
    }
    return hit
  }

  getSpawnTransform(atReticle) {
    const hit = atReticle
      ? this.world.stage.raycastReticle()[0]
      : this.world.stage.raycastPointer(this.control.pointer.position)[0]

    const position = hit ? hit.point.toArray() : [0, 0, 0]

    let quaternion
    if (hit) {
      e1.copy(this.world.rig.rotation).reorder('YXZ')
      e1.x = 0
      e1.z = 0
      const degrees = e1.y * RAD2DEG
      const snappedDegrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES
      e1.y = snappedDegrees * DEG2RAD
      q1.setFromEuler(e1)
      quaternion = q1.toArray()
    } else {
      quaternion = [0, 0, 0, 1]
    }

    return { position, quaternion }
  }

  destroy() {
    this.viewport.removeEventListener('dragover', this.fileDropHandler.onDragOver)
    this.viewport.removeEventListener('dragenter', this.fileDropHandler.onDragEnter)
    this.viewport.removeEventListener('dragleave', this.fileDropHandler.onDragLeave)
    this.viewport.removeEventListener('drop', this.fileDropHandler.onDrop)
    this.detachGizmo()
  }
}
