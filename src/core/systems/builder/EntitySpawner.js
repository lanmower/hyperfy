import { uuid, hashFile } from '../../utils-client.js'
import { importApp } from '../../extras/appTools.js'

export class EntitySpawner {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
  }

  async addApp(file, transform) {
    const info = await importApp(file)

    for (const asset of info.assets) {
      this.clientBuilder.world.loader.insert(asset.type, asset.url, asset.file)
    }

    if (info.blueprint.scene) {
      const confirmed = await this.clientBuilder.world.ui.confirm({
        title: 'Scene',
        message: 'Do you want to replace your current scene with this one?',
        confirmText: 'Replace',
        cancelText: 'Cancel',
      })
      if (!confirmed) return

      const blueprint = this.clientBuilder.blueprints.getScene()
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

      this.clientBuilder.blueprints.modify(change)

      const promises = info.assets.map(asset => this.clientBuilder.network.upload(asset.file))
      await Promise.all(promises)

      this.clientBuilder.network.send('blueprintModified', change)
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
      uploader: this.clientBuilder.network.id,
      pinned: false,
      state: {},
    }

    this.clientBuilder.blueprints.add(blueprint, true)
    const app = this.clientBuilder.entities.add(data, true)

    const promises = info.assets.map(asset => this.clientBuilder.network.upload(asset.file))
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

    this.clientBuilder.world.loader.insert('model', url, file)

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

    this.clientBuilder.blueprints.add(blueprint, true)

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.clientBuilder.network.id,
      pinned: false,
      state: {},
    }

    const app = this.clientBuilder.entities.add(data, true)

    await this.clientBuilder.network.upload(file)
    app.onUploaded()
  }

  async addAvatar(file, transform, canPlace) {
    const hash = await hashFile(file)
    const filename = `${hash}.vrm`
    const url = `asset://${filename}`

    this.clientBuilder.world.loader.insert('avatar', url, file)

    this.clientBuilder.events.emit('avatar', {
      file,
      url,
      hash,
      canPlace,
      onPlace: async () => {
        this.clientBuilder.events.emit('avatar', null)
        await this.placeAvatar(file, url, transform)
      },
      onEquip: async () => {
        this.clientBuilder.events.emit('avatar', null)
        await this.equipAvatar(file, url)
      },
    })
  }

  async placeAvatar(file, url, transform) {
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

    this.clientBuilder.blueprints.add(blueprint, true)

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.clientBuilder.network.id,
      pinned: false,
      state: {},
    }

    const app = this.clientBuilder.entities.add(data, true)
    await this.clientBuilder.network.upload(file)
    app.onUploaded()
  }

  async equipAvatar(file, url) {
    const player = this.clientBuilder.entities.player
    const prevUrl = player.data.avatar

    player.modify({ avatar: url, sessionAvatar: null })

    try {
      await this.clientBuilder.network.upload(file)
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      player.modify({ avatar: prevUrl })
      return
    }

    if (player.data.avatar !== url) {
      return
    }

    this.clientBuilder.network.send('entityModified', {
      id: player.data.id,
      avatar: url,
    })
  }
}
