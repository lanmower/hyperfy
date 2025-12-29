import * as THREE from '../extras/three.js'
import CustomShaderMaterial from '../libs/three-custom-shader-material/index.js'
import { System } from './System.js'
import { NametagRenderer } from '../../client/canvas/NametagRenderer.js'
import * as Config from '../config/NametagConfig.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

export class Nametags extends System {
  static DEPS = { rig: 'rig', stage: 'stage', events: 'events' }
  static EVENTS = { xrSession: 'onXRSession' }

  constructor(world) {
    super(world)
    this.logger = new ComponentLogger('Nametags')
    this.renderer = new NametagRenderer()
    this.uniforms = { uAtlas: { value: this.renderer.texture }, uXR: { value: 0 }, uOrientation: { value: this.rig.quaternion } }
    this.nametags = []
    this.material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshBasicMaterial, transparent: true, depthWrite: false, depthTest: false, uniforms: this.uniforms,
      vertexShader: `
        attribute vec2 coords;
        uniform float uXR;
        uniform vec4 uOrientation;
        varying vec2 vUv;

        vec3 applyQuaternion(vec3 pos, vec4 quat) {
          vec3 qv = vec3(quat.x, quat.y, quat.z);
          vec3 t = 2.0 * cross(qv, pos);
          return pos + quat.w * t + cross(qv, t);
        }

        vec4 lookAtQuaternion(vec3 instancePos) {
          vec3 up = vec3(0.0, 1.0, 0.0);
          vec3 forward = normalize(cameraPosition - instancePos);
          if(length(forward) < 0.001) return vec4(0.0, 0.0, 0.0, 1.0);
          vec3 right = normalize(cross(up, forward));
          up = cross(forward, right);
          float m00 = right.x, m01 = right.y, m02 = right.z, m10 = up.x, m11 = up.y, m12 = up.z, m20 = forward.x, m21 = forward.y, m22 = forward.z;
          float trace = m00 + m11 + m22;
          vec4 quat;
          if(trace > 0.0) {
            float s = 0.5 / sqrt(trace + 1.0);
            quat = vec4((m12 - m21) * s, (m20 - m02) * s, (m01 - m10) * s, 0.25 / s);
          } else if(m00 > m11 && m00 > m22) {
            float s = 2.0 * sqrt(1.0 + m00 - m11 - m22);
            quat = vec4(0.25 * s, (m01 + m10) / s, (m20 + m02) / s, (m12 - m21) / s);
          } else if(m11 > m22) {
            float s = 2.0 * sqrt(1.0 + m11 - m00 - m22);
            quat = vec4((m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m20 - m02) / s);
          } else {
            float s = 2.0 * sqrt(1.0 + m22 - m00 - m11);
            quat = vec4((m20 + m02) / s, (m12 + m21) / s, 0.25 * s, (m01 - m10) / s);
          }
          return normalize(quat);
        }

        void main() {
          vec3 newPosition = position;
          if (uXR > 0.5) {
            vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
            vec4 lookAtQuat = lookAtQuaternion(instancePos);
            newPosition = applyQuaternion(newPosition, lookAtQuat);
          } else {
            newPosition = applyQuaternion(newPosition, uOrientation);
          }
          csm_Position = newPosition;
          vec2 atlasUV = uv;
          atlasUV.y = 1.0 - atlasUV.y;
          atlasUV /= vec2(${Config.GRID_COLS}, ${Config.GRID_ROWS});
          atlasUV += coords;
          vUv = atlasUV;
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlas;
        varying vec2 vUv;
        void main() {
          vec4 texColor = texture2D(uAtlas, vUv);
          csm_FragColor = texColor;
        }
      `,
    })
    this.geometry = new THREE.PlaneGeometry(1, Config.HEIGHT / Config.WIDTH)
    this.geometry.setAttribute('coords', new THREE.InstancedBufferAttribute(new Float32Array(Config.MAX_INSTANCES * 2), 2))
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, Config.MAX_INSTANCES)
    this.mesh.renderOrder = 9999
    this.mesh.matrixAutoUpdate = false
    this.mesh.matrixWorldAutoUpdate = false
    this.mesh.frustumCulled = false
    this.mesh.count = 0
  }

  start() { this.stage.scene.add(this.mesh) }

  add({ name, health }) {
    const idx = this.nametags.length
    if (idx >= Config.MAX_INSTANCES) {
      this.logger.error('reached max')
      return
    }
    this.mesh.count++
    this.mesh.instanceMatrix.needsUpdate = true
    const coords = this.mesh.geometry.attributes.coords
    coords.setXY(idx, (idx % Config.GRID_COLS) / Config.GRID_COLS, Math.floor(idx / Config.GRID_COLS) / Config.GRID_ROWS)
    coords.needsUpdate = true
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(), new THREE.Quaternion(0, 0, 0, 1), new THREE.Vector3(1, 1, 1))
    const nametag = {
      idx, name, health, matrix,
      move: newMatrix => {
        matrix.elements[12] = newMatrix.elements[12]; matrix.elements[13] = newMatrix.elements[13]; matrix.elements[14] = newMatrix.elements[14]
        this.mesh.setMatrixAt(idx, matrix)
        this.mesh.instanceMatrix.needsUpdate = true
      },
      setName: newName => { if (name !== newName) { name = newName; this.renderer.draw(nametag) } },
      setHealth: newHealth => { if (health !== newHealth) { health = newHealth; this.renderer.draw(nametag) } },
      destroy: () => this.remove(nametag),
    }
    this.nametags[idx] = nametag
    this.renderer.draw(nametag)
    return nametag
  }

  remove(nametag) {
    if (!this.nametags.includes(nametag)) {
      this.logger.warn('attempted to remove non-existent nametag')
      return
    }
    const last = this.nametags[this.nametags.length - 1]
    const isLast = nametag === last
    if (isLast) {
      this.nametags.pop()
      this.renderer.clear(nametag)
    } else {
      this.renderer.clear(last)
      last.idx = nametag.idx
      this.renderer.draw(last)
      const coords = this.mesh.geometry.attributes.coords
      const row = Math.floor(nametag.idx / Config.GRID_COLS), col = nametag.idx % Config.GRID_COLS
      coords.setXY(nametag.idx, col / Config.GRID_COLS, row / Config.GRID_ROWS)
      coords.needsUpdate = true
      this.mesh.setMatrixAt(last.idx, last.matrix)
      this.nametags[last.idx] = last
      this.nametags.pop()
    }
    this.mesh.count--
    this.mesh.instanceMatrix.needsUpdate = true
  }

  onXRSession = session => { this.uniforms.uXR.value = session ? 1 : 0 }
}
