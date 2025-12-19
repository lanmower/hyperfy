import { uuid } from '../../../utils-client.js'
import { importApp } from '../../../extras/appTools.js'

export class AppSpawner {
  constructor(entitySpawner) {
    this.entitySpawner = entitySpawner
    this.clientBuilder = entitySpawner.clientBuilder
  }

  async spawn(file, transform) {
    const info = await importApp(file)

    for (const asset of info.assets) {
      this.clientBuilder.world.loader.insert(asset.type, asset.url, asset.file)
    }

    if (info.blueprint.scene) {
      return await this.replaceScene(info, transform)
    }

    return await this.createApp(info, transform)
  }

  async replaceScene(info, transform) {
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
  }

  async createApp(info, transform) {
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
}
