import { uuid } from '../../utils-client.js'

export class SelectionManager {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
    this.selected = null
  }

  select(entity) {
    if (this.selected === entity) return
    if (this.selected) {
      this.clientBuilder.gizmoManager.detachGizmo()
      this.selected.outline = null
    }
    this.selected = entity
    if (entity) {
      entity.outline = 0xff9a00
      this.clientBuilder.gizmoManager.attachGizmo(entity)
      this.clientBuilder.updateActions()
    }
  }

  getSelected() {
    return this.selected
  }

  handleInspect() {
    if (this.clientBuilder.control.mouseRight.pressed && this.clientBuilder.control.pointer.locked) {
      const entity = this.clientBuilder.getEntityAtReticle()
      if (entity?.isApp) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.setApp(entity)
      }
      if (entity?.isPlayer) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.togglePane('players')
      }
    }
    else if (!this.selected && !this.clientBuilder.control.pointer.locked && this.clientBuilder.control.mouseRight.pressed) {
      const entity = this.clientBuilder.getEntityAtPointer()
      if (entity?.isApp) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.setApp(entity)
      }
      if (entity?.isPlayer) {
        this.select(null)
        this.clientBuilder.control.pointer.unlock()
        this.clientBuilder.ui.togglePane('players')
      }
    }
  }

  handleUnlink() {
    if (this.clientBuilder.control.keyU.pressed && this.clientBuilder.control.pointer.locked) {
      const entity = this.selected || this.clientBuilder.getEntityAtReticle()
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
        this.clientBuilder.blueprints.add(blueprint, true)
        entity.modify({ blueprint: blueprint.id })
        this.clientBuilder.network.send('entityModified', { id: entity.data.id, blueprint: blueprint.id })
        this.clientBuilder.events.emit('toast', 'Unlinked')
      }
    }
  }

  handlePin() {
    if (this.clientBuilder.control.keyP.pressed && this.clientBuilder.control.pointer.locked) {
      const entity = this.selected || this.clientBuilder.getEntityAtReticle()
      if (entity?.isApp) {
        entity.data.pinned = !entity.data.pinned
        this.clientBuilder.network.send('entityModified', {
          id: entity.data.id,
          pinned: entity.data.pinned,
        })
        this.clientBuilder.events.emit('toast', entity.data.pinned ? 'Pinned' : 'Un-pinned')
        this.select(null)
      }
    }
  }

  handleSelection(delta, mode) {
    if (!this.clientBuilder.justPointerLocked && this.clientBuilder.control.pointer.locked && this.clientBuilder.control.mouseLeft.pressed) {
      if (!this.selected) {
        const entity = this.clientBuilder.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
      }
      else if (this.selected && mode === 'grab') {
        this.select(null)
      }
      else if (
        this.selected &&
        (mode === 'translate' || mode === 'rotate' || mode === 'scale') &&
        !this.clientBuilder.isGizmoActive()
      ) {
        const entity = this.clientBuilder.getEntityAtReticle()
        if (entity?.isApp && !entity.data.pinned && !entity.blueprint?.scene) this.select(entity)
        else this.select(null)
      }
    }

    if (this.selected && !this.clientBuilder.control.pointer.locked) {
      this.select(null)
    }

    if (
      !this.clientBuilder.justPointerLocked &&
      this.clientBuilder.control.pointer.locked &&
      this.clientBuilder.control.keyR.pressed &&
      !this.clientBuilder.control.metaLeft.down &&
      !this.clientBuilder.control.controlLeft.down
    ) {
      const entity = this.selected || this.clientBuilder.getEntityAtReticle()
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
          this.clientBuilder.blueprints.add(blueprint, true)
          blueprintId = blueprint.id
        }
        const data = {
          id: uuid(),
          type: 'app',
          blueprint: blueprintId,
          position: entity.root.position.toArray(),
          quaternion: entity.root.quaternion.toArray(),
          scale: entity.root.scale.toArray(),
          mover: this.clientBuilder.network.id,
          uploader: null,
          pinned: false,
          state: {},
        }
        const dup = this.clientBuilder.entities.add(data, true)
        this.select(dup)
        this.clientBuilder.addUndo({
          name: 'remove-entity',
          entityId: data.id,
        })
      }
    }
  }

  handleDelete() {
    if (this.clientBuilder.control.keyX.pressed) {
      if (this.selected) {
        if (this.selected?.isApp && !this.selected.data.pinned && !this.selected.blueprint?.scene) {
          this.clientBuilder.network.send('entityRemoved', this.selected.data.id)
          this.clientBuilder.addUndo({
            name: 'add-entity',
            data: this.selected.data,
          })
          this.select(null)
        }
      }
    }
  }
}
