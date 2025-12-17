import * as THREE from '../extras/three.js'
import { isBoolean } from 'lodash-es'

import { System } from './System.js'
import { uuid } from '../utils.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { DEG2RAD } from '../extras/general.js'

import { BuilderEntityCreator } from './builder/BuilderEntityCreator.js'
import { BuilderEntityPicker } from './builder/BuilderEntityPicker.js'
import { BuilderFileHandler } from './builder/BuilderFileHandler.js'
import { BuilderModeManager } from './builder/BuilderModeManager.js'

const FORWARD = new THREE.Vector3(0, 0, -1)
const SNAP_DISTANCE = 1
const SNAP_DEGREES = 5
const PROJECT_SPEED = 10
const PROJECT_MIN = 3
const PROJECT_MAX = 50

const v1 = new THREE.Vector3()

/**
 * Builder System - Orchestrator
 *
 * Coordinates builder operations across modular components:
 * - BuilderEntityCreator: App/model/avatar placement
 * - BuilderEntityPicker: Entity raycasting/selection
 * - BuilderFileHandler: File drag/drop handling
 * - BuilderModeManager: Mode switching and gizmo control
 */
export class ClientBuilder extends System {
  // DI Service Constants
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

  constructor(world) {
    super(world)
    this.enabled = false
    this.selected = null
    this.lastMoveSendTime = 0
    this.undos = []
    this.justPointerLocked = false

    // Setup grab mode target
    this.target = new THREE.Object3D()
    this.target.rotation.reorder('YXZ')
    this.target.limit = PROJECT_MAX
  }

  // DI Property Getters
  get controls() { return this.getService(ClientBuilder.DEPS.controls) }
  get network() { return this.getService(ClientBuilder.DEPS.network) }
  get entities() { return this.getService(ClientBuilder.DEPS.entities) }
  get ui() { return this.getService(ClientBuilder.DEPS.ui) }
  get events() { return this.getService(ClientBuilder.DEPS.events) }
  get blueprints() { return this.getService(ClientBuilder.DEPS.blueprints) }
  get rig() { return this.getService(ClientBuilder.DEPS.rig) }
  get snaps() { return this.getService(ClientBuilder.DEPS.snaps) }
  get networkRate() { return this.getService(ClientBuilder.DEPS.networkRate) }

  async init({ viewport }) {
    this.viewport = viewport

    // Initialize modular components
    this.picker = new BuilderEntityPicker(this.world, this)
    this.creator = new BuilderEntityCreator(this.world, this)
    this.fileHandler = new BuilderFileHandler(this.world, this, this.creator)
    this.modeManager = new BuilderModeManager(this.world, this, this.picker)

    // Attach file handlers to viewport
    this.viewport.addEventListener('dragover', this.fileHandler.onDragOver)
    this.viewport.addEventListener('dragenter', this.fileHandler.onDragEnter)
    this.viewport.addEventListener('dragleave', this.fileHandler.onDragLeave)
    this.viewport.addEventListener('drop', this.fileHandler.onDrop)

    // Listen to player/setting changes
    this.events.on('player', this.checkLocalPlayer)
    this.events.on('settingChanged', this.checkLocalPlayer)
  }

  start() {
    this.control = this.controls.bind({ priority: ControlPriorities.BUILDER })
    this.control.mouseLeft.onPress = () => {
      // pointer lock requires user-gesture in safari
      // so this can't be done during update cycle
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
      // builder revoked
      this.select(null)
      this.enabled = false
      this.events.emit('buildModeChanged', false)
    }
    this.updateActions()
  }

  canBuild() {
    return this.entities.player?.isBuilder()
  }

