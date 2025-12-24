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

    const camPos = this.clientBuilder.rig.position
    const FORWARD = { x: 0, y: 0, z: -1 }
    const quat = this.clientBuilder.rig.quaternion
    const dir = {
      x: FORWARD.x * (1 - 2 * (quat.y * quat.y + quat.z * quat.z)) + FORWARD.z * (2 * (quat.x * quat.z - quat.w * quat.y)),
      y: FORWARD.x * (2 * (quat.x * quat.y + quat.w * quat.z)) + FORWARD.y * (1 - 2 * (quat.x * quat.x + quat.z * quat.z)) + FORWARD.z * (2 * (quat.y * quat.z - quat.w * quat.x)),
      z: FORWARD.x * (2 * (quat.x * quat.z + quat.w * quat.y)) + FORWARD.y * (2 * (quat.y * quat.z - quat.w * quat.x)) + FORWARD.z * (1 - 2 * (quat.x * quat.x + quat.y * quat.y))
    }
    const distance = 2
    const spawnPos = [camPos.x + dir.x * distance, camPos.y - 0.5 + dir.y * distance, camPos.z + dir.z * distance]

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: spawnPos,
      quaternion: [0, 0, 0, 1],
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
