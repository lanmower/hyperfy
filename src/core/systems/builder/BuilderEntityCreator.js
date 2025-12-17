
import { uuid, hashFile } from '../../utils-client.js'
import { importApp } from '../../extras/appTools.js'
import { DEG2RAD, RAD2DEG } from '../../extras/general.js'
import * as THREE from '../../extras/three.js'

const SNAP_DEGREES = 5

export class BuilderEntityCreator {
  constructor(world, builder) {
    this.world = world
    this.builder = builder
    this.loader = world.loader
    this.ui = world.ui
    this.blueprints = world.blueprints
    this.network = world.network
    this.entities = world.entities
    this.events = world.events
    this.e1 = new THREE.Euler()
    this.q1 = new THREE.Quaternion()
  }

  async addApp(file, transform) {
    const info = await importApp(file)

    for (const asset of info.assets) {
      this.loader.insert(asset.type, asset.url, asset.file)
    }

    if (info.blueprint.scene) {
      const confirmed = await this.ui.confirm({
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

    this.loader.insert('model', url, file)

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

    this.loader.insert('avatar', url, file)

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
      return // Avatar changed while uploading
    }

    this.network.send('entityModified', {
      id: player.data.id,
      avatar: url,
    })
  }

  getSpawnTransform(atReticle) {
    const hit = atReticle
      ? this.world.stage.raycastReticle()[0]
      : this.world.stage.raycastPointer(this.builder.control.pointer.position)[0]

    const position = hit ? hit.point.toArray() : [0, 0, 0]

    let quaternion
    if (hit) {
      this.e1.copy(this.world.rig.rotation).reorder('YXZ')
      this.e1.x = 0
      this.e1.z = 0
      const degrees = this.e1.y * RAD2DEG
      const snappedDegrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES
      this.e1.y = snappedDegrees * DEG2RAD
      this.q1.setFromEuler(this.e1)
      quaternion = this.q1.toArray()
    } else {
      quaternion = [0, 0, 0, 1]
    }

    return { position, quaternion }
  }
}
