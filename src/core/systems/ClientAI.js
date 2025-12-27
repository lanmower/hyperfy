import { System } from './System.js'
import { uuid } from '../utils.js'

export class ClientAI extends System {
  constructor(world) {
    super(world)
  }

  init() {
    this.world.events.on('command', this.onCommand)
  }

  deserialize(data) {
    this.enabled = data.enabled
    this.provider = data.provider
    this.model = data.model
    this.effort = data.effort
    console.log('[ai]', data)
  }

  onCommand = ({ args }) => {
    if (!args) return
    const [cmd, ...rest] = args
    const prompt = rest.join(' ')

    if (cmd === 'create') this.create({ value: prompt })
    if (cmd === 'edit') this.edit({ value: prompt })
    if (cmd === 'fix') this.fix()
  }

  create = async ({ value: prompt }) => {
    if (!this.enabled) {
      return console.error('[ai] not enabled')
    }
    if (!this.world.builder.canBuild()) return
    const blueprint = {
      id: uuid(),
      version: 0,
      name: 'Model',
      image: null,
      author: 'Claude',
      url: null,
      desc: null,
      model: 'asset://ai.glb',
      script: 'asset://ai.js',
      props: {
        prompt: prompt.length > 100 ? prompt.slice(0, 100) + '...' : prompt,
        createdAt: this.world.network.getTime(),
      },
      preload: false,
      public: false,
      locked: false,
      unique: false,
      disabled: false,
    }
    this.world.blueprints.add(blueprint, true)
    const transform = this.world.builder.getSpawnTransform(true)
    this.world.builder.toggle(true)
    this.world.builder.control.pointer.lock()
    await new Promise(resolve => setTimeout(resolve, 100))
    const appData = {
      id: uuid(),
      type: 'app',
      blueprint: blueprint.id,
      position: transform.position,
      quaternion: transform.quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: null,
      pinned: false,
      state: {},
    }
    const app = this.world.entities.add(appData, true)
    const action = {
      name: 'create',
      blueprintId: blueprint.id,
      appId: appData.id,
      prompt,
    }
    console.log('[ai] creating', action)
    this.world.network.send('ai', action)
  }

  edit = async ({ value: prompt }) => {
    if (!this.enabled) {
      return console.error('[ai] not enabled')
    }
    if (!this.world.builder.canBuild()) {
      return console.error('[ai] not a builder')
    }
    const entity = this.world.builder.getEntityAtReticle()
    if (!entity || !entity.isApp || entity.blueprint.scene) {
      return console.error('[ai] no app found at reticle')
    }
    const action = {
      name: 'edit',
      blueprintId: entity.data.blueprint,
      appId: entity.data.id,
      prompt,
    }
    this.world.network.send('ai', action)
    console.log('[ai] editing', action)
  }

  fix = async () => {
    if (!this.enabled) {
      return console.error('[ai] not enabled')
    }
    if (!this.world.builder.canBuild()) {
      return console.error('[ai] not a builder')
    }
    const entity = this.world.builder.getEntityAtReticle()
    if (!entity || !entity.isApp || entity.blueprint.scene) {
      return console.error('[ai] no app found at reticle')
    }
    if (!entity.scriptError) {
      return console.error('[ai] no script error to fix')
    }
    const action = {
      name: 'fix',
      blueprintId: entity.data.blueprint,
      appId: entity.data.id,
      error: entity.scriptError,
    }
    this.world.network.send('ai', action)
    console.log('[ai] fixing', action)
  }
}
