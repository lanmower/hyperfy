/**
 * Builder Entity Creator
 *
 * Handles creation of apps, models, and avatars during builder operations.
 * Responsibilities:
 * - Loading and placing apps from .hyp files
 * - Loading and placing models from .glb files
 * - Loading and placing avatars from .vrm files
 * - Calculating spawn transform for new entities
 */

import { uuid, hashFile } from '../../utils-client.js'
import { importApp } from '../../extras/appTools.js'
import { DEG2RAD, RAD2DEG } from '../../extras/general.js'
import * as THREE from '../../extras/three.js'

const SNAP_DEGREES = 5

export class BuilderEntityCreator {
  constructor(world, builder) {
    this.world = world
    this.builder = builder
    this.e1 = new THREE.Euler()
    this.q1 = new THREE.Quaternion()
  }

  /**
   * Create and place an app from a .hyp file
   */
  async addApp(file, transform) {
    const info = await importApp(file)

    // Insert assets into loader cache
    for (const asset of info.assets) {
      this.world.loader.insert(asset.type, asset.url, asset.file)
    }

    // Handle scene blueprint (replace existing scene)
    if (info.blueprint.scene) {
      const confirmed = await this.world.ui.confirm({
        title: 'Scene',
        message: 'Do you want to replace your current scene with this one?',
        confirmText: 'Replace',
        cancelText: 'Cancel',
      })
      if (!confirmed) return

      // Update existing scene blueprint
      const blueprint = this.world.blueprints.getScene()
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

      this.world.blueprints.modify(change)

      // Upload assets
      const promises = info.assets.map(asset => this.world.network.upload(asset.file))
      await Promise.all(promises)

      // Publish changes
      this.world.network.send('blueprintModified', change)
      return
    }

    // Handle regular app (spawn new entity)
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
      uploader: this.world.network.id,
      pinned: false,
      state: {},
    }

    this.world.blueprints.add(blueprint, true)
    const app = this.world.entities.add(data, true)

    // Upload assets
    const promises = info.assets.map(asset => this.world.network.upload(asset.file))
    try {
      await Promise.all(promises)
      app.onUploaded()
    } catch (err) {
      console.error('Failed to upload .hyp assets:', err)
      app.destroy()
    }
  }

  /**
   * Create and place a model from a .glb file
   */
  async addModel(file, transform) {
    // Hash file for immutable filename
    const hash = await hashFile(file)
    const filename = `${hash}.glb`
    const url = `asset://${filename}`

    // Cache file locally for instant loading
    this.world.loader.insert('model', url, file)

    // Create blueprint
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

    this.world.blueprints.add(blueprint, true)

    // Spawn entity with uploader flag for other clients
    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.world.network.id,
      pinned: false,
      state: {},
    }

    const app = this.world.entities.add(data, true)

    // Upload the glb file
    await this.world.network.upload(file)
    app.onUploaded()
  }

  /**
   * Create and place an avatar from a .vrm file
   */
  async addAvatar(file, transform, canPlace) {
    // Hash file for immutable filename
    const hash = await hashFile(file)
    const filename = `${hash}.vrm`
    const url = `asset://${filename}`

    // Cache file locally
    this.world.loader.insert('avatar', url, file)

    // Emit avatar event for UI to handle placement/equipping
    this.world.events.emit('avatar', {
      file,
      url,
      hash,
      canPlace,
      onPlace: async () => {
        this.world.events.emit('avatar', null)
        await this._placeAvatar(file, url, transform)
      },
      onEquip: async () => {
        this.world.events.emit('avatar', null)
        await this._equipAvatar(file, url)
      },
    })
  }

  /**
   * Place avatar as entity in scene
   */
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

    this.world.blueprints.add(blueprint, true)

    const data = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: this.world.network.id,
      pinned: false,
      state: {},
    }

    const app = this.world.entities.add(data, true)
    await this.world.network.upload(file)
    app.onUploaded()
  }

  /**
   * Equip avatar for player
   */
  async _equipAvatar(file, url) {
    const player = this.world.entities.player
    const prevUrl = player.data.avatar

    // Update locally
    player.modify({ avatar: url, sessionAvatar: null })

    // Upload
    try {
      await this.world.network.upload(file)
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      player.modify({ avatar: prevUrl })
      return
    }

    if (player.data.avatar !== url) {
      return // Avatar changed while uploading
    }

    // Publish for everyone
    this.world.network.send('entityModified', {
      id: player.data.id,
      avatar: url,
    })
  }

  /**
   * Calculate spawn transform for new entities
   */
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
