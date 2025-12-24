import { uuid, hashFile } from '../../../utils-client.js'

export class ModelSpawner {
  constructor(entitySpawner) {
    this.entitySpawner = entitySpawner
    this.clientBuilder = entitySpawner.clientBuilder
  }

  async spawn(file, transform) {
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
      mover: this.clientBuilder.network.id,
      uploader: this.clientBuilder.network.id,
      pinned: false,
      state: {},
    }

    const app = this.clientBuilder.entities.add(data, true)

    this.clientBuilder.select(app)
    this.clientBuilder.setMode('grab')

    await this.clientBuilder.network.upload(file)
    app.onUploaded()
  }
}
