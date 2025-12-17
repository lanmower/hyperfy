import { System } from './System.js'

import * as THREE from '../extras/three.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { clamp, num, uuid } from '../utils.js'
import { Curve } from '../extras/Curve.js'
import { prng } from '../extras/prng.js'
import { BufferedLerpVector3 } from '../extras/BufferedLerpVector3.js'
import { BufferedLerpQuaternion } from '../extras/BufferedLerpQuaternion.js'


export class Scripts extends System {
  constructor(world) {
    super(world)
    this.compartment = new Compartment({
      console: {
        log: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
        time: (...args) => console.time(...args),
        timeEnd: (...args) => console.timeEnd(...args),
      },
      Date: {
        now: () => Date.now(),
      },
      URL: {
        createObjectURL: blob => URL.createObjectURL(blob),
      },
      Math,
      eval: undefined,
      harden: undefined,
      lockdown: undefined,
      num,
      prng,
      clamp,
      Object3D: THREE.Object3D,
      Quaternion: THREE.Quaternion,
      Vector3: THREE.Vector3,
      Euler: THREE.Euler,
      Matrix4: THREE.Matrix4,
      BufferedLerpVector3,
      BufferedLerpQuaternion,
      Curve,
      DEG2RAD,
      RAD2DEG,
      uuid,
    })
  }

  evaluate(code) {
    let value
    const result = {
      exec: (...args) => {
        if (!value) value = this.compartment.evaluate(wrapRawCode(code))
        return value(...args)
      },
      code,
    }
    return result
  }
}

function wrapRawCode(code) {
  return `
  (function() {
    const shared = {}
    return (world, app, fetch, props, setTimeout) => {
      ${code}
    }
  })()
  `
}
