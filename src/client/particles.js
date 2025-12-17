const emitters = {}

import { DEG2RAD } from '../core/extras/general.js'
import { Vector3, Quaternion, Matrix4, Color } from '../core/extras/three.js'

const v1 = new Vector3()
const v2 = new Vector3()
const v3 = new Vector3()
const v4 = new Vector3()
const v5 = new Vector3()
const q1 = new Quaternion()
const q2 = new Quaternion()
const q3 = new Quaternion()
const m1 = new Matrix4()
const color1 = new Color()

const xAxis = new Vector3(1, 0, 0)
const yAxis = new Vector3(0, 1, 0)
const zAxis = new Vector3(0, 0, 1)

self.onmessage = msg => {
  msg = msg.data
  switch (msg.op) {
    case 'create':
      const system = createEmitter(msg)
      emitters[msg.id] = system
      break
    case 'emitting':
      emitters[msg.emitterId]?.setEmitting(msg.value)
      break
    case 'update':
      emitters[msg.emitterId]?.update(msg)
      break
    case 'destroy':
      emitters[msg.emitterId]?.destroy()
      emitters[msg.emitterId] = null
      break
  }
}

function createEmitter(config) {
  config.bursts.sort((a, b) => a.time - b.time)

  let elapsed = 0
  let duration = config.duration
  let newParticlesByTime = 0
  let newParticlesByDist = 0
  let emitting = config.emitting
  let bursts = config.bursts.slice()
  let ended = false
  let rateOverDistance = config.rateOverDistance
  let distanceRemainder = 0
  let lastWorldPos = null
  let moveDir = new Vector3()

  const particles = []

  for (let i = 0; i < config.max; i++) {
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

  const life = createNumericStarter(config.life)
  const speed = createNumericStarter(config.speed)
  const size = createNumericStarter(config.size)
  const rotation = createNumericStarter(config.rotate)
  const color = createColorStarter(config.color)
  const alpha = createNumericStarter(config.alpha)
  const emissive = createNumericStarter(config.emissive)

  const shape = createShape(config.shape)
  const spritesheet = createSpritesheet(config.spritesheet)
  const force = config.force ? new Vector3().fromArray(config.force) : null
  const velocityLinear = config.velocityLinear ? new Vector3().fromArray(config.velocityLinear) : null
  const velocityOrbital = config.velocityOrbital ? new Vector3().fromArray(config.velocityOrbital) : null
  const velocityRadial = config.velocityRadial || null

  const sizeOverLife = config.sizeOverLife ? createNumberCurve(config.sizeOverLife) : null
  const rotateOverLife = config.rotateOverLife ? createNumberCurve(config.rotateOverLife) : null
  const colorOverLife = config.colorOverLife ? createColorCurve(config.colorOverLife) : null
  const alphaOverLife = config.alphaOverLife ? createNumberCurve(config.alphaOverLife) : null
  const emissiveOverLife = config.emissiveOverLife ? createNumberCurve(config.emissiveOverLife) : null

  function emit({ amount, matrixWorld }) {
    const progress = elapsed / config.duration // ratio through this cycle (0 to 1)
    for (let i = 0; i < amount; i++) {
      const particle = particles.find(p => p.age >= p.life)
      if (!particle) break
      particle.age = 0
      particle.life = life(progress)
      particle.speed = speed(progress)
      particle.size = size(progress)
      particle.startSize = particle.size
      particle.rotation = rotation(progress)
      particle.startRotation = particle.rotation
      particle.color = color(progress)
      particle.alpha = alpha(progress)
      particle.startAlpha = particle.alpha
      particle.emissive = emissive(progress)
      particle.startEmissive = particle.emissive

      particle.frameTime = 0
      particle.uv = spritesheet(particle, 0)

      shape(particle.position, particle.direction)

      if (config.direction > 0) {
        const randomFactor = config.direction
        particle.direction.x += (Math.random() * 2 - 1) * randomFactor
        particle.direction.y += (Math.random() * 2 - 1) * randomFactor
        particle.direction.z += (Math.random() * 2 - 1) * randomFactor
        particle.direction.normalize()
      }

      particle.velocity.copy(particle.direction).multiplyScalar(particle.speed)

      particle.distance = Infinity

      if (config.space === 'world') {
        particle.position.applyMatrix4(matrixWorld)
        q1.setFromRotationMatrix(matrixWorld)
        particle.direction.applyQuaternion(q1)
        particle.velocity.applyQuaternion(q1)

        particle.emissionPosition.setFromMatrixPosition(matrixWorld)
        particle.emissionRotation.setFromRotationMatrix(matrixWorld)
      } else {
        particle.emissionPosition.set(0, 0, 0)
        particle.emissionRotation.identity()
      }
    }
  }

  function update({
    delta,
    camPosition,
    matrixWorld,
    aPosition,
    aRotation,
    aDirection,
    aSize,
    aColor,
    aAlpha,
    aEmissive,
    aUV,
  }) {
    delta *= config.timescale
    matrixWorld = m1.fromArray(matrixWorld)
    camPosition = v1.fromArray(camPosition)
    elapsed += delta
    const currWorldPos = v2.setFromMatrixPosition(matrixWorld)
    let distanceMoved
    if (lastWorldPos) {
      distanceMoved = currWorldPos.distanceTo(lastWorldPos)
      if (distanceMoved > 0.0001) {
        moveDir.copy(currWorldPos).sub(lastWorldPos).normalize()
      }
    } else {
      distanceMoved = 0
      lastWorldPos = currWorldPos.clone()
    }


    if (emitting) {
      newParticlesByTime += config.rate * delta
      const amount = Math.floor(newParticlesByTime)
      if (amount > 0) emit({ amount, matrixWorld })
      newParticlesByTime -= amount
    }
    if (emitting && rateOverDistance && distanceMoved > 0) {
      const distanceBetweenParticles = 1.0 / rateOverDistance

      distanceRemainder += distanceMoved

      const particlesToEmit = Math.floor(distanceRemainder / distanceBetweenParticles)

      if (particlesToEmit > 0) {
        for (let i = 0; i < particlesToEmit; i++) {
          const lerpFactor = (i + 1) / (particlesToEmit + 1)

          const emitPosition = new Vector3().copy(lastWorldPos).lerp(currWorldPos, lerpFactor)

          const tempMatrix = new Matrix4().copy(matrixWorld)
          tempMatrix.setPosition(emitPosition)

          emit({
            amount: 1,
            matrixWorld: tempMatrix,
          })
        }

        distanceRemainder -= particlesToEmit * distanceBetweenParticles
      }
    }
    lastWorldPos.copy(currWorldPos)
    while (bursts.length && bursts[0].time <= elapsed) {
      const burst = bursts.shift()
      emit({ amount: burst.count, matrixWorld })
    }
    for (const particle of particles) {
      particle.age += delta
      if (particle.age >= particle.life) continue
      const progress = particle.age / particle.life
      if (force) {
        v3.copy(force).multiplyScalar(delta)
        particle.velocity.add(v3)
      }
      if (velocityLinear) {
        v3.copy(velocityLinear).multiplyScalar(delta)
        if (config.space === 'world') {
          particle.position.add(v3)
        } else {
          v3.applyQuaternion(q1.setFromRotationMatrix(matrixWorld))
          particle.position.add(v3)
        }
      }
      if (velocityOrbital) {
        v3.copy(particle.position)
        if (config.space === 'world') {
          v3.sub(particle.emissionPosition)
        }
        if (velocityOrbital.x !== 0) {
          q2.setFromAxisAngle(xAxis, velocityOrbital.x * delta)
          v3.applyQuaternion(q2)
        }
        if (velocityOrbital.y !== 0) {
          q2.setFromAxisAngle(yAxis, velocityOrbital.y * delta)
          v3.applyQuaternion(q2)
        }
        if (velocityOrbital.z !== 0) {
          q2.setFromAxisAngle(zAxis, velocityOrbital.z * delta)
          v3.applyQuaternion(q2)
        }

        if (config.space === 'world') {
          particle.position.copy(particle.emissionPosition).add(v3)
        } else {
          particle.position.copy(v3) // Just use the rotated vector directly
        }

        if (v3.length() > 0.001) {
          const orbitSpeed =
            v3.length() *
            Math.max(Math.abs(velocityOrbital.x), Math.abs(velocityOrbital.y), Math.abs(velocityOrbital.z))
          v4.crossVectors(
            velocityOrbital.x > 0
              ? new Vector3(1, 0, 0)
              : velocityOrbital.y > 0
                ? new Vector3(0, 1, 0)
                : new Vector3(0, 0, 1),
            v3
          ).normalize()
          v4.multiplyScalar(orbitSpeed)
          particle.velocity.copy(v4)
        }
      }
      if (velocityRadial) {
        const radialCenter = config.space === 'world' ? particle.emissionPosition : currWorldPos
        v3.copy(particle.position).sub(radialCenter)
        if (v3.length() > 0.001) {
          v3.normalize()
          v3.multiplyScalar(velocityRadial * delta)
          particle.position.add(v3)
          particle.velocity.add(v3.divideScalar(delta))
        }
      }
      v3.copy(particle.velocity).multiplyScalar(delta)
      particle.position.add(v3)
      if (sizeOverLife) {
        const multiplier = sizeOverLife(progress)
        particle.size = particle.startSize * multiplier
      }
      if (rotateOverLife) {
        const rotation = rotateOverLife(progress)
        particle.rotation = particle.startRotation + rotation
      }
      if (colorOverLife) {
        particle.color = colorOverLife(progress)
      }
      if (alphaOverLife) {
        const multiplier = alphaOverLife(progress)
        particle.alpha = particle.startAlpha * multiplier
      }
      if (emissiveOverLife) {
        const multiplier = emissiveOverLife(progress)
        particle.emissive = particle.startEmissive * multiplier
      }
      particle.finalPosition.copy(particle.position)
      if (config.space === 'local') {
        particle.finalPosition.applyMatrix4(matrixWorld)
      }
      particle.distance = particle.position.distanceToSquared(camPosition)

      if (config.spritesheet) {
        particle.uv = spritesheet(particle, delta)
      }
    }
    if (elapsed >= duration) {
      elapsed = 0
      bursts = config.bursts.slice()
      if (!config.loop) emitting = false
    }
    if (!config.loop && !emitting && !ended) {
      const activeParticles = particles.filter(p => p.age < p.life).length
      if (activeParticles === 0) {
        ended = true
        self.postMessage({
          emitterId: config.id,
          op: 'end',
        })
      }
    }
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
      aUV[n * 4 + 0] = particle.uv[0] // u0
      aUV[n * 4 + 1] = particle.uv[1] // v0
      aUV[n * 4 + 2] = particle.uv[2] // u1
      aUV[n * 4 + 3] = particle.uv[3] // v1
      n++
    }
    self.postMessage(
      {
        emitterId: config.id,
        op: 'update',
        n,
        aPosition,
        aRotation,
        aDirection,
        aSize,
        aColor,
        aAlpha,
        aEmissive,
        aUV,
      },
      [
        aPosition.buffer,
        aRotation.buffer,
        aDirection.buffer,
        aSize.buffer,
        aColor.buffer,
        aAlpha.buffer,
        aEmissive.buffer,
        aUV.buffer,
      ]
    )
  }

  function destroy() {
    particles.length = 0
  }

  return {
    setEmitting(value) {
      emitting = value
    },
    update,
    destroy,
  }
}

