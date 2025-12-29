import { Ranks } from '../../core/extras/ranks.js'
import { AvatarConfig } from '../config/AvatarConfig.js'

const materialSlots = [
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'map',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
]

export class AvatarStats {
  static resolveInfo(file, node) {
    const info = {
      file,
      fileSize: file.size,
      rank: Ranks.VISITOR,
      textures: 0,
      textureBytes: 0,
      triangles: 0,
    }
    const textures = new Set()
    node.model.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) {
          const index = child.geometry.index
          const position = child.geometry.attributes.position
          if (index) {
            info.triangles += index.count / 3
          } else if (position) {
            info.triangles += position.count / 3
          }
        }
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach(material => {
            materialSlots.forEach(slot => {
              const texture = material[slot]
              if (texture && texture.image) {
                textures.add(texture)
              }
            })
          })
        }
      }
    })
    info.textures = textures.size
    textures.forEach(texture => {
      if (texture.image) {
        const { width, height } = texture.image
        const bytesPerPixel = 4
        info.textureBytes += width * height * bytesPerPixel
      }
    })
    if (info.fileSize > AvatarConfig.limits.maxFileSize || info.textureBytes > AvatarConfig.limits.maxTextureBytes || info.triangles > AvatarConfig.limits.maxTriangles) {
      info.rank = Ranks.ADMIN
    } else if (info.fileSize > AvatarConfig.limits.builderFileSize || info.textureBytes > AvatarConfig.limits.builderTextureBytes || info.triangles > AvatarConfig.limits.builderTriangles) {
      info.rank = Ranks.BUILDER
    }
    return info
  }
}
