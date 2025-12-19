import { Ranks } from '../../core/extras/ranks.js'

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
    const MB = 1024 * 1024
    if (info.fileSize > 10 * MB || info.textureBytes > 32 * MB || info.triangles > 100000) {
      info.rank = Ranks.ADMIN
    } else if (info.fileSize > 5 * MB || info.textureBytes > 16 * MB || info.triangles > 50000) {
      info.rank = Ranks.BUILDER
    }
    return info
  }
}
