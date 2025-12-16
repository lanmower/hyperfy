import * as THREE from '../extras/three.js'
import { every, isArray, isBoolean, isFunction, isNumber, isString } from 'lodash-es'

import { Node } from './Node.js'
import { defineProps, createPropertyProxy } from '../utils/defineProperty.js'
import { schema } from '../utils/createNodeSchema.js'

const shapeTypes = ['point', 'sphere', 'hemisphere', 'cone', 'box', 'circle', 'rectangle']
const spaces = ['local', 'world']
const blendings = ['additive', 'normal']
const billboards = ['full', 'y', 'direction']

// shape types
// -------------
// ['point']
// ['sphere', radius, thickness]
// ['hemisphere', radius, thickness]
// ['cone', radius, thickness, angle]
// ['box', width, height, depth, thickness, origin(volume|edge), spherize(bool)]
// ['circle', radius, thickness, spherize]
// ['rectangle', width, depth, thickness, spherize]

// start format
// ------------
// fixed: 1
// linear: 1-3
// random: 1~3

// lifetime format
// ---------------
// multipliers applied over particle lifetime –
// `${time},${value}|${time},${value}` etc
// time = ratio from start of life to end (0 to 1)
// value = size, rotate, color, alpha, emissive etc
// eg: `0,1|0.5,2|1,1`

// prettier-ignore
const defaults = {
  // emitter
  emitting: true,
  shape: ['cone', 1, 1, 25],
  direction: 0,                       // 0 = no direction randomization, 1 = completely randomize direction
  rate: 10,                           // number of particles emitted per second
  bursts: [],                         // bursts of particles at specific times – { time: 0, count: 10 }
  duration: 5,                        // how long particles emit for (null forever)
  loop: true,                         // start again after duration ends
  max: 1000,                          // maximum number of particles before oldest start being used
  timescale: 1,                       // override to increase/decrease emitter time scale

  // initial values (see start format)
  life: '5',                          // particle lifetime
  speed: '1',                         // particle start speed
  size: '1',                          // particle start size
  rotate: '0',                        // particle start rotation (degrees)
  color: 'white',                     // particle start color
  alpha: '1',                         // particle start alpha
  emissive: '1',                      // particle start emissive intensity (bloom)

  // rendering
  image: '/particle.png',
  spritesheet: null,                  // [rows, cols, frameRate, loops]
  blending: 'normal',                 // additive or normal (normal requires sorting)
  lit: false,                         // lit or unlit material
  billboard: 'full',
  space: 'world',                     // world or local space

  // simulation
  force: null,                        // vector3 for gravity, levitation, wind etc
  velocityLinear: null,               // [x,y,z]
  velocityOrbital: null,              // [x,y,z]
  velocityRadial: null,               // number

  rateOverDistance: 0,
  sizeOverLife: null,                 // see lifetime format above for this and the following...
  rotateOverLife: null,
  colorOverLife: null,
  alphaOverLife: null,
  emissiveOverLife: null,

  onEnd: null,
}

