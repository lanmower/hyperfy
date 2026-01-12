import { Vector3, Quaternion, Matrix4 } from '../../core/extras/three.js'

const xAxis = new Vector3(1, 0, 0)
const yAxis = new Vector3(0, 1, 0)
const zAxis = new Vector3(0, 0, 1)

const v3 = new Vector3()
const v4 = new Vector3()
const q2 = new Quaternion()

export class VelocityApplier {
  constructor(config) {
    this.config = config
    this.force = config.force ? new Vector3().fromArray(config.force) : null
    this.velocityLinear = config.velocityLinear ? new Vector3().fromArray(config.velocityLinear) : null
    this.velocityOrbital = config.velocityOrbital ? new Vector3().fromArray(config.velocityOrbital) : null
    this.velocityRadial = config.velocityRadial || null
  }

  apply(particle, delta, matrixWorld, currWorldPos) {
    if (this.force) {
      v3.copy(this.force).multiplyScalar(delta)
      particle.velocity.add(v3)
    }

    if (this.velocityLinear) {
      v3.copy(this.velocityLinear).multiplyScalar(delta)
      if (this.config.space === 'world') {
        particle.position.add(v3)
      } else {
        v3.applyQuaternion(q2.setFromRotationMatrix(matrixWorld))
        particle.position.add(v3)
      }
    }

    if (this.velocityOrbital) {
      v3.copy(particle.position)
      if (this.config.space === 'world') {
        v3.sub(particle.emissionPosition)
      }

      if (this.velocityOrbital.x !== 0) {
        q2.setFromAxisAngle(xAxis, this.velocityOrbital.x * delta)
        v3.applyQuaternion(q2)
      }
      if (this.velocityOrbital.y !== 0) {
        q2.setFromAxisAngle(yAxis, this.velocityOrbital.y * delta)
        v3.applyQuaternion(q2)
      }
      if (this.velocityOrbital.z !== 0) {
        q2.setFromAxisAngle(zAxis, this.velocityOrbital.z * delta)
        v3.applyQuaternion(q2)
      }

      if (this.config.space === 'world') {
        particle.position.copy(particle.emissionPosition).add(v3)
      } else {
        particle.position.copy(v3)
      }

      if (v3.length() > 0.001) {
        const orbitSpeed =
          v3.length() *
          Math.max(Math.abs(this.velocityOrbital.x), Math.abs(this.velocityOrbital.y), Math.abs(this.velocityOrbital.z))
        v4.crossVectors(
          this.velocityOrbital.x > 0
            ? new Vector3(1, 0, 0)
            : this.velocityOrbital.y > 0
              ? new Vector3(0, 1, 0)
              : new Vector3(0, 0, 1),
          v3
        ).normalize()
        v4.multiplyScalar(orbitSpeed)
        particle.velocity.copy(v4)
      }
    }

    if (this.velocityRadial) {
      const radialCenter = this.config.space === 'world' ? particle.emissionPosition : currWorldPos
      v3.copy(particle.position).sub(radialCenter)
      if (v3.length() > 0.001) {
        v3.normalize()
        v3.multiplyScalar(this.velocityRadial * delta)
        particle.position.add(v3)
        particle.velocity.add(v3.divideScalar(delta))
      }
    }

    v3.copy(particle.velocity).multiplyScalar(delta)
    particle.position.add(v3)
  }
}
