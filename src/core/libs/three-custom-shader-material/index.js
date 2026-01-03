// CustomShaderMaterial: injects custom shader code into three.js materials with compatibility checking

import * as THREE from '../../extras/three.js'
import * as Templates from './ShaderTemplates.js'
import { variableMap, materialCompatibility, featureDependencies } from './ShaderVariableMaps.js'
import {
  stripComments,
  hashShaderCode,
  isConstructor,
  extractMainBody,
  injectShaderCode,
  buildShaderPatches,
  getApplicablePatches,
  applyShaderReplacements,
} from './ShaderPatcher.js'

const patchMap = {
  '*': {
    '#include <lights_physical_fragment>': THREE.ShaderChunk.lights_physical_fragment,
    '#include <transmission_fragment>': THREE.ShaderChunk.transmission_fragment,
  },
  [variableMap.normal]: {
    '#include <beginnormal_vertex>': `
    vec3 objectNormal = ${variableMap.normal};
    #ifdef USE_TANGENT
	    vec3 objectTangent = vec3( tangent.xyz );
    #endif
    `,
  },
  [variableMap.position]: {
    '#include <begin_vertex>': `
    vec3 transformed = ${variableMap.position};
  `,
  },
  [variableMap.positionRaw]: {
    '#include <begin_vertex>': `
    vec4 csm_internal_positionUnprojected = ${variableMap.positionRaw};
    mat4x4 csm_internal_unprojectMatrix = projectionMatrix * modelViewMatrix;
    #ifdef USE_INSTANCING
      csm_internal_unprojectMatrix = csm_internal_unprojectMatrix * instanceMatrix;
    #endif
    csm_internal_positionUnprojected = inverse(csm_internal_unprojectMatrix) * csm_internal_positionUnprojected;
    vec3 transformed = csm_internal_positionUnprojected.xyz;
  `,
  },
  [variableMap.pointSize]: {
    'gl_PointSize = size;': `
    gl_PointSize = ${variableMap.pointSize};
    `,
  },
  [variableMap.diffuse]: {
    '#include <color_fragment>': `
    #include <color_fragment>
    diffuseColor = ${variableMap.diffuse};
  `,
  },
  [variableMap.fragColor]: {
    '#include <opaque_fragment>': `
    #include <opaque_fragment>
    gl_FragColor = mix(gl_FragColor, ${variableMap.fragColor}, ${variableMap.unlitFac});
  `,
  },
  [variableMap.emissive]: {
    'vec3 totalEmissiveRadiance = emissive;': `
    vec3 totalEmissiveRadiance = ${variableMap.emissive};
    `,
  },
  [variableMap.roughness]: {
    '#include <roughnessmap_fragment>': `
    #include <roughnessmap_fragment>
    roughnessFactor = ${variableMap.roughness};
    `,
  },
  [variableMap.metalness]: {
    '#include <metalnessmap_fragment>': `
    #include <metalnessmap_fragment>
    metalnessFactor = ${variableMap.metalness};
    `,
  },
  [variableMap.ao]: {
    '#include <aomap_fragment>': `
    #include <aomap_fragment>
    reflectedLight.indirectDiffuse *= 1. - ${variableMap.ao};
    `,
  },
  [variableMap.bump]: {
    '#include <normal_fragment_maps>': `
    #include <normal_fragment_maps>

    vec3 csm_internal_orthogonal = ${variableMap.bump} - (dot(${variableMap.bump}, normal) * normal);
    vec3 csm_internal_projectedbump = mat3(csm_internal_vModelViewMatrix) * csm_internal_orthogonal;
    normal = normalize(normal - csm_internal_projectedbump);
    `,
  },
  [variableMap.fragNormal]: {
    '#include <normal_fragment_maps>': `
      #include <normal_fragment_maps>
      normal = ${variableMap.fragNormal};
    `,
  },
  [variableMap.depthAlpha]: {
    'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );': `
      gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity * 1.0 - ${variableMap.depthAlpha} );
    `,
    'gl_FragColor = packDepthToRGBA( fragCoordZ );': `
      if(${variableMap.depthAlpha} < 1.0) discard;
      gl_FragColor = packDepthToRGBA( dist );
    `,
    'gl_FragColor = packDepthToRGBA( dist );': `
      if(${variableMap.depthAlpha} < 1.0) discard;
      gl_FragColor = packDepthToRGBA( dist );
    `,
  },
  [variableMap.clearcoat]: {
    'material.clearcoat = clearcoat;': `material.clearcoat = ${variableMap.clearcoat};`,
  },
  [variableMap.clearcoatRoughness]: {
    'material.clearcoatRoughness = clearcoatRoughness;': `material.clearcoatRoughness = ${variableMap.clearcoatRoughness};`,
  },
  [variableMap.clearcoatNormal]: {
    '#include <clearcoat_normal_fragment_begin>': `
      vec3 csm_coat_internal_orthogonal = csm_ClearcoatNormal - (dot(csm_ClearcoatNormal, nonPerturbedNormal) * nonPerturbedNormal);
      vec3 csm_coat_internal_projectedbump = mat3(csm_internal_vModelViewMatrix) * csm_coat_internal_orthogonal;
      vec3 clearcoatNormal = normalize(nonPerturbedNormal - csm_coat_internal_projectedbump);
    `,
  },
  [variableMap.transmission]: {
    'material.transmission = transmission;': `
      material.transmission = ${variableMap.transmission};
    `,
  },
  [variableMap.thickness]: {
    'material.thickness = thickness;': `
      material.thickness = ${variableMap.thickness};
    `,
  },
  [variableMap.iridescence]: {
    'material.iridescence = iridescence;': `
      material.iridescence = ${variableMap.iridescence};
    `,
  },
}