const rebuild = function() { this.needsRebuild = true; this.setDirty() }
const propertySchema = schema('emitting', 'shape', 'direction', 'rate', 'bursts', 'duration', 'loop', 'max', 'timescale', 'life', 'speed', 'size', 'rotate', 'color', 'alpha', 'emissive', 'image', 'spritesheet', 'blending', 'lit', 'billboard', 'space', 'force', 'velocityLinear', 'velocityOrbital', 'velocityRadial', 'rateOverDistance', 'sizeOverLife', 'rotateOverLife', 'colorOverLife', 'alphaOverLife', 'emissiveOverLife', 'onEnd')
  .override('emitting', { default: defaults.emitting, onSet: function() { this.emitter?.setEmitting(this._emitting) } })
  .overrideAll({
    shape: { default: defaults.shape, onSet: rebuild },
    direction: { default: defaults.direction, onSet: rebuild },
    rate: { default: defaults.rate, onSet: rebuild },
    bursts: { default: defaults.bursts, onSet: rebuild },
    duration: { default: defaults.duration, onSet: rebuild },
    loop: { default: defaults.loop, onSet: rebuild },
    max: { default: defaults.max, onSet: rebuild },
    timescale: { default: defaults.timescale, onSet: rebuild },
    life: { default: defaults.life, onSet: rebuild },
    speed: { default: defaults.speed, onSet: rebuild },
    size: { default: defaults.size, onSet: rebuild },
    rotate: { default: defaults.rotate, onSet: rebuild },
    color: { default: defaults.color, onSet: rebuild },
    alpha: { default: defaults.alpha, onSet: rebuild },
    emissive: { default: defaults.emissive, onSet: rebuild },
    image: { default: defaults.image, onSet: rebuild },
    spritesheet: { default: defaults.spritesheet, onSet: rebuild },
    blending: { default: defaults.blending, onSet: rebuild },
    lit: { default: defaults.lit, onSet: rebuild },
    billboard: { default: defaults.billboard, onSet: rebuild },
    space: { default: defaults.space, onSet: rebuild },
    force: { default: defaults.force, onSet: rebuild },
    velocityLinear: { default: defaults.velocityLinear, onSet: rebuild },
    velocityOrbital: { default: defaults.velocityOrbital, onSet: rebuild },
    velocityRadial: { default: defaults.velocityRadial, onSet: rebuild },
    rateOverDistance: { default: defaults.rateOverDistance, onSet: rebuild },
    sizeOverLife: { default: defaults.sizeOverLife, onSet: rebuild },
    rotateOverLife: { default: defaults.rotateOverLife, onSet: rebuild },
    colorOverLife: { default: defaults.colorOverLife, onSet: rebuild },
    alphaOverLife: { default: defaults.alphaOverLife, onSet: rebuild },
    emissiveOverLife: { default: defaults.emissiveOverLife, onSet: rebuild },
    onEnd: { default: defaults.onEnd, onSet: rebuild },
  })
  .build()

export class Particles extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'particles'

    defineProps(this, propertySchema, data)
  }

  mount() {
    this.needsRebuild = false
    this.emitter = this.ctx.world.particles?.register(this)
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      // emitter tracks matrixWorld automatically
    }
  }

  unmount() {
    this.emitter?.destroy()
    this.emitter = null
  }

  getConfig() {
    const config = {
      emitting: this._emitting,
      shape: this._shape,
      direction: this._direction,
      rate: this._rate,
      bursts: this._bursts,
      duration: this._duration,
      loop: this._loop,
      max: this._max,
      timescale: this._timescale,

      life: this._life,
      speed: this._speed,
      size: this._size,
      rotate: this._rotate,
      color: this._color,
      alpha: this._alpha,
      emissive: this._emissive,

      image: this._image,
      spritesheet: this._spritesheet,
      blending: this._blending,
      lit: this._lit,
      billboard: this._billboard,
      space: this._space,

      force: this._force?.toArray() || null,
      velocityLinear: this._velocityLinear?.toArray() || null,
      velocityOrbital: this._velocityOrbital?.toArray() || null,
      velocityRadial: this._velocityRadial,

      rateOverDistance: this._rateOverDistance,
      sizeOverLife: this._sizeOverLife,
      rotateOverLife: this._rotateOverLife,
      colorOverLife: this._colorOverLife,
      alphaOverLife: this._alphaOverLife,
      emissiveOverLife: this._emissiveOverLife,
    }
    return config
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}

function isShape(value) {
  return isArray(value) && shapeTypes.includes(value[0])
}

function isBursts(value) {
  return isArray(value) && every(value, item => isNumber(item.time) && isNumber(item.count))
}

function isStartNumeric(value) {
  return isString(value)
}

function isStartColor(value) {
  return isString(value)
}

function isSpritesheet(value) {
  return isArray(value) && value.length === 4
}

function isBlending(value) {
  return blendings.includes(value)
}

function isSpace(value) {
  return spaces.includes(value)
}

function isBillboard(value) {
  return billboards.includes(value)
}
