import * as THREE from 'three'
import { normalizedBoneNames } from './BoneNameMappings.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { q1, q2: restRotationInverse, q3: parentRestWorldRotation } = SharedVectorPool('createEmoteFactory', 0, 3)

export function createEmoteFactory(glb, url) {
  const clip = glb.animations[0]

  const scale = glb.scene.children[0].scale.x // armature should be here?

  const yOffset = -0.05 / scale

  let haveRoot

  clip.tracks = clip.tracks.filter(track => {
    if (track instanceof THREE.VectorKeyframeTrack) {
      const [name, type] = track.name.split('.')
      if (type !== 'position') return
      if (name === 'Root') {
        haveRoot = true
        return true
      }
      if (name === 'mixamorigHips') {
        return true
      }
      return false
    }
    return true
  })


  clip.tracks.forEach(track => {
    const trackSplitted = track.name.split('.')
    const mixamoRigName = trackSplitted[0]
    const mixamoRigNode = glb.scene.getObjectByName(mixamoRigName)
    mixamoRigNode.getWorldQuaternion(restRotationInverse).invert()
    mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation)
    if (track instanceof THREE.QuaternionKeyframeTrack) {
      for (let i = 0; i < track.values.length; i += 4) {
        const flatQuaternion = track.values.slice(i, i + 4)
        q1.fromArray(flatQuaternion)
        q1.premultiply(parentRestWorldRotation).multiply(restRotationInverse)
        q1.toArray(flatQuaternion)
        flatQuaternion.forEach((v, index) => {
          track.values[index + i] = v
        })
      }
    } else if (track instanceof THREE.VectorKeyframeTrack) {
      if (yOffset) {
        track.values = track.values.map((v, i) => {
          if (i % 3 === 1) {
            return v + yOffset
          }
          return v
        })
      }
    }
  })

  clip.optimize()

  return {
    toClip({ rootToHips, version, getBoneName }) {
      const height = rootToHips

      const tracks = []

      clip.tracks.forEach(track => {
        const trackSplitted = track.name.split('.')
        const ogBoneName = trackSplitted[0]
        const vrmBoneName = normalizedBoneNames[ogBoneName]
        const vrmNodeName = getBoneName(vrmBoneName)

        const scaler = height * scale

        if (vrmNodeName !== undefined) {
          const propertyName = trackSplitted[1]

          if (track instanceof THREE.QuaternionKeyframeTrack) {
            tracks.push(
              new THREE.QuaternionKeyframeTrack(
                `${vrmNodeName}.${propertyName}`,
                track.times,
                track.values.map((v, i) => (version === '0' && i % 2 === 0 ? -v : v))
              )
            )
          } else if (track instanceof THREE.VectorKeyframeTrack) {
            tracks.push(
              new THREE.VectorKeyframeTrack(
                `${vrmNodeName}.${propertyName}`,
                track.times,
                track.values.map((v, i) => {
                  return (version === '0' && i % 3 !== 1 ? -v : v) * scaler
                })
              )
            )
          }
        }
      })

      return new THREE.AnimationClip(
        clip.name, // todo: name variable?
        clip.duration,
        tracks
      )
    },
  }
}
