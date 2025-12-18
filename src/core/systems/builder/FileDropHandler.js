import moment from 'moment'
import { uuid, hashFile } from '../../utils-client.js'
import { importApp } from '../../extras/appTools.js'

export class FileDropHandler {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
    this.dropTarget = null
    this.dropping = false
    this.dropFile = null
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

    if (ext === 'vrm' && !this.clientBuilder.canBuild() && !this.clientBuilder.world.settings.customAvatars) {
      return
    }

    const maxSize = this.clientBuilder.network.maxUploadSize * 1024 * 1024
    if (file.size > maxSize) {
      this.clientBuilder.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `File size too large (>${this.clientBuilder.network.maxUploadSize}mb)`,
        createdAt: moment().toISOString(),
      })
      console.error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    if (ext !== 'vrm' && !this.clientBuilder.canBuild()) {
      this.clientBuilder.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `You don't have permission to do that.`,
        createdAt: moment().toISOString(),
      })
      return
    }

    if (ext !== 'vrm') {
      this.clientBuilder.toggle(true)
    }

    const transform = this.clientBuilder.getSpawnTransform()

    if (ext === 'hyp') {
      await this.addApp(file, transform)
    } else if (ext === 'glb') {
      await this.addModel(file, transform)
    } else if (ext === 'vrm') {
      const canPlace = this.clientBuilder.canBuild()
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
        await this._placeAvatar(file, url, transform)
      },
      onEquip: async () => {
        this.clientBuilder.events.emit('avatar', null)
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

  async _equipAvatar(file, url) {
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