function createNumericStarter(str) {
  if (str.includes('-')) {
    const [start, end] = str.split('-').map(n => parseFloat(n))
    return createNumericStarterLinear(start, end)
  }
  if (str.includes('~')) {
    const [from, to] = str.split('~').map(n => parseFloat(n))
    return createNumericStarterRandom(from, to)
  }
  const n = parseFloat(str)
  return createNumericStarterFixed(n)
}

function createNumericStarterLinear(start, end) {
  const fn = progress => {
    return start + (end - start) * progress
  }
  fn.kind = 'linear'
  return fn
}

function createNumericStarterRandom(from, to) {
  const fn = () => {
    return from + Math.random() * (to - from)
  }
  fn.kind = 'random'
  return fn
}

function createNumericStarterFixed(n) {
  const fn = () => {
    return n
  }
  fn.kind = 'fixed'
  return fn
}

function createColorStarter(str) {
  if (str.includes('-')) {
    const [start, end] = str.split('-').map(toRGB)
    return createColorStarterLinear(start, end)
  }
  if (str.includes('~')) {
    const [from, to] = str.split('~').map(toRGB)
    return createColorStarterRandom(from, to)
  }
  const rgb = toRGB(str)
  return createColorStarterFixed(rgb)
}

function createColorStarterLinear(start, end) {
  const fn = progress => {
    return [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
      start[2] + (end[2] - start[2]) * progress,
    ]
  }
  fn.kind = 'linear'
  return fn
}