class CustomShaderMaterial extends THREE.Material {
  constructor({
    baseMaterial,
    vertexShader,
    fragmentShader,
    uniforms,
    patchMap: customPatchMap,
    cacheKey,
    ...rest
  }) {
    if (!baseMaterial) throw new Error('CustomShaderMaterial: baseMaterial is required.')

    let baseMaterialInstance
    if (isConstructor(baseMaterial)) {
      const emptyConfig = Object.keys(rest).length === 0
      baseMaterialInstance = new baseMaterial(emptyConfig ? undefined : rest)
    } else {
      baseMaterialInstance = baseMaterial
      Object.assign(baseMaterialInstance, rest)
    }

    if (['ShaderMaterial', 'RawShaderMaterial'].includes(baseMaterialInstance.type)) {
      throw new Error(
        `CustomShaderMaterial does not support ${baseMaterialInstance.type} as a base material.`
      )
    }

    super()

    this.uniforms = {}
    this.vertexShader = ''
    this.fragmentShader = ''

    const mat = baseMaterialInstance
    mat.name = `CustomShaderMaterial<${baseMaterialInstance.name}>`
    mat.update = this.update.bind(mat)
    mat.__csm = { prevOnBeforeCompile: baseMaterialInstance.onBeforeCompile }

    const allUniforms = { ...(mat.uniforms || {}), ...(uniforms || {}) }
    mat.uniforms = this.uniforms = allUniforms
    mat.vertexShader = this.vertexShader = vertexShader || ''
    mat.fragmentShader = this.fragmentShader = fragmentShader || ''

    mat.update({
      fragmentShader: mat.fragmentShader,
      vertexShader: mat.vertexShader,
      uniforms: mat.uniforms,
      patchMap: customPatchMap,
      cacheKey,
    })

    return mat
  }

