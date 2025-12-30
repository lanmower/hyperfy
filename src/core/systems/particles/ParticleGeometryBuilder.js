$1\n\nexport const PARTICLE_ATTRIBUTES = {\n  aPosition: 3,\n  aRotation: 1,\n  aDirection: 3,\n  aSize: 1,\n  aColor: 3,\n  aAlpha: 1,\n  aEmissive: 1,\n  aUV: 4,\n}\n\nexport class ParticleGeometryBuilder {
  static create(maxParticles) {
    const geometry = new THREE.PlaneGeometry(1, 1)

    const attributes = Object.fromEntries(\n      Object.entries(PARTICLE_ATTRIBUTES).map(([name, size]) => [\n        name,\n        { size, stride: maxParticles * size }\n      ])\n    ),
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
