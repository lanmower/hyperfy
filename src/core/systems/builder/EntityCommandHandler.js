import { uuid } from '../../utils-client.js'

export class EntityCommandHandler {
  constructor(parent) {
    this.parent = parent
  }

  handleUnlink() {
    if (this.parent.clientBuilder.control.keyU.pressed && this.parent.clientBuilder.control.pointer.locked) {
      const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
      if (entity?.isApp && entity.blueprint) {
        this.parent.select(null)
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
        this.parent.clientBuilder.blueprints.add(blueprint, true)
        entity.modify({ blueprint: blueprint.id })
        this.parent.clientBuilder.network.send('entityModified', { id: entity.data.id, blueprint: blueprint.id })
        this.parent.clientBuilder.events.emit('toast', 'Unlinked')
      }
    }
  }

  handlePin() {
    if (this.parent.clientBuilder.control.keyP.pressed && this.parent.clientBuilder.control.pointer.locked) {
      const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
      if (entity?.isApp) {
        entity.data.pinned = !entity.data.pinned
        this.parent.clientBuilder.network.send('entityModified', {
          id: entity.data.id,
          pinned: entity.data.pinned,
        })
        this.parent.clientBuilder.events.emit('toast', entity.data.pinned ? 'Pinned' : 'Un-pinned')
        this.parent.select(null)
      }
    }
  }

  handleDuplicate() {
    if (
      !this.parent.clientBuilder.justPointerLocked &&
      this.parent.clientBuilder.control.pointer.locked &&
      this.parent.clientBuilder.control.keyR.pressed &&
      !this.parent.clientBuilder.control.metaLeft.down &&
      !this.parent.clientBuilder.control.controlLeft.down
    ) {
      const entity = this.parent.selected || this.parent.clientBuilder.getEntityAtReticle()
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
          this.parent.clientBuilder.blueprints.add(blueprint, true)
          blueprintId = blueprint.id
        }
        const data = {
          id: uuid(),
          type: 'app',
          blueprint: blueprintId,
          position: entity.root.position.toArray(),
          quaternion: entity.root.quaternion.toArray(),
          scale: entity.root.scale.toArray(),
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
    }
  }

  handleDelete() {
    if (this.parent.clientBuilder.control.keyX.pressed) {
      if (this.parent.selected) {
        if (this.parent.selected?.isApp && !this.parent.selected.data.pinned && !this.parent.selected.blueprint?.scene) {
          this.parent.clientBuilder.network.send('entityRemoved', this.parent.selected.data.id)
          this.parent.clientBuilder.addUndo({
            name: 'add-entity',
            data: this.parent.selected.data,
          })
          this.parent.select(null)
        }
      }
    }
  }
}
