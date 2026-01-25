import { isNumber } from '../../../utils/helpers/typeChecks.js'
import * as pc from '../../extras/playcanvas.js'

export function createMaterialProxy(raw, textures, material, world) {
  const proxy = {
    get id() {
      return raw.id || raw.uuid || Math.random()
    },
    setColor(val) {
      if (typeof val !== 'string' && !val.isColor) {
        throw new Error('[material] color must be a string or Color')
      }
      if (typeof val === 'string') {
        const hex = val.startsWith('#') ? val : `#${val}`
        const c = parseInt(hex.slice(1), 16)
        raw.diffuse.set(
          ((c >> 16) & 255) / 255,
          ((c >> 8) & 255) / 255,
          (c & 255) / 255
        )
      } else {
        raw.diffuse.copy(val)
      }
      if (raw.update) raw.update()
    },
    setMetalness(value) {
      if (!isNumber(value)) throw new Error('[material] metalness not a number')
      raw.metalness = Math.max(0, Math.min(1, value))
      if (raw.update) raw.update()
    },
    setRoughness(value) {
      if (!isNumber(value)) throw new Error('[material] roughness not a number')
      raw.roughness = Math.max(0, Math.min(1, value))
      if (raw.update) raw.update()
    },
    setOpacity(value) {
      if (!isNumber(value)) throw new Error('[material] opacity not a number')
      raw.opacity = Math.max(0, Math.min(1, value))
      raw.transparent = value < 1
      if (raw.update) raw.update()
    },
    setEmissive(val) {
      if (typeof val !== 'string' && !val.isColor) {
        throw new Error('[material] emissive must be a string or Color')
      }
      if (typeof val === 'string') {
        const hex = val.startsWith('#') ? val : `#${val}`
        const c = parseInt(hex.slice(1), 16)
        raw.emissive.set(
          ((c >> 16) & 255) / 255,
          ((c >> 8) & 255) / 255,
          (c & 255) / 255
        )
      } else {
        raw.emissive.copy(val)
      }
      if (raw.update) raw.update()
    },
    get _ref() {
      if (world._allowMaterial) return material
    },
  }
  return proxy
}
