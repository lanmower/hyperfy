import { AppSpawner } from './spawners/AppSpawner.js'
import { ModelSpawner } from './spawners/ModelSpawner.js'
import { AvatarSpawner } from './spawners/AvatarSpawner.js'

export class EntitySpawner {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
    this.appSpawner = new AppSpawner(this)
    this.modelSpawner = new ModelSpawner(this)
    this.avatarSpawner = new AvatarSpawner(this)
  }

  async addApp(file, transform) {
    return this.appSpawner.spawn(file, transform)
  }

  async addModel(file, transform) {
    return this.modelSpawner.spawn(file, transform)
  }

  async addAvatar(file, transform, canPlace) {
    return this.avatarSpawner.initiate(file, transform, canPlace)
  }

  async placeAvatar(file, url, transform) {
    return this.avatarSpawner.place(file, url, transform)
  }

  async equipAvatar(file, url) {
    return this.avatarSpawner.equip(file, url)
  }
}
