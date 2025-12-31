// Particle material factory with shader generation
import * as THREE from '../../extras/three.js'
import CustomShaderMaterial from '../../libs/three-custom-shader-material/index.js'
import { DEG2RAD } from '../../extras/general.js'
import { BaseFactory } from '../../patterns/BaseFactory.js'

export class ParticleMaterialFactory extends BaseFactory {
  static create(config) {
    this.validate(config)
    const { node, uniforms, loader } = config
    return this.createMaterial(node, uniforms, loader)
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('ParticleMaterialFactory config must be an object')
    }
    if (!config.node || !config.uniforms) {
      throw new Error('ParticleMaterialFactory config requires node and uniforms')
    }
  }

  static createMaterial(node, uniforms, loader) {
    const texture = new THREE.Texture()
    texture.colorSpace = THREE.SRGBColorSpace

    const materialUniforms = {
      uTexture: { value: texture },
      uBillboard: { value: this.billboardModeInts[node._billboard] },
      uOrientation: uniforms.uOrientation,
    }

    if (loader) {
      loader.load('texture', node._image).then(tex => {
        tex.colorSpace = THREE.SRGBColorSpace
        materialUniforms.uTexture.value = tex
      })
    }

    const material = new CustomShaderMaterial({
      baseMaterial: node._lit ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial,
      ...(node._lit ? { roughness: 1, metalness: 0 } : {}),
      blending: node._blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
      transparent: true,
      premultipliedAlpha: true,
      color: 'white',
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      uniforms: materialUniforms,
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
    })

    return material
  }

  static billboardModeInts = {
    full: 0,
    y: 1,
    direction: 2,
  }

  static getVertexShader() {
    return `
      attribute vec3 aPosition;
      attribute float aRotation;
      attribute vec3 aDirection;
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aAlpha;
      attribute float aEmissive;
      attribute vec4 aUV;

      uniform float uBillboard;
      uniform vec4 uOrientation;

      varying vec2 vUv;
      varying vec4 vColor;
      varying float vEmissive;

      const float DEG2RAD = ${DEG2RAD};

      mat3 rotationFromDirection(vec3 dir) {
        vec3 n = normalize(dir);
        vec3 up = vec3(0.0, 1.0, 0.0);
        if (abs(dot(n, up)) > 0.99) {
          up = vec3(1.0, 0.0, 0.0);
        }
        vec3 right = normalize(cross(up, n));
        up = cross(n, right);
        return mat3(right, up, n);
      }

      vec3 applyQuaternion(vec3 pos, vec4 quat) {
        vec3 qv = vec3(quat.x, quat.y, quat.z);
        vec3 t = 2.0 * cross(qv, pos);
        return pos + quat.w * t + cross(qv, t);
      }

      void main() {
        vUv = vec2(mix(aUV.x, aUV.z, uv.x), mix(aUV.y, aUV.w, uv.y));
        vec3 newPosition = position;
        newPosition.xy *= aSize;

        float rot = aRotation * DEG2RAD;
        float cosRot = cos(rot);
        float sinRot = sin(rot);
        newPosition.xy = vec2(
          newPosition.x * cosRot + newPosition.y * sinRot,
          -newPosition.x * sinRot + newPosition.y * cosRot
        );

        if (uBillboard < 0.1) {
          newPosition = applyQuaternion(newPosition, uOrientation);
        } else if (uBillboard < 1.1) {
          newPosition = applyQuaternion(newPosition, uOrientation);
        } else {
          newPosition = rotationFromDirection(aDirection) * newPosition;
        }

        newPosition += aPosition;
        csm_Position = newPosition;
        vColor = vec4(aColor.rgb, aAlpha);
        vEmissive = aEmissive;
      }
    `
  }

  static getFragmentShader() {
    return `
      uniform sampler2D uTexture;
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vEmissive;

      void main() {
        vec4 texColor = texture(uTexture, vUv);
        vec4 baseColor = texColor * vColor;
        baseColor.rgb *= vEmissive;
        csm_DiffuseColor = baseColor;
      }
    `
  }
}