  updateActions() {
    const actions = []
    const mode = this.modeManager.getMode()

    if (!this.enabled) {
      if (this.canBuild()) {
        // actions.push({ type: 'tab', label: 'Build Mode' })
      }
    }

    if (this.enabled && !this.selected) {
      actions.push({ type: 'mouseLeft', label: this.modeManager.getModeLabel() })
      actions.push({ type: 'mouseRight', label: 'Inspect' })
      actions.push({ type: 'custom', btn: '1234', label: 'Grab / Translate / Rotate / Scale' })
      actions.push({ type: 'keyR', label: 'Duplicate' })
      actions.push({ type: 'keyP', label: 'Pin' })
      actions.push({ type: 'keyX', label: 'Destroy' })
      actions.push({ type: 'space', label: 'Jump / Fly (Double-Tap)' })
    }

    if (this.enabled && this.selected && mode === 'grab') {
      actions.push({ type: 'mouseLeft', label: 'Place' })
      actions.push({ type: 'mouseWheel', label: 'Rotate' })
      actions.push({ type: 'mouseRight', label: 'Inspect' })
      actions.push({ type: 'custom', btn: '1234', label: 'Grab / Translate / Rotate / Scale' })
      actions.push({ type: 'keyF', label: 'Push' })
      actions.push({ type: 'keyC', label: 'Pull' })
      actions.push({ type: 'keyX', label: 'Destroy' })
      actions.push({ type: 'controlLeft', label: 'No Snap (Hold)' })
      actions.push({ type: 'space', label: 'Jump / Fly (Double-Tap)' })
    }

    if (this.enabled && this.selected && (mode === 'translate' || mode === 'rotate' || mode === 'scale')) {
      actions.push({ type: 'mouseLeft', label: 'Select / Transform' })
      actions.push({ type: 'mouseRight', label: 'Inspect' })
      actions.push({ type: 'custom', btn: '1234', label: 'Grab / Translate / Rotate / Scale' })
      actions.push({ type: 'keyT', label: this.modeManager.getSpaceLabel() })
      actions.push({ type: 'keyX', label: 'Destroy' })
      actions.push({ type: 'controlLeft', label: 'No Snap (Hold)' })
      actions.push({ type: 'space', label: 'Jump / Fly (Double-Tap)' })
    }

    this.control.setActions(actions)
  }

  update(delta) {
    const mode = this.modeManager.getMode()

    // toggle build
    if (this.control.tab.pressed) {
      this.toggle()
    }

    // deselect if dead
    if (this.selected?.destroyed) {
      this.select(null)
    }

    // deselect if stolen
    if (this.selected && this.selected?.data.mover !== this.network.id) {
      this.select(null)
    }

    // stop here if build mode not enabled
    if (!this.enabled) {
      return
    }

    // Inspect operations (delegate to picker)
    this._handleInspect()

    // Unlink operations
    this._handleUnlink()

    // Pin/unpin operations
    this._handlePin()

    // Gizmo space toggle
    if (this.control.keyT.pressed && (mode === 'translate' || mode === 'rotate' || mode === 'scale')) {
      this.modeManager.toggleSpace()
      this.updateActions()
    }

    // Mode switching
    if (this.control.digit1.pressed) this.setMode('grab')
    if (this.control.digit2.pressed) this.setMode('translate')
    if (this.control.digit3.pressed) this.setMode('rotate')
    if (this.control.digit4.pressed) this.setMode('scale')

    // Selection and interaction
    this._handleSelection(delta, mode)

    // Mode-specific updates
    this._handleModeUpdates(delta, mode)

    // Send updates to network
    this._sendSelectedUpdates(delta)

    if (this.justPointerLocked) {
      this.justPointerLocked = false
    }
  }

  /**
   * Handle inspect right-click operations
   */
  _handleInspect() {
    // inspect in pointer-lock
    if (this.control.mouseRight.pressed && this.control.pointer.locked) {
      const entity = this.picker.getEntityAtReticle()
      if (entity?.isApp) {
        this.select(null)
        this.control.pointer.unlock()
        this.ui.setApp(entity)
      }
      if (entity?.isPlayer) {
        this.select(null)
        this.control.pointer.unlock()
        this.ui.togglePane('players')
      }
    }
    // inspect out of pointer-lock
    else if (!this.selected && !this.control.pointer.locked && this.control.mouseRight.pressed) {
      const entity = this.picker.getEntityAtPointer()
      if (entity?.isApp) {
        this.select(null)
        this.control.pointer.unlock()
        this.ui.setApp(entity)
      }
      if (entity?.isPlayer) {
        this.select(null)
        this.control.pointer.unlock()
        this.ui.togglePane('players')
      }
    }
  }

  /**
   * Handle unlink operation
   */
  _handleUnlink() {
    if (this.control.keyU.pressed && this.control.pointer.locked) {
      const entity = this.selected || this.picker.getEntityAtReticle()
      if (entity?.isApp && entity.blueprint) {
        this.select(null)
        // duplicate the blueprint
        const blueprint = {
          id: uuid(),
          version: 0,
          name: entity.blueprint.name,
          image: entity.blueprint.image,
          author: entity.blueprint.author,
          url: entity.blueprint.url,
          desc: entity.blueprint.desc,
          model: entity.blueprint.model,
          script: entity.blueprint.script,
          props: JSON.parse(JSON.stringify(entity.blueprint.props)),
          preload: entity.blueprint.preload,
          public: entity.blueprint.public,
          locked: entity.blueprint.locked,
          frozen: entity.blueprint.frozen,
          unique: entity.blueprint.unique,
          scene: entity.blueprint.scene,
          disabled: entity.blueprint.disabled,
        }
        this.blueprints.add(blueprint, true)
        // assign new blueprint
        entity.modify({ blueprint: blueprint.id })
        this.network.send('entityModified', { id: entity.data.id, blueprint: blueprint.id })
        // toast
        this.events.emit('toast', 'Unlinked')
      }
    }
  }

