import { uuid } from '../../utils-client.js'
import { BaseBuilderHandler } from './BaseBuilderHandler.js'
import { serializeTransform } from './BuilderTransformUtils.js'
import { BlueprintFactory } from '../../factories/BlueprintFactory.js'

export class EntityCommandHandler extends BaseBuilderHandler {
  constructor(parent) {
    super(parent, 'EntityCommandHandler')
  }

  handleUnlink() {
    if (!this.canExecuteCommand()) return
    const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
    if (!entity?.isApp || !entity.blueprint) return

    this.parent.select(null)
    const blueprint = this.createBlueprintCopy(entity.blueprint)
    this.parent.clientBuilder.blueprints.add(blueprint, true)
    entity.modify({ blueprint: blueprint.id })
    this.sendNetwork('entityModified', { id: entity.data.id, blueprint: blueprint.id })
    this.emitEvent('toast', 'Unlinked')
  }

  handlePin() {
    if (!this.canExecuteCommand(this.parent.clientBuilder.control.keyP)) return
    const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
    if (!entity?.isApp) return

    entity.data.pinned = !entity.data.pinned
    this.sendNetwork('entityModified', {
      id: entity.data.id,
      pinned: entity.data.pinned,
    })
    this.emitEvent('toast', entity.data.pinned ? 'Pinned' : 'Un-pinned')
    this.parent.select(null)
  }

  handleDuplicate() {
    if (this.parent.clientBuilder.justPointerLocked) return
    if (!this.parent.clientBuilder.control.pointer.locked) return
    if (!this.parent.clientBuilder.control.keyR.pressed) return
    if (this.parent.clientBuilder.control.metaLeft.down) return
    if (this.parent.clientBuilder.control.controlLeft.down) return

    const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
    if (!entity?.isApp || entity.blueprint?.scene) return

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
  }

  handleDelete() {
    if (!this.parent.clientBuilder.control.keyX.pressed) return
    if (!this.parent.selected) return
    if (!this.parent.selected?.isApp) return
    if (this.parent.selected.data.pinned) return
    if (this.parent.selected.blueprint?.scene) return

    this.sendNetwork('entityRemoved', this.parent.selected.data.id)
    this.parent.clientBuilder.addUndo({
      name: 'add-entity',
      data: this.parent.selected.data,
    })
    this.parent.select(null)
  }

  createBlueprintCopy(blueprint) {
    return BlueprintFactory.createBlueprint('app', {
      ...blueprint,
      id: undefined,
      version: 0,
      props: JSON.parse(JSON.stringify(blueprint.props || {})),
    })
  }

  canExecuteCommand(controlKey) {
    return controlKey ? controlKey.pressed && this.parent.clientBuilder.control.pointer.locked : true
  }
}