  update({ fragmentShader, vertexShader, uniforms, cacheKey, patchMap: customPatchMap }) {
    const vertexStripped = stripComments(vertexShader || '')
    const fragmentStripped = stripComments(fragmentShader || '')

    const mat = this

    if (uniforms) mat.uniforms = uniforms
    if (vertexShader) mat.vertexShader = vertexShader
    if (fragmentShader) mat.fragmentShader = fragmentShader

    for (const [feature, vars] of Object.entries(featureDependencies)) {
      for (const variable of vars) {
        if ((fragmentStripped && fragmentStripped.includes(variable)) ||
            (vertexStripped && vertexStripped.includes(variable))) {
          mat[feature] ||= 1
        }
      }
    }

    const prevOnBeforeCompile = mat.__csm.prevOnBeforeCompile
    const finalPatchMap = { ...patchMap, ...(customPatchMap || {}) }

    mat.onBeforeCompile = (shaders) => {
      prevOnBeforeCompile?.(shaders)

      const matType = mat.type
      const typeDefine = matType
        ? `#define IS_${matType.toUpperCase()};
`
        : `#define IS_UNKNOWN;
`

      shaders.vertexShader =
        typeDefine +
        `#define IS_VERTEX
` +
        shaders.vertexShader

      shaders.fragmentShader =
        typeDefine +
        `#define IS_FRAGMENT
` +
        shaders.fragmentShader

      for (const varKey in finalPatchMap) {
        const isWildcard = varKey === '*'
        const inFragment = fragmentStripped && fragmentStripped.includes(varKey)
        const inVertex = vertexStripped && vertexStripped.includes(varKey)

        if (isWildcard || inFragment || inVertex) {
          const compat = materialCompatibility[varKey]
          if (compat && compat !== '*' && (Array.isArray(compat) ? !compat.includes(matType) : compat !== matType)) {
            console.error(`CustomShaderMaterial: ${varKey} is not available in ${matType}. Shader cannot compile.`)
            return
          }

          const patches = finalPatchMap[varKey]
          for (const search in patches) {
            const replacement = patches[search]
            if (typeof replacement === 'object') {
              const { type, value } = replacement
              if (type === 'fs') {
                shaders.fragmentShader = shaders.fragmentShader.replace(search, value)
              } else if (type === 'vs') {
                shaders.vertexShader = shaders.vertexShader.replace(search, value)
              }
            } else if (replacement) {
              shaders.vertexShader = shaders.vertexShader.replace(search, replacement)
              shaders.fragmentShader = shaders.fragmentShader.replace(search, replacement)
            }
          }
        }
      }

      shaders.vertexShader = this._patchShader(shaders.vertexShader, vertexStripped, false)
      shaders.fragmentShader = this._patchShader(shaders.fragmentShader, fragmentStripped, true)

      if (uniforms) {
        shaders.uniforms = { ...shaders.uniforms, ...mat.uniforms }
      }
      mat.uniforms = shaders.uniforms
    }

    const prevCacheKey = mat.customProgramCacheKey
    mat.customProgramCacheKey = () =>
      ((cacheKey?.() || hashShaderCode((vertexStripped || '') + (fragmentStripped || ''))) +
        (prevCacheKey?.call(mat) || ''))

    mat.needsUpdate = true
  }

  _patchShader(shader, customCode, isFragment) {
    const { preamble, body } = extractMainBody(customCode)

    if (customCode?.includes('//~CSM_DEFAULTS')) {
      shader = shader.replace(
        'void main() {',
        `

          ${preamble}

          void main() {
          `
      )

      const endIndex = shader.lastIndexOf('//~CSM_MAIN_END')
      if (endIndex !== -1) {
        const injection = `
            ${body ? `${body}` : ''}
          `
        shader = shader.slice(0, endIndex) + injection + shader.slice(endIndex)
      }
    } else {
      const mainRegex = /void\s*main\s*\(\s*\)\s*{/gm
      shader = shader.replace(
        mainRegex,
        `

          ${isFragment ? Templates.fragmentVaryingDeclaration : Templates.varyingDeclaration}
          ${Templates.declarations}

          ${preamble}

          void main() {
            {
              ${Templates.preamble}
            }
            ${isFragment ? Templates.fragmentVaryingValue : Templates.varyingAssignment}

            ${body ? `${body}` : ''}
          `
      )
    }

    return shader
  }
}

export default CustomShaderMaterial