  /**
   * Handle pin/unpin operation
   */
  _handlePin() {
    if (this.control.keyP.pressed && this.control.pointer.locked) {
      const entity = this.selected || this.picker.getEntityAtReticle()
      if (entity?.isApp) {
        entity.data.pinned = !entity.data.pinned
        this.network.send('entityModified', {
          id: entity.data.id,
          pinned: entity.data.pinned,
        })
        this.events.emit('toast', entity.data.pinned ? 'Pinned' : 'Un-pinned')
        this.select(null)
      }
    }
  }

  /**
   * Handle entity selection and clicking
   */
  _handleSelection(delta, mode) {
    // left-click place/select/reselect/deselect
    if (!this.justPointerLocked && this.control.pointer.locked && this.control.mouseLeft.pressed) {
      // if nothing selected, attempt to select
      if (!this.selected) {
        const entity = this.picker.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
      }
      // if selected in grab mode, place
      else if (this.selected && mode === 'grab') {
        this.select(null)
      }
      // if selected in transform modes, re-select/deselect
      else if (
        this.selected &&
        (mode === 'translate' || mode === 'rotate' || mode === 'scale') &&
        !this.modeManager.isGizmoActive()
      ) {
        const entity = this.picker.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
        else this.select(null)
      }
    }

    // deselect on pointer unlock
    if (this.selected && !this.control.pointer.locked) {
      this.select(null)
    }

    // duplicate
    if (
      !this.justPointerLocked &&
      this.control.pointer.locked &&
      this.control.keyR.pressed &&
      !this.control.metaLeft.down &&
      !this.control.controlLeft.down
    ) {
      const entity = this.selected || this.picker.getEntityAtReticle()
      if (entity?.isApp && !entity.blueprint?.scene) {
        let blueprintId = entity.data.blueprint
        // if unique, we also duplicate the blueprint
        if (entity.blueprint?.unique) {
          const blueprint = {
            id: uuid(),
            version: 0,
            name: entity.blueprint.name,
            image: entity.blueprint.image,
            author: entity.blueprint.author,
            url: entity.blueprint.url,
            desc: entity.blueprint.desc,
            model: entity.blueprint.model,
            script: entity.blueprint.script,
            props: JSON.parse(JSON.stringify(entity.blueprint.props)),
            preload: entity.blueprint.preload,
            public: entity.blueprint.public,
            locked: entity.blueprint.locked,
            frozen: entity.blueprint.frozen,
            unique: entity.blueprint.unique,
            scene: entity.blueprint.scene,
            disabled: entity.blueprint.disabled,
          }
          this.blueprints.add(blueprint, true)
          blueprintId = blueprint.id
        }
        const data = {
          id: uuid(),
          type: 'app',
          blueprint: blueprintId,
          position: entity.root.position.toArray(),
          quaternion: entity.root.quaternion.toArray(),
          scale: entity.root.scale.toArray(),
          mover: this.network.id,
          uploader: null,
          pinned: false,
          state: {},
        }
        const dup = this.entities.add(data, true)
        this.select(dup)
        this.addUndo({
          name: 'remove-entity',
          entityId: data.id,
        })
      }
    }

    // destroy
    if (this.control.keyX.pressed) {
      const entity = this.selected || this.picker.getEntityAtReticle()
      if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) {
        this.select(null)
        this.addUndo({
          name: 'add-entity',
          data: JSON.parse(JSON.stringify(entity.data)),
        })
        entity?.destroy(true)
      }
    }

