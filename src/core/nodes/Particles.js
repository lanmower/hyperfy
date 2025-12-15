import * as THREE from '../extras/three.js'
import { every, isArray, isBoolean, isFunction, isNumber, isString } from 'lodash-es'

import { Node } from './Node.js'
import { defineProps } from '../utils/defineProperty.js'

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

const propertySchema = {
  emitting: {
    default: defaults.emitting,
    validate: v => !isBoolean(v) ? '[particles] emitting not a boolean' : null,
    onSet(value) {
      this.emitter?.setEmitting(value)
    },
  },
  shape: {
    default: defaults.shape,
    validate: v => !isShape(v) ? '[particles] shape invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  direction: {
    default: defaults.direction,
    validate: v => !isNumber(v) ? '[particles] direction not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  rate: {
    default: defaults.rate,
    validate: v => !isNumber(v) ? '[particles] rate not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  bursts: {
    default: defaults.bursts,
    validate: v => !isBursts(v) ? '[particles] bursts invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  duration: {
    default: defaults.duration,
    validate: v => !isNumber(v) ? '[particles] duration not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  loop: {
    default: defaults.loop,
    validate: v => !isBoolean(v) ? '[particles] loop not a boolean' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  max: {
    default: defaults.max,
    validate: v => !isNumber(v) ? '[particles] max not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  timescale: {
    default: defaults.timescale,
    validate: v => !isNumber(v) ? '[particles] timescale not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  life: {
    default: defaults.life,
    validate: v => !isStartNumeric(v) ? '[particles] life invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  speed: {
    default: defaults.speed,
    validate: v => !isStartNumeric(v) ? '[particles] speed invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  size: {
    default: defaults.size,
    validate: v => !isStartNumeric(v) ? '[particles] size invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  rotate: {
    default: defaults.rotate,
    validate: v => !isStartNumeric(v) ? '[particles] rotate invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  color: {
    default: defaults.color,
    validate: v => !isStartColor(v) ? '[particles] color invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  alpha: {
    default: defaults.alpha,
    validate: v => !isStartNumeric(v) ? '[particles] alpha invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  emissive: {
    default: defaults.emissive,
    validate: v => !isStartNumeric(v) ? '[particles] emissive invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  image: {
    default: defaults.image,
    validate: v => !isString(v) ? '[particles] image not a string' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  spritesheet: {
    default: defaults.spritesheet,
    validate: v => v !== null && !isSpritesheet(v) ? '[particles] spritesheet invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  blending: {
    default: defaults.blending,
    validate: v => !isBlending(v) ? '[particles] blending invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  lit: {
    default: defaults.lit,
    validate: v => !isBoolean(v) ? '[particles] lit not a boolean' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  billboard: {
    default: defaults.billboard,
    validate: v => !isBillboard(v) ? '[particles] billboard invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  space: {
    default: defaults.space,
    validate: v => v !== null && !isSpace(v) ? '[particles] space invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  force: {
    default: defaults.force,
    validate: v => v !== null && !v.isVector3 ? '[particles] force not a Vector3' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  velocityLinear: {
    default: defaults.velocityLinear,
    validate: v => v !== null && !v.isVector3 ? '[particles] velocityLinear not a Vector3' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  velocityOrbital: {
    default: defaults.velocityOrbital,
    validate: v => v !== null && !v.isVector3 ? '[particles] velocityOrbital not a Vector3' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  velocityRadial: {
    default: defaults.velocityRadial,
    validate: v => v !== null && !isNumber(v) ? '[particles] velocityRadial not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  rateOverDistance: {
    default: defaults.rateOverDistance,
    validate: v => !isNumber(v) ? '[particles] rateOverDistance not a number' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  sizeOverLife: {
    default: defaults.sizeOverLife,
    validate: v => v !== null && !isString(v) ? '[particles] sizeOverLife invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  rotateOverLife: {
    default: defaults.rotateOverLife,
    validate: v => v !== null && !isString(v) ? '[particles] rotateOverLife invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  colorOverLife: {
    default: defaults.colorOverLife,
    validate: v => v !== null && !isString(v) ? '[particles] colorOverLife invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  alphaOverLife: {
    default: defaults.alphaOverLife,
    validate: v => v !== null && !isString(v) ? '[particles] alphaOverLife invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  emissiveOverLife: {
    default: defaults.emissiveOverLife,
    validate: v => v !== null && !isString(v) ? '[particles] emissiveOverLife invalid' : null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
  onEnd: {
    default: defaults.onEnd,
    validate: () => null,
    onSet() {
      this.needsRebuild = true
      this.setDirty()
    },
  },
}

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
    var self = this
    if (!this.proxy) {
      let proxy = {
        get emitting() {
          return self.emitting
        },
        set emitting(value) {
          self.emitting = value
        },
        get shape() {
          return self.shape
        },
        set shape(value) {
          self.shape = value
        },
        get direction() {
          return self.direction
        },
        set direction(value) {
          self.direction = value
        },
        get rate() {
          return self.rate
        },
        set rate(value) {
          self.rate = value
        },
        get bursts() {
          return self.bursts
        },
        set bursts(value) {
          self.bursts = value
        },
        get duration() {
          return self.duration
        },
        set duration(value) {
          self.duration = value
        },
        get loop() {
          return self.loop
        },
        set loop(value) {
          self.loop = value
        },
        get max() {
          return self.max
        },
        set max(value) {
          self.max = value
        },
        get timescale() {
          return self.timescale
        },
        set timescale(value) {
          self.timescale = value
        },
        get life() {
          return self.life
        },
        set life(value) {
          self.life = value
        },
        get speed() {
          return self.speed
        },
        set speed(value) {
          self.speed = value
        },
        get size() {
          return self.size
        },
        set size(value) {
          self.size = value
        },
        get rotate() {
          return self.rotate
        },
        set rotate(value) {
          self.rotate = value
        },
        get color() {
          return self.color
        },
        set color(value) {
          self.color = value
        },
        get alpha() {
          return self.alpha
        },
        set alpha(value) {
          self.alpha = value
        },
        get emissive() {
          return self.emissive
        },
        set emissive(value) {
          self.emissive = value
        },
        get image() {
          return self.image
        },
        set image(value) {
          self.image = value
        },
        get spritesheet() {
          return self.spritesheet
        },
        set spritesheet(value) {
          self.spritesheet = value
        },
        get blending() {
          return self.blending
        },
        set blending(value) {
          self.blending = value
        },
        get lit() {
          return self.lit
        },
        set lit(value) {
          self.lit = value
        },
        get billboard() {
          return self.billboard
        },
        set billboard(value) {
          self.billboard = value
        },
        get space() {
          return self.space
        },
        set space(value) {
          self.space = value
        },
        get force() {
          return self.force
        },
        set force(value) {
          self.force = value
        },
        get velocityLinear() {
          return self.velocityLinear
        },
        set velocityLinear(value) {
          self.velocityLinear = value
        },
        get velocityOrbital() {
          return self.velocityOrbital
        },
        set velocityOrbital(value) {
          self.velocityOrbital = value
        },
        get velocityRadial() {
          return self.velocityRadial
        },
        set velocityRadial(value) {
          self.velocityRadial = value
        },
        get rateOverDistance() {
          return self.rateOverDistance
        },
        set rateOverDistance(value) {
          self.rateOverDistance = value
        },
        get sizeOverLife() {
          return self.sizeOverLife
        },
        set sizeOverLife(value) {
          self.sizeOverLife = value
        },
        get rotateOverLife() {
          return self.rotateOverLife
        },
        set rotateOverLife(value) {
          self.rotateOverLife = value
        },
        get colorOverLife() {
          return self.colorOverLife
        },
        set colorOverLife(value) {
          self.colorOverLife = value
        },
        get alphaOverLife() {
          return self.alphaOverLife
        },
        set alphaOverLife(value) {
          self.alphaOverLife = value
        },
        get emissiveOverLife() {
          return self.emissiveOverLife
        },
        set emissiveOverLife(value) {
          self.emissiveOverLife = value
        },
        get onEnd() {
          return self.onEnd
        },
        set onEnd(value) {
          self.onEnd = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
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
