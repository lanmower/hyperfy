export function createSpritesheet(options) {
  if (!options) {
    return () => [0, 0, 1, 1]
  }
  const [rows, cols, frameRate, loop] = options
  const totalFrames = rows * cols
  const uvFrames = []
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const col = frameIndex % cols
    const row = Math.floor(frameIndex / cols)
    const u0 = col / cols
    const v0 = (rows - row - 1) / rows
    const u1 = (col + 1) / cols
    const v1 = (rows - row) / rows
    uvFrames.push([u0, v0, u1, v1])
  }
  return (particle, delta) => {
    particle.frameTime += delta
    const frameDuration = 1 / frameRate
    const rawFrame = particle.frameTime / frameDuration
    let idx
    if (loop) {
      idx = Math.floor(rawFrame) % totalFrames
    } else {
      idx = Math.min(Math.floor(rawFrame), totalFrames - 1)
    }
    return uvFrames[idx]
  }
}
