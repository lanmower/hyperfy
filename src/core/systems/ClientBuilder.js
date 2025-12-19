import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { UndoManager } from './builder/UndoManager.js'
import { ModeManager } from './builder/ModeManager.js'
import { GizmoManager } from './builder/GizmoManager.js'
import { FileDropHandler } from './builder/FileDropHandler.js'
import { SelectionManager } from './builder/SelectionManager.js'
import { TransformHandler } from './builder/TransformHandler.js'
import { RaycastUtilities } from './builder/RaycastUtilities.js'
import { SpawnTransformCalculator } from './builder/SpawnTransformCalculator.js'
import { BuilderActions } from './builder/BuilderActions.js'
import { StateTransitionHandler } from './builder/StateTransitionHandler.js'
import { UndoOperationExecutor } from './builder/UndoOperationExecutor.js'
import { BuilderUpdateCoordinator } from './builder/BuilderUpdateCoordinator.js'
import { BuilderControlSetup } from './builder/BuilderControlSetup.js'

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
    this.stateTransitionHandler = new StateTransitionHandler(this)
    this.undoOperationExecutor = new UndoOperationExecutor(this)
    this.updateCoordinator = new BuilderUpdateCoordinator(this)
    this.controlSetup = new BuilderControlSetup(this)
  }

  async init({ viewport }) {
    this.viewport = viewport
    this.gizmoManager = new GizmoManager(this.world, viewport)
    this.fileDropHandler = new FileDropHandler(this)
    this.controlSetup.setupFileDropListeners(viewport, this.fileDropHandler)
  }

  start() {
    this.controlSetup.setupControls()
  }

  checkLocalPlayer = () => {
    this.controlSetup.checkLocalPlayer()
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

    this.updateCoordinator.handleFrameUpdate(delta, mode)
  }

  addUndo(action) {
    this.undoManager.addUndo(action)
  }

  undo() {
    this.undoOperationExecutor.execute()
  }

  toggle(enabled) {
    this.stateTransitionHandler.toggle(enabled)
  }

  select(app) {
    this.stateTransitionHandler.select(app)
  }

  getMode() {
    return this.modeManager.getMode()
  }

  setMode(mode) {
    this.stateTransitionHandler.setMode(mode)
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
    this.controlSetup.removeFileDropListeners(this.viewport, this.fileDropHandler)
    this.detachGizmo()
  }
}
