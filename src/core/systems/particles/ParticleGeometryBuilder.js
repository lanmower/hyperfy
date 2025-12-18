import * as THREE from '../../extras/three.js'

export class ParticleGeometryBuilder {
  static create(maxParticles) {
    const geometry = new THREE.PlaneGeometry(1, 1)

    const attributes = {
      aPosition: { size: 3, stride: maxParticles * 3 },
      aRotation: { size: 1, stride: maxParticles * 1 },
      aDirection: { size: 3, stride: maxParticles * 3 },
      aSize: { size: 1, stride: maxParticles * 1 },
      aColor: { size: 3, stride: maxParticles * 3 },
      aAlpha: { size: 1, stride: maxParticles * 1 },
      aEmissive: { size: 1, stride: maxParticles * 1 },
      aUV: { size: 4, stride: maxParticles * 4 },
    }

    const buffers = {}
    for (const [name, config] of Object.entries(attributes)) {
      const buffer = new THREE.InstancedBufferAttribute(
        new Float32Array(config.stride),
        config.size
      )
      buffer.setUsage(THREE.DynamicDrawUsage)
      geometry.setAttribute(name, buffer)
      buffers[name] = buffer
    }

    return { geometry, buffers }
  }

  static createNextBuffers(maxParticles) {
    return {
      aPosition: new Float32Array(maxParticles * 3),
      aRotation: new Float32Array(maxParticles * 1),
      aDirection: new Float32Array(maxParticles * 3),
      aSize: new Float32Array(maxParticles * 1),
      aColor: new Float32Array(maxParticles * 3),
      aAlpha: new Float32Array(maxParticles * 1),
      aEmissive: new Float32Array(maxParticles * 1),
      aUV: new Float32Array(maxParticles * 4),
    }
  }
}
