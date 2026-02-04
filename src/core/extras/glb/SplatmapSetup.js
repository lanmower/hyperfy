import * as pc from '../playcanvas.js'

export function setupSplatmap(mesh) {
  const original = mesh.material
  const vshader = `
    varying vec2 vUv;
    varying vec3 vNorm;
    varying vec3 vPos;
    void main() {
      vUv = vUv0;
      vNorm = normalize(vNormalMatrix * vertex_normal);
      vPos = vertex_position;
    }
  `
  const fshader = `
    precision highp float;
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

    void main() {
        vec4 splat = texture2D(splatTex, vUv);
        vec4 result = vec4(0.0, 0.0, 0.0, 1.0);
        result += splat.r * textureTriplanar(rTex, rScale, vNorm, vPos);
        result += splat.g * textureTriplanar(gTex, gScale, vNorm, vPos);
        result += splat.b * textureTriplanar(bTex, bScale, vNorm, vPos);
        gl_FragColor = result;
    }
  `
  const shader = new pc.Shader(pc.GraphicsDevice.getInstance(), {
    attributes: {
      vertex_position: pc.SEMANTIC_POSITION,
      vertex_normal: pc.SEMANTIC_NORMAL,
      vertex_texCoord0: pc.SEMANTIC_TEXCOORD0
    },
    vshader: vshader,
    fshader: fshader
  })
  const material = new pc.Material()
  material.shader = shader
  material.setParameter('splatTex', original.map || null)
  material.setParameter('rTex', original.specularIntensityMap || null)
  material.setParameter('gTex', original.emissiveMap || null)
  material.setParameter('bTex', original.normalMap || null)
  material.setParameter('aTex', original.transmissionMap || null)
  material.setParameter('rScale', mesh.userData.red_scale || 1)
  material.setParameter('gScale', mesh.userData.green_scale || 1)
  material.setParameter('bScale', mesh.userData.blue_scale || 1)
  material.setParameter('aScale', mesh.userData.alpha_scale || 1)
  mesh.material = material
}
