import * as THREE from '../extras/three.js'
import { isBoolean } from 'lodash-es'
import moment from 'moment'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

import { System } from './System.js'
import { uuid, hashFile } from '../utils-client.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { importApp } from '../extras/appTools.js'
import { EVENT } from '../constants/EventNames.js'
import { ACTION_CONFIGS, MODE_LABELS } from './builder/ActionConfigs.js'
import { UndoManager } from './builder/UndoManager.js'
import { ModeManager } from './builder/ModeManager.js'
import { GizmoManager } from './builder/GizmoManager.js'

const FORWARD = new THREE.Vector3(0, 0, -1)
const SNAP_DISTANCE = 1
const SNAP_DEGREES = 5
const PROJECT_SPEED = 10
const PROJECT_MIN = 3
const PROJECT_MAX = 50

const v1 = new THREE.Vector3()
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
    this.lastMoveSendTime = 0
    this.justPointerLocked = false

    this.target = new THREE.Object3D()
    this.target.rotation.reorder('YXZ')
    this.target.limit = PROJECT_MAX

    this.undoManager = new UndoManager()
    this.modeManager = new ModeManager()
    this.gizmoManager = null

    this.dropTarget = null
    this.dropping = false
    this.dropFile = null
  }

  async init({ viewport }) {
    this.viewport = viewport
    this.gizmoManager = new GizmoManager(this.world, viewport)
    this.viewport.addEventListener('dragover', this.onDragOver)
    this.viewport.addEventListener('dragenter', this.onDragEnter)
    this.viewport.addEventListener('dragleave', this.onDragLeave)
    this.viewport.addEventListener('drop', this.onDrop)
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
    if (this.control.mouseRight.pressed && this.control.pointer.locked) {
      const entity = this.getEntityAtReticle()
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
    else if (!this.selected && !this.control.pointer.locked && this.control.mouseRight.pressed) {
      const entity = this.getEntityAtPointer()
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

  _handleUnlink() {
    if (this.control.keyU.pressed && this.control.pointer.locked) {
      const entity = this.selected || this.getEntityAtReticle()
      if (entity?.isApp && entity.blueprint) {
        this.select(null)
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
        entity.modify({ blueprint: blueprint.id })
        this.network.send('entityModified', { id: entity.data.id, blueprint: blueprint.id })
        this.events.emit('toast', 'Unlinked')
      }
    }
  }

  _handlePin() {
    if (this.control.keyP.pressed && this.control.pointer.locked) {
      const entity = this.selected || this.getEntityAtReticle()
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

  _handleSelection(delta, mode) {
    if (!this.justPointerLocked && this.control.pointer.locked && this.control.mouseLeft.pressed) {
      if (!this.selected) {
        const entity = this.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
      }
      else if (this.selected && mode === 'grab') {
        this.select(null)
      }
      else if (
        this.selected &&
        (mode === 'translate' || mode === 'rotate' || mode === 'scale') &&
        !this.isGizmoActive()
      ) {
        const entity = this.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
        else this.select(null)
      }
    }

    if (this.selected && !this.control.pointer.locked) {
      this.select(null)
    }

    if (
      !this.justPointerLocked &&
      this.control.pointer.locked &&
      this.control.keyR.pressed &&
      !this.control.metaLeft.down &&
      !this.control.controlLeft.down
    ) {
      const entity = this.selected || this.getEntityAtReticle()
      if (entity?.isApp && !entity.blueprint?.scene) {
        let blueprintId = entity.data.blueprint
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

    if (this.control.keyX.pressed) {
      const entity = this.selected || this.getEntityAtReticle()
      if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) {
        this.select(null)
        this.addUndo({
          name: 'add-entity',
          data: JSON.parse(JSON.stringify(entity.data)),
        })
        entity?.destroy(true)
      }
    }

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

  _handleModeUpdates(delta, mode) {
    if (!this.selected) return

    if (mode === 'translate' && this.isGizmoActive()) {
      const app = this.selected
      app.root.position.copy(this.gizmoTarget.position)
      app.root.quaternion.copy(this.gizmoTarget.quaternion)
      app.root.scale.copy(this.gizmoTarget.scale)
    }

    if (mode === 'rotate') {
      if (this.control.controlLeft.pressed) {
        this.disableRotationSnap()
      }
      if (this.control.controlLeft.released) {
        this.enableRotationSnap()
      }
      if (this.isGizmoActive()) {
        const app = this.selected
        app.root.position.copy(this.gizmoTarget.position)
        app.root.quaternion.copy(this.gizmoTarget.quaternion)
        app.root.scale.copy(this.gizmoTarget.scale)
      }
    }

    if (mode === 'scale' && this.isGizmoActive()) {
      const app = this.selected
      app.root.scale.copy(this.gizmoTarget.scale)
    }

    if (mode === 'grab') {
      this._handleGrabMode(delta)
    }
  }

  _handleGrabMode(delta) {
    const app = this.selected
    const hit = this.getHitAtReticle(app, true)

    const camPos = this.rig.position
    const camDir = v1.copy(FORWARD).applyQuaternion(this.rig.quaternion)
    const hitDistance = hit ? hit.point.distanceTo(camPos) : 0

    if (hit && hitDistance < this.target.limit) {
      this.target.position.copy(hit.point)
    } else {
      this.target.position.copy(camPos).add(camDir.multiplyScalar(this.target.limit))
    }

    let project = this.control.keyF.down ? 1 : this.control.keyC.down ? -1 : null
    if (project) {
      const multiplier = this.control.shiftLeft.down ? 4 : 1
      this.target.limit += project * PROJECT_SPEED * delta * multiplier
      if (this.target.limit < PROJECT_MIN) this.target.limit = PROJECT_MIN
      if (hitDistance && this.target.limit > hitDistance) this.target.limit = hitDistance
    }

    if (this.control.shiftLeft.down) {
      const scaleFactor = 1 + this.control.scrollDelta.value * 0.1 * delta
      this.target.scale.multiplyScalar(scaleFactor)
    }
    else {
      this.target.rotation.y += this.control.scrollDelta.value * 0.1 * delta
    }

    app.root.position.copy(this.target.position)
    app.root.quaternion.copy(this.target.quaternion)
    app.root.scale.copy(this.target.scale)

    if (!this.control.controlLeft.down) {
      const newY = this.target.rotation.y
      const degrees = newY / DEG2RAD
      const snappedDegrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES
      app.root.rotation.y = snappedDegrees * DEG2RAD
    }

    app.root.clean()

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
    this.localSpace = !this.localSpace
    if (this.gizmo) {
      this.gizmo.space = this.localSpace ? 'local' : 'world'
    }
  }

  getSpaceLabel() {
    return this.localSpace ? 'World Space' : 'Local Space'
  }

  attachGizmo(app, mode) {
    if (this.gizmo) this.detachGizmo()

    this.gizmo = new TransformControls(this.world.camera, this.viewport)
    this.gizmo.setSize(0.7)
    this.gizmo.space = this.localSpace ? 'local' : 'world'

    this.gizmo._gizmo.helper.translate.scale.setScalar(0)
    this.gizmo._gizmo.helper.rotate.scale.setScalar(0)
    this.gizmo._gizmo.helper.scale.scale.setScalar(0)

    this.gizmo.addEventListener('mouseDown', () => {
      this.gizmoActive = true
    })
    this.gizmo.addEventListener('mouseUp', () => {
      this.gizmoActive = false
    })

    this.gizmoTarget = new THREE.Object3D()
    this.gizmoHelper = this.gizmo.getHelper()

    this.gizmoTarget.position.copy(app.root.position)
    this.gizmoTarget.quaternion.copy(app.root.quaternion)
    this.gizmoTarget.scale.copy(app.root.scale)

    this.world.stage.scene.add(this.gizmoTarget)
    this.world.stage.scene.add(this.gizmoHelper)

    this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    this.gizmo.attach(this.gizmoTarget)
    this.gizmo.mode = mode
  }

  detachGizmo() {
    if (!this.gizmo) return

    this.world.stage.scene.remove(this.gizmoTarget)
    this.world.stage.scene.remove(this.gizmoHelper)
    this.gizmo.detach()
    this.gizmo.disconnect()
    this.gizmo.dispose()

    this.gizmo = null
    this.gizmoTarget = null
    this.gizmoHelper = null
    this.gizmoActive = false
  }

  disableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = null
    }
  }

  enableRotationSnap() {
    if (this.gizmo) {
      this.gizmo.rotationSnap = SNAP_DEGREES * DEG2RAD
    }
  }

  isGizmoActive() {
    return this.gizmoActive
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

  onDragOver = e => {
    e.preventDefault()
  }

  onDragEnter = e => {
    this.dropTarget = e.target
    this.dropping = true
    this.dropFile = null
  }

  onDragLeave = e => {
    if (e.target === this.dropTarget) {
      this.dropping = false
    }
  }

  onDrop = async e => {
    e.preventDefault()
    this.dropping = false

    let file = await this._extractFileFromDrop(e)
    if (!file) return

    await new Promise(resolve => setTimeout(resolve, 100))

    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'vrm' && !this.canBuild() && !this.world.settings.customAvatars) {
      return
    }

    const maxSize = this.network.maxUploadSize * 1024 * 1024
    if (file.size > maxSize) {
      this.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `File size too large (>${this.network.maxUploadSize}mb)`,
        createdAt: moment().toISOString(),
      })
      console.error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    if (ext !== 'vrm' && !this.canBuild()) {
      this.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `You don't have permission to do that.`,
        createdAt: moment().toISOString(),
      })
      return
    }

    if (ext !== 'vrm') {
      this.toggle(true)
    }

    const transform = this.getSpawnTransform()

    if (ext === 'hyp') {
      await this.addApp(file, transform)
    } else if (ext === 'glb') {
      await this.addModel(file, transform)
    } else if (ext === 'vrm') {
      const canPlace = this.canBuild()
      await this.addAvatar(file, transform, canPlace)
    }
  }

  async _extractFileFromDrop(e) {
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]

      if (item.kind === 'file') {
        return item.getAsFile()
      }

      if (item.type === 'text/uri-list' || item.type === 'text/plain' || item.type === 'text/html') {
        const text = await this._getAsString(item)
        const url = text.trim().split('\n')[0]

        if (url.startsWith('http')) {
          try {
            const resp = await fetch(url)
            const blob = await resp.blob()
            const filename = new URL(url).pathname.split('/').pop()
            return new File([blob], filename, { type: resp.headers.get('content-type') })
          } catch (err) {
            console.error('Failed to fetch URL:', err)
            return null
          }
        }
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      return e.dataTransfer.files[0]
    }

    return null
  }

  _getAsString(item) {
    return new Promise(resolve => {
      item.getAsString(resolve)
    })
  }

  async addApp(file, transform) {
    const info = await importApp(file)

    for (const asset of info.assets) {
      this.world.loader.insert(asset.type, asset.url, asset.file)
    }

    if (info.blueprint.scene) {
      const confirmed = await this.world.ui.confirm({
        title: 'Scene',
        message: 'Do you want to replace your current scene with this one?',
        confirmText: 'Replace',
        cancelText: 'Cancel',
      })
      if (!confirmed) return

      const blueprint = this.blueprints.getScene()
      const change = {
        id: blueprint.id,
        version: blueprint.version + 1,
        name: info.blueprint.name,
        image: info.blueprint.image,
        author: info.blueprint.author,
        url: info.blueprint.url,
        desc: info.blueprint.desc,
        model: info.blueprint.model,
        script: info.blueprint.script,
        props: info.blueprint.props,
        preload: info.blueprint.preload,
        public: info.blueprint.public,
        locked: info.blueprint.locked,
        frozen: info.blueprint.frozen,
        unique: info.blueprint.unique,
        scene: info.blueprint.scene,
        disabled: info.blueprint.disabled,
      }

      this.blueprints.modify(change)

      const promises = info.assets.map(asset => this.network.upload(asset.file))
      await Promise.all(promises)

      this.network.send('blueprintModified', change)
      return
    }

    const blueprint = {
      id: uuid(),
      version: 0,
      name: info.blueprint.name,
      image: info.blueprint.image,
      author: info.blueprint.author,
      url: info.blueprint.url,
      desc: info.blueprint.desc,
      model: info.blueprint.model,
      script: info.blueprint.script,
      props: info.blueprint.props,
      preload: info.blueprint.preload,
      public: info.blueprint.public,
      locked: info.blueprint.locked,
      frozen: info.blueprint.frozen,
      unique: info.blueprint.unique,
      scene: info.blueprint.scene,
      disabled: info.blueprint.disabled,
    }

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.network.id,
      pinned: false,
      state: {},
    }

    this.blueprints.add(blueprint, true)
    const app = this.entities.add(data, true)

    const promises = info.assets.map(asset => this.network.upload(asset.file))
    try {
      await Promise.all(promises)
      app.onUploaded()
    } catch (err) {
      console.error('Failed to upload .hyp assets:', err)
      app.destroy()
    }
  }

  async addModel(file, transform) {
    const hash = await hashFile(file)
    const filename = `${hash}.glb`
    const url = `asset://${filename}`

    this.world.loader.insert('model', url, file)

    const blueprint = {
      id: uuid(),
      version: 0,
      name: file.name.split('.')[0],
      image: null,
      author: null,
      url: null,
      desc: null,
      model: url,
      script: null,
      props: {},
      preload: false,
      public: false,
      locked: false,
      unique: false,
      scene: false,
      disabled: false,
    }

    this.blueprints.add(blueprint, true)

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.network.id,
      pinned: false,
      state: {},
    }

    const app = this.entities.add(data, true)

    await this.network.upload(file)
    app.onUploaded()
  }

  async addAvatar(file, transform, canPlace) {
    const hash = await hashFile(file)
    const filename = `${hash}.vrm`
    const url = `asset://${filename}`

    this.world.loader.insert('avatar', url, file)

    this.events.emit('avatar', {
      file,
      url,
      hash,
      canPlace,
      onPlace: async () => {
        this.events.emit('avatar', null)
        await this._placeAvatar(file, url, transform)
      },
      onEquip: async () => {
        this.events.emit('avatar', null)
        await this._equipAvatar(file, url)
      },
    })
  }

  async _placeAvatar(file, url, transform) {
    const blueprint = {
      id: uuid(),
      version: 0,
      name: file.name,
      image: null,
      author: null,
      url: null,
      desc: null,
      model: url,
      script: null,
      props: {},
      preload: false,
      public: false,
      locked: false,
      unique: false,
      scene: false,
      disabled: false,
    }

    this.blueprints.add(blueprint, true)

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.network.id,
      pinned: false,
      state: {},
    }

    const app = this.entities.add(data, true)
    await this.network.upload(file)
    app.onUploaded()
  }

  async _equipAvatar(file, url) {
    const player = this.entities.player
    const prevUrl = player.data.avatar

    player.modify({ avatar: url, sessionAvatar: null })

    try {
      await this.network.upload(file)
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      player.modify({ avatar: prevUrl })
      return
    }

    if (player.data.avatar !== url) {
      return
    }

    this.network.send('entityModified', {
      id: player.data.id,
      avatar: url,
    })
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
    this.viewport.removeEventListener('dragover', this.onDragOver)
    this.viewport.removeEventListener('dragenter', this.onDragEnter)
    this.viewport.removeEventListener('dragleave', this.onDragLeave)
    this.viewport.removeEventListener('drop', this.onDrop)
    this.detachGizmo()
  }
}
