import { Vector3, Quaternion } from '../../core/extras/three.js'

export function createParticlePool(maxParticles) {
  const particles = []
  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      age: 0,
      life: 0,
      direction: new Vector3(),
      velocity: new Vector3(),
      distance: 0,
      speed: 10,
      finalPosition: new Vector3(),
      frameTime: 0,
      uv: [0, 0, 1, 1],
      position: new Vector3(),
      rotation: 0,
      startRotation: 0,
      size: 1,
      startSize: 1,
      color: [1, 1, 1],
      startColor: [1, 1, 1],
      alpha: 1,
      startAlpha: 1,
      emissive: 1,
      startEmissive: 1,
      emissionPosition: new Vector3(),
      emissionRotation: new Quaternion(),
    })
  }
  return particles
}
