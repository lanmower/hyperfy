import * as THREE from '../../extras/three.js'
import CustomShaderMaterial from '../../libs/three-custom-shader-material/index.js'
import { applyPivot } from './VideoHelpers.js'

export class VideoRenderer {
  constructor(video) {
    this.video = video
  }

  createMaterial(lit, doubleside, color) {
    const uniforms = {
      uMap: { value: null },
      uHasMap: { value: 0 },
      uVidAspect: { value: 1 },
      uGeoAspect: { value: 1 },
      uFit: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOffset: { value: new THREE.Vector2(0, 0) },
    }
    const material = new CustomShaderMaterial({
      baseMaterial: lit ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial,
      ...(lit ? { roughness: 1, metalness: 0 } : {}),
      side: doubleside ? THREE.DoubleSide : THREE.FrontSide,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform float uVidAspect;
        uniform float uGeoAspect;
        uniform float uFit;
        uniform vec3 uColor;
        uniform vec2 uOffset;

        varying vec2 vUv;

        vec4 sRGBToLinear(vec4 color) {
          return vec4(pow(color.rgb, vec3(2.2)), color.a);
        }

        vec4 LinearToSRGB(vec4 color) {
            return vec4(pow(color.rgb, vec3(1.0 / 2.2)), color.a);
        }

        void main() {
          float aspect = uGeoAspect / uVidAspect;

          vec2 uv = vUv;

          uv = uv + uOffset;

          if (abs(uFit - 1.0) < 0.01) {
            uv = uv - 0.5;

            if (aspect > 1.0) {
              uv.y /= aspect;
            } else {
              uv.x *= aspect;
            }

            uv = uv + 0.5;
          }
          else if (abs(uFit - 2.0) < 0.01) {
            uv = uv - 0.5;

            if (aspect > 1.0) {
              uv.x *= aspect;
            } else {
              uv.y /= aspect;
            }

            uv = uv + 0.5;
          }

          vec2 uvClamped = clamp(uv, 0.0, 1.0);
          vec4 col = texture2D(uMap, uvClamped);

          if (uFit >= 1.5) {
            const float EPS = 0.005;
            bool outside = uv.x < -EPS || uv.x > 1.0 + EPS || uv.y < -EPS || uv.y > 1.0 + EPS;
            if (outside) {
              col = vec4(uColor, 1.0);
            }
          }

          csm_DiffuseColor = sRGBToLinear(col);
        }
      `,
    })
    this.video.ctx.world.setupMaterial(material)
    return material
  }

  createGeometry(width, height, pivot) {
    const geometry = new THREE.PlaneGeometry(width, height)
    geometry._oWidth = width
    geometry._oHeight = height
    applyPivot(geometry, width, height, pivot)
    return geometry
  }

  createMesh(geometry, material, castShadow, receiveShadow) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = castShadow
    mesh.receiveShadow = receiveShadow
    mesh.matrixWorld.copy(this.video.matrixWorld)
    mesh.matrixAutoUpdate = false
    mesh.matrixWorldAutoUpdate = false
    return mesh
  }

  updateGeometry(currentGeometry, instance, width, height, pivot) {
    let vidAspect = instance.width / instance.height
    let geoAspect

    if (currentGeometry) {
      geoAspect = this.video._aspect
    } else {
      if (width === null && height === null) {
        height = 0
        width = 0
      } else if (width !== null && height === null) {
        height = width / vidAspect
      } else if (height !== null && width === null) {
        width = height * vidAspect
      }
      if (currentGeometry._oWidth !== width || currentGeometry._oHeight !== height) {
        const newGeometry = new THREE.PlaneGeometry(width, height)
        applyPivot(newGeometry, width, height, pivot)
        if (this.video.mesh) {
          this.video.mesh.geometry = newGeometry
        }
        currentGeometry.dispose()
        return { newGeometry, vidAspect, geoAspect: width / height }
      }
      geoAspect = width / height
    }

    return { geometry: currentGeometry, vidAspect, geoAspect }
  }
}