    // undo
    if (
      this.control.keyZ.pressed &&
      !this.control.shiftLeft.down &&
      (this.control.metaLeft.down || this.control.controlLeft.down)
    ) {
      console.log('undo', {
        shiftLeft: this.control.shiftLeft.down,
        metaLeft: this.control.metaLeft.down,
        controlLeft: this.control.controlLeft.down,
      })
      this.undo()
    }
  }

  /**
   * Handle mode-specific update logic
   */
  _handleModeUpdates(delta, mode) {
    if (!this.selected) return

    // Translate mode updates
    if (mode === 'translate' && this.modeManager.isGizmoActive()) {
      const app = this.selected
      app.root.position.copy(this.modeManager.gizmoTarget.position)
      app.root.quaternion.copy(this.modeManager.gizmoTarget.quaternion)
      app.root.scale.copy(this.modeManager.gizmoTarget.scale)
    }

    // Rotate mode updates
    if (mode === 'rotate') {
      if (this.control.controlLeft.pressed) {
        this.modeManager.disableRotationSnap()
      }
      if (this.control.controlLeft.released) {
        this.modeManager.enableRotationSnap()
      }
      if (this.modeManager.isGizmoActive()) {
        const app = this.selected
        app.root.position.copy(this.modeManager.gizmoTarget.position)
        app.root.quaternion.copy(this.modeManager.gizmoTarget.quaternion)
        app.root.scale.copy(this.modeManager.gizmoTarget.scale)
      }
    }

    // Scale mode updates
    if (mode === 'scale' && this.modeManager.isGizmoActive()) {
      const app = this.selected
      app.root.scale.copy(this.modeManager.gizmoTarget.scale)
    }

    // Grab mode updates
    if (mode === 'grab') {
      this._handleGrabMode(delta)
    }
  }

  /**
   * Handle grab mode manipulation
   */
  _handleGrabMode(delta) {
    const app = this.selected
    const hit = this.picker.getHitAtReticle(app, true)

    // place at distance
    const camPos = this.rig.position
    const camDir = v1.copy(FORWARD).applyQuaternion(this.rig.quaternion)
    const hitDistance = hit ? hit.point.distanceTo(camPos) : 0

    if (hit && hitDistance < this.target.limit) {
      // within range, use hit point
      this.target.position.copy(hit.point)
    } else {
      // no hit, project to limit
      this.target.position.copy(camPos).add(camDir.multiplyScalar(this.target.limit))
    }

    // if holding F/C then push or pull
    let project = this.control.keyF.down ? 1 : this.control.keyC.down ? -1 : null
    if (project) {
      const multiplier = this.control.shiftLeft.down ? 4 : 1
      this.target.limit += project * PROJECT_SPEED * delta * multiplier
      if (this.target.limit < PROJECT_MIN) this.target.limit = PROJECT_MIN
      if (hitDistance && this.target.limit > hitDistance) this.target.limit = hitDistance
    }

    // shift + mouse wheel scales
    if (this.control.shiftLeft.down) {
      const scaleFactor = 1 + this.control.scrollDelta.value * 0.1 * delta
      this.target.scale.multiplyScalar(scaleFactor)
    }
    // !shift + mouse wheel rotates
    else {
      this.target.rotation.y += this.control.scrollDelta.value * 0.1 * delta
    }

    // apply movement
    app.root.position.copy(this.target.position)
    app.root.quaternion.copy(this.target.quaternion)
    app.root.scale.copy(this.target.scale)

    // snap rotation to degrees
    if (!this.control.controlLeft.down) {
      const newY = this.target.rotation.y
      const degrees = newY / DEG2RAD
      const snappedDegrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES
      app.root.rotation.y = snappedDegrees * DEG2RAD
    }

    // update matrix
    app.root.clean()

    // and snap to any nearby points
    if (!this.control.controlLeft.down) {
      for (const pos of app.snaps) {
        const result = this.snaps.octree.query(pos, SNAP_DISTANCE)[0]
        if (result) {
          const offset = v1.copy(result.position).sub(pos)
          app.root.position.add(offset)
          break
        }
      }
    }
  }

  /**
   * Send entity updates to network
   */
  _sendSelectedUpdates(delta) {
    if (!this.selected) return

    this.lastMoveSendTime += delta
    if (this.lastMoveSendTime > this.networkRate) {
      const app = this.selected
      this.network.send('entityModified', {
        id: app.data.id,
        position: app.root.position.toArray(),
        quaternion: app.root.quaternion.toArray(),
        scale: app.root.scale.toArray(),
      })
      this.lastMoveSendTime = 0
    }
  }

  /**
   * Add an undo action
   */
  addUndo(action) {
    this.undos.push(action)
    if (this.undos.length > 50) {
      this.undos.shift()
    }
  }

  /**
   * Undo last action
   */
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

  /**
   * Toggle build mode
   */
  toggle(enabled) {
    if (!this.canBuild()) return
    enabled = isBoolean(enabled) ? enabled : !this.enabled
    if (this.enabled === enabled) return
    this.enabled = enabled
    if (!this.enabled) this.select(null)
    this.updateActions()
    this.events.emit('buildModeChanged', enabled)
  }

  /**
   * Set builder mode (grab, translate, rotate, scale)
   */
  setMode(mode) {
    this.modeManager.setMode(mode)
  }

  /**
   * Select or deselect entity
   */
  select(app) {
    // do nothing if unchanged
    if (this.selected === app) return

    // deselect existing
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
        this.modeManager.detachGizmo()
      }
    }

    // select new (if any)
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
        this.modeManager.attachGizmo(app, mode)
      }
    }

    // update actions
    this.updateActions()
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.viewport.removeEventListener('dragover', this.fileHandler.onDragOver)
    this.viewport.removeEventListener('dragenter', this.fileHandler.onDragEnter)
    this.viewport.removeEventListener('dragleave', this.fileHandler.onDragLeave)
    this.viewport.removeEventListener('drop', this.fileHandler.onDrop)
    this.modeManager.destroy()
  }
}
