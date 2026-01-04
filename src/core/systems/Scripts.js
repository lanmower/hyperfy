import { System } from './System.js'

import * as THREE from '../extras/three.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { clamp, num, uuid } from '../utils.js'
import { Curve } from '../extras/Curve.js'
import { prng } from '../extras/prng.js'
import { BufferedLerpVector3 } from '../extras/BufferedLerpVector3.js'
import { BufferedLerpQuaternion } from '../extras/BufferedLerpQuaternion.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('Scripts')

class FallbackCompartment {
  constructor(globals) {
    this.globals = globals
    this.sandboxAvailable = false
    logger.warn('SECURITY BOUNDARY: No SES Compartment available, using unvetted Function() sandbox', {
      context: 'FallbackCompartment initialization',
      hasSES: false,
    })
  }

  evaluate(source) {
    this.validateScript(source)
    const paramNames = Object.keys(this.globals).filter(name => !['eval', 'arguments'].includes(name))
    const paramValues = paramNames.map(name => this.globals[name])
    const wrappedCode = `'use strict'; return (${source})`
    const fn = new Function(...paramNames, wrappedCode)
    return fn(...paramValues)
  }

  validateScript(code) {
    const blocklist = [
      /Object\.prototype/g,
      /Object\s*\[\s*['"]prototype['"]\s*\]/g,
      /globalThis\./g,
      /__proto__/g,
      /\['__proto__'\]/g,
      /\["__proto__"\]/g,
      /constructor\s*\[/g,
      /\['constructor'\]/g,
      /\["constructor"\]/g,
      /\.constructor\s*\[/g,
      /require\(/g,
      /eval\(/g,
      /Function\s*\(/g,
      /import\s*\(/g,
      /import\s+/g,
    ]

    for (const pattern of blocklist) {
      if (pattern.test(code)) {
        logger.error('SECURITY VIOLATION: Script blocked by pattern matching', {
          context: 'Script validation',
          pattern: pattern.source,
          blocked: true,
        })
        throw new Error(`Script contains blocked pattern: ${pattern.source}`)
      }
    }
  }
}

const CompartmentImpl = typeof globalThis.Compartment === 'function' ? globalThis.Compartment : FallbackCompartment

class SecureCompartment {
  constructor(globals) {
    this.impl = new CompartmentImpl(globals)
    const hasSES = typeof globalThis.Compartment === 'function'
    if (!hasSES) {
      logger.error('SECURITY BOUNDARY: Script execution without SES sandbox', {
        context: 'SecureCompartment initialization',
        sandboxStatus: 'FALLBACK',
        risk: 'Prototype pollution possible if validation bypassed',
      })
    }
  }

  evaluate(source) {
    return this.impl.evaluate(source)
  }
}

const Compartment = SecureCompartment

export class Scripts extends System {
  constructor(world) {
    super(world)
    const scriptLogger = new StructuredLogger('ScriptExecution')
    this.compartment = new Compartment({
      console: {
        log: (...args) => scriptLogger.info('Script log', { args: args.join(' ') }),
        warn: (...args) => scriptLogger.warn('Script warning', { args: args.join(' ') }),
        error: (...args) => scriptLogger.error('Script error', { args: args.join(' ') }),
        time: () => {},
        timeEnd: () => {},
      },
      scriptLogger: {
        error: (message, context) => scriptLogger.error(message, context),
      },
      Date: {
        now: () => Date.now(),
      },
      URL: {
        createObjectURL: blob => URL.createObjectURL(blob),
      },
      Object: {
        keys: Object.keys,
        values: Object.values,
        entries: Object.entries,
        assign: (target, ...sources) => {
          for (const source of sources) {
            for (const key of Object.keys(source)) {
              if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
                target[key] = source[key]
              }
            }
          }
          return target
        },
        create: Object.create,
        defineProperty: (obj, prop, desc) => {
          if (prop === '__proto__' || prop === 'constructor' || prop === 'prototype') {
            throw new Error(`Cannot define property: ${prop}`)
          }
          return Object.defineProperty(obj, prop, desc)
        },
        getOwnPropertyNames: Object.getOwnPropertyNames,
        getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
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

  destroy() {
    this.compartment = null
  }
}

function wrapRawCode(code) {
  return `
  (function() {
    const shared = {}
    return (world, app, fetch, props, setTimeout) => {
      try {
        ${code}
      } catch (err) {
        scriptLogger.error('Error executing app script', { error: err.message })
      }
    }
  })()
  `
}
