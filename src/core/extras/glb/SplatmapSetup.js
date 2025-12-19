import * as THREE from '../three.js'
import CustomShaderMaterial from '../../libs/three-custom-shader-material/index.js'

export function setupSplatmap(mesh) {
  const original = mesh.material
  if (original.specularIntensityMap) original.specularIntensityMap.colorSpace = THREE.SRGBColorSpace
  if (original.transmissionMap) original.transmissionMap.colorSpace = THREE.SRGBColorSpace
  if (original.emissiveMap) original.emissiveMap.colorSpace = THREE.SRGBColorSpace
  if (original.normalMap) original.normalMap.colorSpace = THREE.SRGBColorSpace
  const uniforms = {
    splatTex: { value: original.map },
    rTex: { value: original.specularIntensityMap },
    gTex: { value: original.emissiveMap },
    bTex: { value: original.normalMap },
    aTex: { value: original.transmissionMap },
    rScale: { value: mesh.userData.red_scale || 1 },
    gScale: { value: mesh.userData.green_scale || 1 },
    bScale: { value: mesh.userData.blue_scale || 1 },
    aScale: { value: mesh.userData.alpha_scale || 1 },
  }
  mesh.material = new CustomShaderMaterial({
    baseMaterial: THREE.MeshStandardMaterial,
    roughness: 1,
    metalness: 0,
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNorm;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vNorm = normalize(normal);
        vPos = position;
      }
    `,
    fragmentShader: `
      uniform sampler2D splatTex;
      uniform sampler2D rTex;
      uniform sampler2D gTex;
      uniform sampler2D bTex;
      uniform sampler2D aTex;
      uniform float rScale;
      uniform float gScale;
      uniform float bScale;
      uniform float aScale;
      varying vec2 vUv;
      varying vec3 vNorm;
      varying vec3 vPos;

      vec4 textureTriplanar(sampler2D tex, float scale, vec3 normal, vec3 position) {
          vec2 uv_x = position.yz * scale;
          vec2 uv_y = position.xz * scale;
          vec2 uv_z = position.xy * scale;
          vec4 xProjection = texture2D(tex, uv_x);
          vec4 yProjection = texture2D(tex, uv_y);
          vec4 zProjection = texture2D(tex, uv_z);
          vec3 weight = abs(normal);
          weight = pow(weight, vec3(4.0));
          weight = weight / (weight.x + weight.y + weight.z);
          return xProjection * weight.x + yProjection * weight.y + zProjection * weight.z;
      }

      vec3 tri(sampler2D t, float s) {
        return textureTriplanar(t, s, vNorm, vPos).rgb;
      }

      void main() {
          vec4 splat = texture2D(splatTex, vUv);
          vec4 result = vec4(0, 0, 0, 1.0);
          result += splat.r * textureTriplanar(rTex, rScale, vNorm, vPos);
          result += splat.g * textureTriplanar(gTex, gScale, vNorm, vPos);
          result += splat.b * textureTriplanar(bTex, bScale, vNorm, vPos);
          csm_DiffuseColor *= result;
      }
    `,
  })
}
