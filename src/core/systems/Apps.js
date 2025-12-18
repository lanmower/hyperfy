// Apps API system with world and entity method/getter/setter delegation
import { System } from './System.js'
import { WorldAPIConfig } from './apps/WorldAPIConfig.js'
import { AppAPIConfig } from './apps/AppAPIConfig.js'

const isBrowser = typeof window !== 'undefined'

const internalEvents = [
  'fixedUpdate',
  'updated',
  'lateUpdate',
  'destroy',
  'enter',
  'leave',
  'chat',
  'command',
  'health',
]

const fileRemaps = {
  avatar: field => {
    field.type = 'file'
    field.kind = 'avatar'
  },
  emote: field => {
    field.type = 'file'
    field.kind = 'emote'
  },
  model: field => {
    field.type = 'file'
    field.kind = 'model'
  },
  texture: field => {
    field.type = 'file'
    field.kind = 'texture'
  },
  image: field => {
    field.type = 'file'
    field.kind = 'image'
  },
  video: field => {
    field.type = 'file'
    field.kind = 'video'
  },
  hdr: field => {
    field.type = 'file'
    field.kind = 'hdr'
  },
  audio: field => {
    field.type = 'file'
    field.kind = 'audio'
  },
}

export class Apps extends System {
  constructor(world) {
    super(world)
    this.raycastHit = null
    this.worldGetters = { ...WorldAPIConfig.getters }
    this.worldSetters = { ...WorldAPIConfig.setters }
    this.worldMethods = { ...WorldAPIConfig.methods }
    this.appGetters = { ...AppAPIConfig.getters }
    this.appSetters = { ...AppAPIConfig.setters }
    this.appMethods = { ...AppAPIConfig.methods }
  }

  inject({ world, app }) {
    if (world) {
      for (const key in world) {
        const value = world[key]
        const isFunc = typeof value === 'function'
        if (isFunc) {
          this.worldMethods[key] = value
          continue
        }
        if (value.get) {
          this.worldGetters[key] = value.get
        }
        if (value.set) {
          this.worldSetters[key] = value.set
        }
      }
    }
    if (app) {
      for (const key in app) {
        const value = app[key]
        const isFunc = typeof value === 'function'
        if (isFunc) {
          this.appMethods[key] = value
          continue
        }
        if (value.get) {
          this.appGetters[key] = value.get
        }
        if (value.set) {
          this.appSetters[key] = value.set
        }
      }
    }
  }
}

export { fileRemaps }
