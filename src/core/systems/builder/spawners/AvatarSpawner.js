import { hashFile } from '../../../utils-client.js'
import { BaseSpawner } from './BaseSpawner.js'

export class AvatarSpawner extends BaseSpawner {
  constructor(entitySpawner) {
    super(entitySpawner)
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
    const blueprint = this.createBlueprint({
      name: file.name,
      model: url,
    })

    this.clientBuilder.blueprints.add(blueprint, true)

    const data = this.createEntityData(blueprint.id, transform)
    const app = this.clientBuilder.entities.add(data, true)
    await this.handleUploadWithRollback([file], app)
  }

  async equip(file, url) {
    const player = this.clientBuilder.entities.player
    const prevUrl = player.data.avatar

    player.modify({ avatar: url, sessionAvatar: null })

    try {
      await this.clientBuilder.network.upload(file)
    } catch (err) {
      this.logger.error('Avatar upload failed', { error: err.message })
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
