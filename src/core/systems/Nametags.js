import * as THREE from '../extras/three.js'
import CustomShaderMaterial from '../libs/three-custom-shader-material/index.js'
import { System } from './System.js'
import { NametagRenderer } from './nametags/NametagRenderer.js'
import { NametagPositioner } from './nametags/NametagPositioner.js'

const RES = 2
const NAMETAG_WIDTH = 200 * RES
const NAMETAG_HEIGHT = 35 * RES
const PER_ROW = 5
const PER_COLUMN = 20
const MAX_INSTANCES = PER_ROW * PER_COLUMN

export class Nametags extends System {
  static DEPS = {
    rig: 'rig',
    stage: 'stage',
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.nametags = []
    this.canvas = document.createElement('canvas')
    this.canvas.width = NAMETAG_WIDTH * PER_ROW
    this.canvas.height = NAMETAG_HEIGHT * PER_COLUMN
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.flipY = false
    this.texture.needsUpdate = true
    this.uniforms = {
      uAtlas: { value: this.texture },
      uXR: { value: 0 },
      uOrientation: { value: this.rig.quaternion },
    }
    this.renderer = new NametagRenderer(this)
    this.positioner = new NametagPositioner(this)
    this.material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshBasicMaterial,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: this.uniforms,
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
          
          if(length(forward) < 0.001) {
            return vec4(0.0, 0.0, 0.0, 1.0);
          }
          
          vec3 right = normalize(cross(up, forward));
          up = cross(forward, right);
          
          float m00 = right.x;
          float m01 = right.y;
          float m02 = right.z;
          float m10 = up.x;
          float m11 = up.y;
          float m12 = up.z;
          float m20 = forward.x;
          float m21 = forward.y;
          float m22 = forward.z;
          
          float trace = m00 + m11 + m22;
          vec4 quat;
          
          if(trace > 0.0) {
            float s = 0.5 / sqrt(trace + 1.0);
            quat = vec4(
              (m12 - m21) * s,
              (m20 - m02) * s,
              (m01 - m10) * s,
              0.25 / s
            );
          } else if(m00 > m11 && m00 > m22) {
            float s = 2.0 * sqrt(1.0 + m00 - m11 - m22);
            quat = vec4(
              0.25 * s,
              (m01 + m10) / s,
              (m20 + m02) / s,
              (m12 - m21) / s
            );
          } else if(m11 > m22) {
            float s = 2.0 * sqrt(1.0 + m11 - m00 - m22);
            quat = vec4(
              (m01 + m10) / s,
              0.25 * s,
              (m12 + m21) / s,
              (m20 - m02) / s
            );
          } else {
            float s = 2.0 * sqrt(1.0 + m22 - m00 - m11);
            quat = vec4(
              (m20 + m02) / s,
              (m12 + m21) / s,
              0.25 * s,
              (m01 - m10) / s
            );
          }
          
          return normalize(quat);
        }

        void main() {
          vec3 newPosition = position;
          if (uXR > 0.5) {
            vec3 instancePos = vec3(
              instanceMatrix[3][0],
              instanceMatrix[3][1],
              instanceMatrix[3][2]
            );
            vec4 lookAtQuat = lookAtQuaternion(instancePos);
            newPosition = applyQuaternion(newPosition, lookAtQuat);
          } else {
            newPosition = applyQuaternion(newPosition, uOrientation);
          }
          csm_Position = newPosition;
          
          vec2 atlasUV = uv; // original UVs are 0-1 for the plane
          atlasUV.y = 1.0 - atlasUV.y;
          atlasUV /= vec2(${PER_ROW}, ${PER_COLUMN});
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
    this.geometry = new THREE.PlaneGeometry(1, NAMETAG_HEIGHT / NAMETAG_WIDTH)
    this.geometry.setAttribute('coords', new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 2), 2)) // xy coordinates in atlas
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_INSTANCES)
    this.mesh.renderOrder = 9999
    this.mesh.matrixAutoUpdate = false
    this.mesh.matrixWorldAutoUpdate = false
    this.mesh.frustumCulled = false
    this.mesh.count = 0
  }

  get rig() { return this.getService(Nametags.DEPS.rig) }
  get stage() { return this.getService(Nametags.DEPS.stage) }
  get events() { return this.getService(Nametags.DEPS.events) }

  start() {
    this.stage.scene.add(this.mesh)
    this.events.on('xrSession', this.onXRSession)
  }

  add({ name, health }) {
    return this.positioner.add(name, health)
  }

  remove(nametag) {
    return this.positioner.remove(nametag)
  }

  onXRSession = session => {
    this.uniforms.uXR.value = session ? 1 : 0
  }
}
