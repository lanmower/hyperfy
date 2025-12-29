import { uuid, hashFile } from '../../../utils-client.js'
import { ComponentLogger } from '../../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('AvatarSpawner')

export class AvatarSpawner {
  constructor(entitySpawner) {
    this.entitySpawner = entitySpawner
    this.clientBuilder = entitySpawner.clientBuilder
  }

  async initiate(file, transform, canPlace) {
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
        await this.place(file, url, transform)
      },
      onEquip: async () => {
        this.clientBuilder.events.emit('avatar', null)
        await this.equip(file, url)
      },
    })
  }

  async place(file, url, transform) {
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

  async equip(file, url) {
    const player = this.clientBuilder.entities.player
    const prevUrl = player.data.avatar

    player.modify({ avatar: url, sessionAvatar: null })

    try {
      await this.clientBuilder.network.upload(file)
    } catch (err) {
      logger.error('Avatar upload failed', { error: err.message })
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
