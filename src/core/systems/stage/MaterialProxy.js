import { isNumber } from 'lodash-es'

export function createMaterialProxy(raw, textures, material, world) {
  return {
    get id() {
      return raw.uuid
    },
    get textureX() {
      return textures[0]?.offset.x
    },
    set textureX(val) {
      for (const tex of textures) {
        tex.offset.x = val
      }
      raw.needsUpdate = true
    },
    get textureY() {
      return textures[0]?.offset.y
    },
    set textureY(val) {
      for (const tex of textures) {
        tex.offset.y = val
      }
      raw.needsUpdate = true
    },
    get color() {
      return raw.color
    },
    set color(val) {
      if (typeof val !== 'string') {
        throw new Error('[material] color must be a string (e.g. "red", "#ff0000", "rgb(255,0,0)")')
      }
      raw.color.set(val)
      raw.needsUpdate = true
    },
    get emissiveIntensity() {
      return raw.emissiveIntensity
    },
    set emissiveIntensity(value) {
      if (!isNumber(value)) {
        throw new Error('[material] emissiveIntensity not a number')
      }
      raw.emissiveIntensity = value
      raw.needsUpdate = true
    },
    get fog() {
      return raw.fog
    },
    set fog(value) {
      raw.fog = value
      raw.needsUpdate = true
    },
    get _ref() {
      if (world._allowMaterial) return material
    },
  }
}
