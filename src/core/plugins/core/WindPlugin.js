import * as THREE from 'three'
import { Plugin } from '../Plugin.js'

export class WindPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.uniforms = {
      time: { value: 0 },
      strength: { value: 1 },
      direction: { value: new THREE.Vector3(1, 0, 0) },
      speed: { value: 0.5 },
      noiseScale: { value: 1 },
      ampScale: { value: 0.2 },
      freqMultiplier: { value: 1 },
    }
  }

  getAPI() {
    return {
      getUniforms: () => this.uniforms,
      setStrength: (value) => { this.uniforms.strength.value = value },
      setDirection: (vector) => { this.uniforms.direction.value.copy(vector) },
      setSpeed: (value) => { this.uniforms.speed.value = value },
    }
  }
}
