import { uuid } from '../../utils-client.js'
import { BaseBuilderHandler } from './BaseBuilderHandler.js'
import { serializeTransform } from './BuilderTransformUtils.js'

export class EntityCommandHandler extends BaseBuilderHandler {
  constructor(parent) {
    super(parent, 'EntityCommandHandler')
  }

  handleUnlink() {
    if (!this.canExecuteCommand()) return
    const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
    if (!entity?.isApp || !entity.blueprint) return

    try {
      this.parent.select(null)
      const blueprint = this.createBlueprintCopy(entity.blueprint)
      this.parent.clientBuilder.blueprints.add(blueprint, true)
      entity.modify({ blueprint: blueprint.id })
      this.sendNetwork('entityModified', { id: entity.data.id, blueprint: blueprint.id })
      this.emitEvent('toast', 'Unlinked')
    } catch (err) {
      this.logger.error('Unlink failed', { entityId: entity?.data.id })
      throw err
    }
  }

  handlePin() {
    if (!this.canExecuteCommand(this.parent.clientBuilder.control.keyP)) return
    const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
    if (!entity?.isApp) return

    try {
      entity.data.pinned = !entity.data.pinned
      this.sendNetwork('entityModified', {
        id: entity.data.id,
        pinned: entity.data.pinned,
      })
      this.emitEvent('toast', entity.data.pinned ? 'Pinned' : 'Un-pinned')
      this.parent.select(null)
    } catch (err) {
      this.logger.error('Pin toggle failed', { entityId: entity?.data.id })
      throw err
    }
  }

  handleDuplicate() {
    if (this.parent.clientBuilder.justPointerLocked) return
    if (!this.parent.clientBuilder.control.pointer.locked) return
    if (!this.parent.clientBuilder.control.keyR.pressed) return
    if (this.parent.clientBuilder.control.metaLeft.down) return
    if (this.parent.clientBuilder.control.controlLeft.down) return

    const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
    if (!entity?.isApp || entity.blueprint?.scene) return

    try {
      let blueprintId = entity.data.blueprint
      if (entity.blueprint?.unique) {
        const blueprint = this.createBlueprintCopy(entity.blueprint)
        this.parent.clientBuilder.blueprints.add(blueprint, true)
        blueprintId = blueprint.id
      }
      const data = {
        id: uuid(),
        type: 'app',
        blueprint: blueprintId,
        ...serializeTransform(entity.root),
        mover: this.parent.clientBuilder.network.id,
        uploader: null,
        pinned: false,
        state: {},
      }
      const dup = this.parent.clientBuilder.entities.add(data, true)
      this.parent.select(dup)
      this.parent.clientBuilder.addUndo({
        name: 'remove-entity',
        entityId: data.id,
      })
    } catch (err) {
      this.logger.error('Duplicate failed', { entityId: entity?.data.id })
      throw err
    }
  }

  handleDelete() {
    if (!this.parent.clientBuilder.control.keyX.pressed) return
    if (!this.parent.selected) return
    if (!this.parent.selected?.isApp) return
    if (this.parent.selected.data.pinned) return
    if (this.parent.selected.blueprint?.scene) return

    try {
      this.sendNetwork('entityRemoved', this.parent.selected.data.id)
      this.parent.clientBuilder.addUndo({
        name: 'add-entity',
        data: this.parent.selected.data,
      })
      this.parent.select(null)
    } catch (err) {
      this.logger.error('Delete failed', { entityId: this.parent.selected?.data.id })
      throw err
    }
  }

  createBlueprintCopy(blueprint) {
    return {
      id: uuid(),
      version: 0,
      name: blueprint.name,
      image: blueprint.image,
      author: blueprint.author,
      url: blueprint.url,
      desc: blueprint.desc,
      model: blueprint.model,
      script: blueprint.script,
      props: JSON.parse(JSON.stringify(blueprint.props)),
      preload: blueprint.preload,
      public: blueprint.public,
      locked: blueprint.locked,
      frozen: blueprint.frozen,
      unique: blueprint.unique,
      scene: blueprint.scene,
      disabled: blueprint.disabled,
    }
  }

  canExecuteCommand(controlKey) {
    return controlKey ? controlKey.pressed && this.parent.clientBuilder.control.pointer.locked : true
  }
}
