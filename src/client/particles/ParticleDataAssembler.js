export class ParticleDataAssembler {
  assemble(particles, config, arrays) {
    const { aPosition, aRotation, aDirection, aSize, aColor, aAlpha, aEmissive, aUV } = arrays

    if (config.blending === 'normal') {
      particles.sort((a, b) => b.distance - a.distance)
    }

    let n = 0
    for (const particle of particles) {
      if (particle.age >= particle.life) continue

      aPosition[n * 3 + 0] = particle.finalPosition.x
      aPosition[n * 3 + 1] = particle.finalPosition.y
      aPosition[n * 3 + 2] = particle.finalPosition.z
      aRotation[n * 1 + 0] = particle.rotation

      aDirection[n * 3 + 0] = particle.direction.x
      aDirection[n * 3 + 1] = particle.direction.y
      aDirection[n * 3 + 2] = particle.direction.z

      aSize[n * 1 + 0] = particle.size
      aColor[n * 3 + 0] = particle.color[0]
      aColor[n * 3 + 1] = particle.color[1]
      aColor[n * 3 + 2] = particle.color[2]
      aAlpha[n * 1 + 0] = particle.alpha
      aEmissive[n * 1 + 0] = particle.emissive
      aUV[n * 4 + 0] = particle.uv[0]
      aUV[n * 4 + 1] = particle.uv[1]
      aUV[n * 4 + 2] = particle.uv[2]
      aUV[n * 4 + 3] = particle.uv[3]
      n++
    }

    return n
  }
}