function createColorStarterRandom(from, to) {
  const fn = () => {
    const t = Math.random()
    return [from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1]), from[2] + t * (to[2] - from[2])]
  }
  fn.kind = 'random'
  return fn
}

function createColorStarterFixed(rgb) {
  const fn = () => {
    return rgb
  }
  fn.kind = 'fixed'
  return fn
}

function toRGB(color) {
  try {
    color1.set(color)
    return [color1.r, color1.g, color1.b]
  } catch (error) {
    console.warn(`[particles] color '${color}' could not be parsed, using white instead.`)
    return [1, 1, 1]
  }
}

function createShape(config) {
  const [type, ...args] = config
  const v = new Vector3()
  const normal = new Vector3()

  switch (type) {
    case 'point':
      return (pos, dir) => {
        pos.set(0, 0, 0)
        dir.set(0, 1, 0)
      }

    case 'sphere':
      return (pos, dir) => {
        const [radius, thickness] = args
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)

        dir.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi))

        const radiusScale = thickness === 0 ? 1 : Math.pow(Math.random(), 1 / 3) * thickness + (1 - thickness)

        pos.copy(dir).multiplyScalar(radius * radiusScale)
      }

    case 'hemisphere':
      return (pos, dir) => {
        const [radius, thickness] = args
        const u = Math.random()
        const cosTheta = Math.random() // Range [0,1] for upper hemisphere only
        const theta = 2 * Math.PI * u
        const phi = Math.acos(cosTheta) // Range [0,π/2]

        normal.set(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi), // This is always positive (y >= 0)
          Math.sin(phi) * Math.sin(theta)
        )

        const radiusScale = thickness === 0 ? 1 : Math.pow(Math.random(), 1 / 3) * thickness + (1 - thickness)

        pos.copy(normal).multiplyScalar(radius * radiusScale)
        dir.copy(normal)
      }

    case 'cone':
      return (pos, dir) => {
        let [baseRadius, thickness, angleFromCenter] = args
        angleFromCenter *= DEG2RAD

        const angle = Math.random() * Math.PI * 2

        let radiusScale
        if (thickness === 0) {
          radiusScale = 1 // Edge only
        } else {
          radiusScale = Math.sqrt(Math.random()) * thickness + (1 - thickness)
        }

        const x = Math.cos(angle) * baseRadius * radiusScale
        const z = Math.sin(angle) * baseRadius * radiusScale

        pos.set(x, 0, z)

        dir
          .set(
            Math.sin(angleFromCenter) * Math.cos(angle),
            Math.cos(angleFromCenter),
            Math.sin(angleFromCenter) * Math.sin(angle)
          )
          .normalize()
      }

    case 'box':
      return (pos, dir) => {
        const [width, height, depth, thickness, origin, spherize] = args

        if (origin === 'volume') {
          if (thickness === 0 || Math.random() > thickness) {
            const face = Math.floor(Math.random() * 6)
            switch (face) {
              case 0: // +X face
                pos.set(width / 2, (Math.random() - 0.5) * height, (Math.random() - 0.5) * depth)
                if (!spherize) dir.set(1, 0, 0)
                break
              case 1: // -X face
                pos.set(-width / 2, (Math.random() - 0.5) * height, (Math.random() - 0.5) * depth)
                if (!spherize) dir.set(-1, 0, 0)
                break
              case 2: // +Y face
                pos.set((Math.random() - 0.5) * width, height / 2, (Math.random() - 0.5) * depth)
                if (!spherize) dir.set(0, 1, 0)
                break
              case 3: // -Y face
                pos.set((Math.random() - 0.5) * width, -height / 2, (Math.random() - 0.5) * depth)
                if (!spherize) dir.set(0, -1, 0)
                break
              case 4: // +Z face
                pos.set((Math.random() - 0.5) * width, (Math.random() - 0.5) * height, depth / 2)
                if (!spherize) dir.set(0, 0, 1)
                break
              case 5: // -Z face
                pos.set((Math.random() - 0.5) * width, (Math.random() - 0.5) * height, -depth / 2)
                if (!spherize) dir.set(0, 0, -1)
                break
            }

            if (spherize) {
              dir.copy(pos).normalize()
              if (dir.length() === 0) {
                dir.set(0, 1, 0)
              }
            }
          } else {
            const randomX = (Math.random() - 0.5) * width
            const randomY = (Math.random() - 0.5) * height
            const randomZ = (Math.random() - 0.5) * depth

            const distToRight = (width / 2 - Math.abs(randomX)) / (width / 2)
            const distToTop = (height / 2 - Math.abs(randomY)) / (height / 2)
            const distToFront = (depth / 2 - Math.abs(randomZ)) / (depth / 2)

            const minDist = Math.min(distToRight, distToTop, distToFront)

            if (minDist <= thickness) {
              pos.set(randomX, randomY, randomZ)

              if (spherize) {
                dir.copy(pos).normalize()
                if (dir.length() === 0) {
                  dir.set(0, 1, 0)
                }
              } else {
                if (distToRight === minDist) dir.set(Math.sign(randomX), 0, 0)
                else if (distToTop === minDist) dir.set(0, Math.sign(randomY), 0)
                else if (distToFront === minDist) dir.set(0, 0, Math.sign(randomZ))
              }
            } else {
              return createShape(['box', width, height, depth, thickness, origin, spherize])(pos, dir)
            }
          }
        } else if (origin === 'edge') {
          const edge = Math.floor(Math.random() * 12)
          let x, y, z

          switch (edge) {
            case 0: // Bottom X-aligned edge (front)
              x = (Math.random() - 0.5) * width
              y = -height / 2
              z = depth / 2
              break
            case 1: // Bottom X-aligned edge (back)
              x = (Math.random() - 0.5) * width
              y = -height / 2
              z = -depth / 2
              break
            case 2: // Bottom Z-aligned edge (left)
              x = -width / 2
              y = -height / 2
              z = (Math.random() - 0.5) * depth
              break
            case 3: // Bottom Z-aligned edge (right)
              x = width / 2
              y = -height / 2
              z = (Math.random() - 0.5) * depth
              break

            case 4: // Top X-aligned edge (front)
              x = (Math.random() - 0.5) * width
              y = height / 2
              z = depth / 2
              break
            case 5: // Top X-aligned edge (back)
              x = (Math.random() - 0.5) * width
              y = height / 2
              z = -depth / 2
              break
            case 6: // Top Z-aligned edge (left)
              x = -width / 2
              y = height / 2
              z = (Math.random() - 0.5) * depth
              break
            case 7: // Top Z-aligned edge (right)
              x = width / 2
              y = height / 2
              z = (Math.random() - 0.5) * depth
              break

            case 8: // Vertical Y-aligned edge (front left)
              x = -width / 2
              y = (Math.random() - 0.5) * height
              z = depth / 2
              break
            case 9: // Vertical Y-aligned edge (front right)
              x = width / 2
              y = (Math.random() - 0.5) * height
              z = depth / 2
              break
            case 10: // Vertical Y-aligned edge (back left)
              x = -width / 2
              y = (Math.random() - 0.5) * height
              z = -depth / 2
              break
            case 11: // Vertical Y-aligned edge (back right)
              x = width / 2
              y = (Math.random() - 0.5) * height
              z = -depth / 2
              break
          }

          pos.set(x, y, z)

          if (spherize) {
            dir.copy(pos).normalize()
            if (dir.length() === 0) {
              dir.set(0, 1, 0)
            }
          } else {
            if (Math.abs(x) === width / 2 && Math.abs(z) === depth / 2) {
              dir.set(Math.sign(x), 0, Math.sign(z)).normalize()
            } else if (Math.abs(x) === width / 2) {
              dir.set(Math.sign(x), 0, 0)
            } else if (Math.abs(y) === height / 2) {
              dir.set(0, Math.sign(y), 0)
            } else if (Math.abs(z) === depth / 2) {
              dir.set(0, 0, Math.sign(z))
            }
          }
        }
      }

    case 'circle':
      return (pos, dir) => {
        const [radius, thickness, spherize] = args

        const angle = Math.random() * Math.PI * 2

        let radiusScale
        if (thickness === 0) {
          radiusScale = 1 // Edge only
        } else {
          radiusScale = Math.sqrt(Math.random()) * thickness + (1 - thickness)
        }

        const x = Math.cos(angle) * radius * radiusScale
        const z = Math.sin(angle) * radius * radiusScale

        pos.set(x, 0, z)

        if (spherize) {
          dir.set(x, 0, z).normalize()
          if (dir.length() === 0) {
            dir.set(0, 1, 0)
          }
        } else {
          dir.set(0, 1, 0)
        }
      }

    case 'rectangle':
      return (pos, dir) => {
        const [width, depth, thickness, spherize = false] = args

        const useEdge = thickness === 0 || Math.random() > thickness

        let x, z

        if (useEdge) {
          const edge = Math.floor(Math.random() * 4)
          switch (edge) {
            case 0: // +X edge
              x = width / 2
              z = (Math.random() - 0.5) * depth
              break
            case 1: // -X edge
              x = -width / 2
              z = (Math.random() - 0.5) * depth
              break
            case 2: // +Z edge
              x = (Math.random() - 0.5) * width
              z = depth / 2
              break
            case 3: // -Z edge
              x = (Math.random() - 0.5) * width
              z = -depth / 2
              break
          }
        } else {
          x = (Math.random() - 0.5) * width
          z = (Math.random() - 0.5) * depth
        }

        pos.set(x, 0, z)

        if (spherize) {
          dir.set(x, 0, z).normalize()
          if (dir.length() === 0) {
            dir.set(0, 1, 0)
          }
        } else {
          dir.set(0, 1, 0)
        }
      }

    default:
      console.warn(`[particles] unknown shape: ${type}, using 'point' as fallback`)
      return createShape('point', dimensions, thickness)
  }
}

