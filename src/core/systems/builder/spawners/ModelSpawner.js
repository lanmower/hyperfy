import { hashFile } from '../../../utils-client.js'
import { BaseSpawner } from './BaseSpawner.js'

export class ModelSpawner extends BaseSpawner {
  constructor(entitySpawner) {
    super(entitySpawner)
  }

  async spawn(file, transform) {
    const hash = await hashFile(file)
    const filename = `${hash}.glb`
    const url = `asset://${filename}`

    this.clientBuilder.world.loader.insert('model', url, file)

    const blueprint = this.createBlueprint({
      name: file.name.split('.')[0],
      model: url,
    })

    this.clientBuilder.blueprints.add(blueprint, true)

    const camPos = this.clientBuilder.rig.position
    const FORWARD = { x: 0, y: 0, z: -1 }
    const quat = this.clientBuilder.rig.quaternion
    const dir = {
      x: FORWARD.x * (1 - 2 * (quat.y * quat.y + quat.z * quat.z)) + FORWARD.z * (2 * (quat.x * quat.z - quat.w * quat.y)),
      y: FORWARD.x * (2 * (quat.x * quat.y + quat.w * quat.z)) + FORWARD.y * (1 - 2 * (quat.x * quat.x + quat.z * quat.z)) + FORWARD.z * (2 * (quat.y * quat.z - quat.w * quat.x)),
      z: FORWARD.x * (2 * (quat.x * quat.z + quat.w * quat.y)) + FORWARD.y * (2 * (quat.y * quat.z - quat.w * quat.x)) + FORWARD.z * (1 - 2 * (quat.x * quat.x + quat.y * quat.y))
    }
    const distance = 1
    const spawnPos = [camPos.x + dir.x * distance, camPos.y + dir.y * distance, camPos.z + dir.z * distance]

    const data = this.createEntityData(blueprint.id, { position: spawnPos, quaternion: [0, 0, 0, 1] })
    const app = this.clientBuilder.entities.add(data, true)

    await this.handleUploadWithRollback([file], app)
  }
}
