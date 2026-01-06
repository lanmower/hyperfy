import { UndoManager } from './UndoManager.js'
import { ModeManager } from './ModeManager.js'
import { FileDropHandler } from './FileDropHandler.js'
import { SelectionManager } from './SelectionManager.js'
import { TransformHandler } from './TransformHandler.js'
import { RaycastUtilities } from './RaycastUtilities.js'
import { SpawnTransformCalculator } from './SpawnTransformCalculator.js'
import { BuilderActions } from './BuilderActions.js'
import { StateTransitionHandler } from './StateTransitionHandler.js'

export class BuilderComposer {
  constructor(builder) {
    this.builder = builder
    this.viewport = null

    this.undoManager = new UndoManager(builder)
    this.modeManager = new ModeManager()
    this.fileDropHandler = null
    this.selectionManager = new SelectionManager(builder)
    this.transformHandler = new TransformHandler(builder)
    this.raycastUtilities = new RaycastUtilities(builder)
    this.spawnTransformCalculator = new SpawnTransformCalculator(builder)
    this.builderActions = new BuilderActions(builder)
    this.stateTransitionHandler = new StateTransitionHandler(builder)
  }

  init({ world, viewport }) {
    this.viewport = viewport
    this.fileDropHandler = new FileDropHandler(this.builder)
    viewport.addEventListener('dragover', this.fileDropHandler.onDragOver)
    viewport.addEventListener('dragenter', this.fileDropHandler.onDragEnter)
    viewport.addEventListener('dragleave', this.fileDropHandler.onDragLeave)
    viewport.addEventListener('drop', this.fileDropHandler.onDrop)
  }

  update(delta, mode) {
    this.selectionManager.handleInspect()
    this.selectionManager.handleUnlink()
    this.selectionManager.handlePin()
    this.builderActions.handleSpaceToggle(mode)
    this.builderActions.handleModeKeyPress()
    this.selectionManager.handleSelection(delta, mode)
    this.transformHandler.handleModeUpdates(delta, mode)
    this.transformHandler.sendSelectedUpdates(delta)
  }

  destroy() {
    if (!this.viewport || !this.fileDropHandler) return
    this.viewport.removeEventListener('dragover', this.fileDropHandler.onDragOver)
    this.viewport.removeEventListener('dragenter', this.fileDropHandler.onDragEnter)
    this.viewport.removeEventListener('dragleave', this.fileDropHandler.onDragLeave)
    this.viewport.removeEventListener('drop', this.fileDropHandler.onDrop)
  }

  getMode() {
    return this.modeManager.getMode()
  }

  getModeLabel() {
    return this.modeManager.getModeLabel()
  }

  addUndo(action) {
    this.undoManager.addUndo(action)
  }

  executeUndo() {
    this.undoManager.execute()
  }

  toggle(enabled) {
    this.stateTransitionHandler.toggle(enabled)
  }

  select(app) {
    this.stateTransitionHandler.select(app)
  }

  setMode(mode) {
    this.stateTransitionHandler.setMode(mode)
  }

  updateActions() {
    this.builderActions.updateActions()
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
}
