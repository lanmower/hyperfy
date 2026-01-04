import * as pc from '../../extras/playcanvas.js'
import { DEG2RAD } from '../../extras/general.js'
import { BaseFactory } from '../../patterns/BaseFactory.js'

export class ParticleMaterialFactory extends BaseFactory {
  static create(config) {
    this.validate(config)
    const { node, uniforms, loader } = config
    return this.createMaterial(node, uniforms, loader)
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('ParticleMaterialFactory config must be an object')
    }
    if (!config.node || !config.uniforms) {
      throw new Error('ParticleMaterialFactory config requires node and uniforms')
    }
  }

  static createMaterial(node, uniforms, loader) {
    const gd = window.pc?.app?.graphicsDevice
    if (!gd) throw new Error('PlayCanvas graphics device not initialized')

    const material = new pc.StandardMaterial()
    material.diffuse.set(1, 1, 1)
    material.emissive.set(0, 0, 0)
    material.metalness = node._lit ? 0 : 0
    material.roughness = node._lit ? 1 : 1
    material.transparent = true
    material.opacity = 1
    material.twoSided = true
    material.depthWrite = false

    if (loader) {
      loader.load('texture', node._image).then(texture => {
        material.diffuseMap = texture
      })
    }

    material.uBillboard = this.billboardModeInts[node._billboard]
    material.uOrientation = uniforms.uOrientation

    return material
  }

  static billboardModeInts = {
    full: 0,
    y: 1,
    direction: 2,
  }
}
