import * as pc from '../../extras/playcanvas.js'

export const PARTICLE_ATTRIBUTES = {
  aPosition: 3,
  aRotation: 1,
  aDirection: 3,
  aSize: 1,
  aColor: 3,
  aAlpha: 1,
  aEmissive: 1,
  aUV: 4,
}

export class ParticleGeometryBuilder {
  static create(maxParticles) {
    const gd = window.pc?.app?.graphicsDevice
    if (!gd) throw new Error('PlayCanvas graphics device not initialized')

    const geometry = pc.createPlane(gd, { halfExtents: new pc.Vec3(0.5, 0.5, 0) })

    const buffers = {}
    for (const [name, size] of Object.entries(PARTICLE_ATTRIBUTES)) {
      buffers[name] = new Float32Array(maxParticles * size)
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