function createSpritesheet(options) {
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
    const v0 = (rows - row - 1) / rows // inverted to start from top
    const u1 = (col + 1) / cols
    const v1 = (rows - row) / rows // inverted to start from top
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

function createNumberCurve(str) {
  const pointsStr = str.split('|')
  const points = pointsStr.map(point => {
    const [alpha, value] = point.split(',').map(parseFloat)
    return { alpha, value }
  })
  points.sort((a, b) => a.alpha - b.alpha)
  return function (alpha) {
    if (alpha <= points[0].alpha) return points[0].value
    if (alpha >= points[points.length - 1].alpha) return points[points.length - 1].value
    let i = 0
    while (i < points.length - 1 && alpha > points[i + 1].alpha) {
      i++
    }
    const p1 = points[i]
    const p2 = points[i + 1]
    const t = (alpha - p1.alpha) / (p2.alpha - p1.alpha)
    return p1.value + t * (p2.value - p1.value)
  }
}

function createColorCurve(str) {
  const pointsStr = str.split('|')
  const points = []
  for (const point of pointsStr) {
    const parts = point.split(',')
    const alpha = parseFloat(parts[0])
    const color = toRGB(parts[1])
    points.push({
      alpha,
      color,
    })
  }
  points.sort((a, b) => a.alpha - b.alpha)
  return function (alpha) {
    if (points.length === 0) return [1, 1, 1] // Default to white
    if (alpha <= points[0].alpha) return [...points[0].color]
    if (alpha >= points[points.length - 1].alpha) return [...points[points.length - 1].color]
    let i = 0
    while (i < points.length - 1 && alpha > points[i + 1].alpha) {
      i++
    }
    const p1 = points[i]
    const p2 = points[i + 1]
    const t = (alpha - p1.alpha) / (p2.alpha - p1.alpha)
    return [
      p1.color[0] + t * (p2.color[0] - p1.color[0]),
      p1.color[1] + t * (p2.color[1] - p1.color[1]),
      p1.color[2] + t * (p2.color[2] - p1.color[2]),
    ]
  }
}
