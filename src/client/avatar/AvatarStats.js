import * as THREE from 'three'

const v1 = new THREE.Vector3()

const specs = [
  {
    rank: 5,
    fileSize: 5 * 1048576,
    triangles: 4000,
    draws: 1,
    bones: 70,
    bounds: [3, 3, 3],
  },
  {
    rank: 4,
    fileSize: 10 * 1048576,
    triangles: 16000,
    draws: 2,
    bones: 100,
    bounds: [3, 3, 3],
  },
  {
    rank: 3,
    fileSize: 15 * 1048576,
    triangles: 32000,
    draws: 4,
    bones: 130,
    bounds: [4, 4, 4],
  },
  {
    rank: 2,
    fileSize: 25 * 1048576,
    triangles: 64000,
    draws: 32,
    bones: 160,
    bounds: [7, 6, 4],
  },
]

export class AvatarStats {
  static resolveInfo(file, node) {
    const stats = {}
    const bbox = new THREE.Box3().setFromObject(node.instance.raw.scene)
    const bounds = bbox
      .getSize(v1)
      .toArray()
      .map(n => parseFloat(n.toFixed(1)))
    stats.bounds = {
      value: bounds,
      rank: AvatarStats.determineRank(spec => {
        return spec.bounds[0] >= bounds[0] && spec.bounds[1] >= bounds[1] && spec.bounds[2] >= bounds[2]
      }),
    }

    let triangles = 0
    node.instance.raw.scene.traverse(node => {
      if (node.isMesh) {
        const geometry = node.geometry
        if (geometry.index !== null) {
          triangles += geometry.index.count / 3
        } else {
          triangles += geometry.attributes.position.count / 3
        }
      }
    })
    stats.triangles = {
      value: triangles,
      rank: AvatarStats.determineRank(spec => spec.triangles >= triangles),
    }

    let draws = 0
    node.instance.raw.scene.traverse(function (node) {
      if (node.isMesh) {
        const material = node.material
        if (Array.isArray(material)) {
          for (let i = 0; i < material.length; i++) {
            draws++
          }
        } else {
          draws++
        }
      }
    })
    stats.draws = {
      value: draws,
      rank: AvatarStats.determineRank(spec => spec.draws >= draws),
    }

    const fileSize = file.size
    stats.fileSize = {
      value: fileSize,
      rank: AvatarStats.determineRank(spec => spec.fileSize >= fileSize),
    }

    let skeleton = null
    node.instance.raw.scene.traverse(function (node) {
      if (node.isSkinnedMesh) {
        skeleton = node.skeleton
      }
    })
    const bones = skeleton?.bones.length || 0
    stats.bones = {
      value: bones,
      rank: AvatarStats.determineRank(spec => spec.bones >= bones),
    }

    let rank = 5
    for (const key in stats) {
      if (stats[key].rank < rank) {
        rank = stats[key].rank
      }
    }

    return {
      rank,
      stats,
    }
  }

  static determineRank(fn) {
    for (const spec of specs) {
      if (fn(spec)) return spec.rank
    }
    return 1
  }
}
