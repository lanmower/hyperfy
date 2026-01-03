// Shader code patching and manipulation utilities
import * as THREE from '../../extras/three.js'
import { variableMap, materialCompatibility, featureDependencies } from './ShaderVariableMaps.js'

export function stripComments(shader) {
  return shader.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
}

export function hashShaderCode(code) {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + (hash << 6) + (hash << 16) - hash
  }
  return String(hash >>> 0)
}

export function isConstructor(fn) {
  try {
    new fn()
  } catch (err) {
    if (err.message.indexOf('is not a constructor') >= 0) return false
  }
  return true
}

export function extractMainBody(shader) {
  const regex = /void\s+main\s*\(\s*\)[^{]*{((?:[^{}]+|{(?:[^{}]+|{(?:[^{}]+|{(?:[^{}]+|{[^{}]*})*})*})*})*})/gm
  const match = regex.exec(shader)
  const body = match ? match[1].slice(0, -1) : ''
  const mainIndex = shader.indexOf('void main() {')
  const preamble = mainIndex !== -1 ? shader.slice(0, mainIndex) : ''
  return { body, preamble }
}

export function injectShaderCode(shader, preambleCode, defaultsCode, mainCode) {
  if (defaultsCode) {
    shader = shader.replace(
      'void main() {',
      `

          ${preambleCode}

          void main() {
          `
    )
    const endIndex = shader.lastIndexOf('//~CSM_MAIN_END')
    if (endIndex !== -1) {
      const injection = `
            ${mainCode ? `${mainCode}` : ''}
          `
      shader = shader.slice(0, endIndex) + injection + shader.slice(endIndex)
    }
  } else {
    const mainRegex = /void\s*main\s*\(\s*\)\s*{/gm
    shader = shader.replace(
      mainRegex,
      `

          ${preambleCode}

          void main() {
            {
              ${defaultsCode}
            }

            ${mainCode ? `${mainCode}` : ''}
          `
    )
  }
  return shader
}

export function buildShaderPatches(patchMap) {
  return { ...patchMap }
}

export function getApplicablePatches(code, patchMap, variableKey) {
  const patches = {}
  const strippedCode = stripComments(code)

  for (const key in patchMap) {
    const isWildcard = key === '*'
    const isApplicable = isWildcard || (strippedCode && strippedCode.includes(key))

    if (isApplicable) {
      const compat = materialCompatibility[variableKey]
      if (compat && compat !== '*' && !Array.isArray(compat)) {
        // Compatibility check would happen at material level
      }
      patches[key] = patchMap[key]
    }
  }

  return patches
}

export function applyShaderReplacements(shader, patches, isFragment) {
  let result = shader
  for (const searchStr in patches) {
    const replacement = patches[searchStr]
    if (typeof replacement === 'object') {
      const { type, value } = replacement
      if ((type === 'fs' && isFragment) || (type === 'vs' && !isFragment)) {
        result = result.replace(searchStr, value)
      }
    } else if (replacement) {
      result = result.replace(searchStr, replacement)
    }
  }
  return result
}
