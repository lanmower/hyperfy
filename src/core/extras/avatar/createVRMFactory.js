import * as THREE from '../three.js'
import { DEG2RAD } from '../general.js'
import { getTrianglesFromGeometry } from '../getTrianglesFromGeometry.js'
import { getTextureBytesFromMaterial } from '../getTextureBytesFromMaterial.js'
import { MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { cloneGLB, getSkinnedMeshes, createCapsule } from './VRMUtilities.js'
import { VRMAnimationMixer } from './VRMAnimationMixer.js'
import { VRMLocomotionController } from './VRMLocomotionController.js'
import { VRMGazeController } from './VRMGazeController.js'

const v1 = new THREE.Vector3()
const material = new THREE.MeshBasicMaterial()

export function createVRMFactory(glb, setupMaterial) {
  glb.scene.matrixAutoUpdate = false
  glb.scene.matrixWorldAutoUpdate = false
  const expressions = glb.scene.children.filter(n => n.type === 'VRMExpression') // prettier-ignore
  for (const node of expressions) node.removeFromParent()
  const vrmHumanoidRigs = glb.scene.children.filter(n => n.name === 'VRMHumanoidRig') // prettier-ignore
  for (const node of vrmHumanoidRigs) node.removeFromParent()
  const secondaries = glb.scene.children.filter(n => n.name === 'secondary') // prettier-ignore
  for (const node of secondaries) node.removeFromParent()
  glb.scene.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })
  const bones = glb.userData.vrm.humanoid._rawHumanBones.humanBones
  const hipsPosition = v1.setFromMatrixPosition(bones.hips.node.matrixWorld)
  const rootPosition = v2.set(0, 0, 0) //setFromMatrixPosition(bones.root.node.matrixWorld)
  const rootToHips = hipsPosition.y - rootPosition.y
  const version = glb.userData.vrm.meta?.metaVersion
  const skinnedMeshes = []
  glb.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      node.bindMode = THREE.DetachedBindMode
      node.bindMatrix.copy(node.matrixWorld)
      node.bindMatrixInverse.copy(node.bindMatrix).invert()
      skinnedMeshes.push(node)
    }
    if (node.isMesh) {
      node.geometry.computeBoundsTree()
      node.material.shadowSide = THREE.BackSide
      setupMaterial(node.material)
    }
  })

  const skeleton = skinnedMeshes[0].skeleton // should be same across all skinnedMeshes

  const normBones = glb.userData.vrm.humanoid._normalizedHumanBones.humanBones
  const leftArm = normBones.leftUpperArm.node
  leftArm.rotation.z = 75 * DEG2RAD
  const rightArm = normBones.rightUpperArm.node
  rightArm.rotation.z = -75 * DEG2RAD
  glb.userData.vrm.humanoid.update(0)
  skeleton.update()

  let height = 0.5 // minimum
  for (const mesh of skinnedMeshes) {
    if (!mesh.boundingBox) mesh.computeBoundingBox()
    if (height < mesh.boundingBox.max.y) {
      height = mesh.boundingBox.max.y
    }
  }

  const headPos = normBones.head.node.getWorldPosition(new THREE.Vector3())
  const headToHeight = height - headPos.y

  const getBoneName = vrmBoneName => {
    return glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name
  }

  const noop = () => {
  }

  return {
    create,
    applyStats(stats) {
      glb.scene.traverse(obj => {
        if (obj.geometry && !stats.geometries.has(obj.geometry.uuid)) {
          stats.geometries.add(obj.geometry.uuid)
          stats.triangles += getTrianglesFromGeometry(obj.geometry)
        }
        if (obj.material && !stats.materials.has(obj.material.uuid)) {
          stats.materials.add(obj.material.uuid)
          stats.textureBytes += getTextureBytesFromMaterial(obj.material)
        }
      })
    },
  }

  function create(matrix, hooks, node) {
    const vrm = cloneGLB(glb)
    const tvrm = vrm.userData.vrm
    const skinnedMeshes = getSkinnedMeshes(vrm.scene)
    const skeleton = skinnedMeshes[0].skeleton // should be same across all skinnedMeshes
    const rootBone = skeleton.bones[0] // should always be 0
    rootBone.parent.remove(rootBone)
    rootBone.updateMatrixWorld(true)
    vrm.scene.matrix = matrix // synced!
    vrm.scene.matrixWorld = matrix // synced!
    hooks.scene.add(vrm.scene)

    const getEntity = () => node?.ctx.entity

    const cRadius = 0.3
    const sItem = {
      matrix,
      geometry: createCapsule(cRadius, height - cRadius * 2),
      material,
      getEntity,
    }
    hooks.octree?.insert(sItem)



    vrm.scene.traverse(o => {
      o.getEntity = getEntity
    })

    const getBoneName = vrmBoneName => {
      return glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name
    }

    const locomotionController = new VRMLocomotionController(null, hooks, rootToHips, version, getBoneName)
    const animationMixer = new VRMAnimationMixer(skinnedMeshes, hooks, rootToHips, version, getBoneName, () =>
      locomotionController.clearLocomotion()
    )
    locomotionController.mixer = animationMixer.mixer
    const gazeController = new VRMGazeController(skeleton, glb.userData.vrm, vrm.scene.matrixWorld)

    const bonesByName = {}
    const findBone = name => {
      if (!bonesByName[name]) {
        const actualName = glb.userData.vrm.humanoid.getRawBoneNode(name)?.name
        bonesByName[name] = skeleton.getBoneByName(actualName)
      }
      return bonesByName[name]
    }

    const mt = new THREE.Matrix4()
    const getBoneTransform = boneName => {
      const bone = findBone(boneName)
      if (!bone) return null
      return mt.multiplyMatrices(vrm.scene.matrixWorld, bone.matrixWorld)
    }

    locomotionController.addPose('idle', Emotes.IDLE)
    locomotionController.addPose('walk', Emotes.WALK)
    locomotionController.addPose('walkLeft', Emotes.WALK_LEFT)
    locomotionController.addPose('walkBack', Emotes.WALK_BACK)
    locomotionController.addPose('walkRight', Emotes.WALK_RIGHT)
    locomotionController.addPose('run', Emotes.RUN)
    locomotionController.addPose('runLeft', Emotes.RUN_LEFT)
    locomotionController.addPose('runBack', Emotes.RUN_BACK)
    locomotionController.addPose('runRight', Emotes.RUN_RIGHT)
    locomotionController.addPose('jump', Emotes.JUMP)
    locomotionController.addPose('fall', Emotes.FALL)
    locomotionController.addPose('fly', Emotes.FLY)
    locomotionController.addPose('talk', Emotes.TALK)

    const updateRate = () => {
      animationMixer.updateRate(vrm.scene.matrix, hooks.camera.matrixWorld)
    }

    const update = delta => {
      const shouldUpdate = animationMixer.update(delta)
      if (shouldUpdate) {
        skeleton.bones.forEach(bone => bone.updateMatrixWorld())
        skeleton.update = THREE.Skeleton.prototype.update
        if (!animationMixer.getCurrentEmote()) {
          locomotionController.updateLocomotion(delta)
        }
        const loco = locomotionController.getLocomotionState()
        const distance = animationMixer.getDistance()
        if (
          loco.gazeDir &&
          distance < MAX_GAZE_DISTANCE &&
          (animationMixer.getCurrentEmote() ? animationMixer.getCurrentEmote().gaze : true)
        ) {
          gazeController.aimBone('neck', loco.gazeDir, delta, {
            minAngle: -30,
            maxAngle: 30,
            smoothing: 0.4,
            weight: 0.6,
          })
          gazeController.aimBone('head', loco.gazeDir, delta, {
            minAngle: -30,
            maxAngle: 30,
            smoothing: 0.4,
            weight: 0.6,
          })
        }
      } else {
        skeleton.update = noop
      }
    }


    let firstPersonActive = false
    const setFirstPerson = active => {
      if (firstPersonActive === active) return
      const head = findBone('neck')
      head.scale.setScalar(active ? 0 : 1)
      firstPersonActive = active
    }

    const setLocomotion = (mode, axis, gazeDir) => {
      locomotionController.setLocomotion(mode, axis, gazeDir)
    }

    const setEmote = url => {
      animationMixer.setEmote(url)
    }

    return {
      raw: vrm,
      height,
      headToHeight,
      setEmote,
      setFirstPerson,
      update,
      updateRate,
      getBoneTransform,
      setLocomotion,
      setVisible(visible) {
        vrm.scene.traverse(o => {
          o.visible = visible
        })
      },
      move(_matrix) {
        matrix.copy(_matrix)
        hooks.octree?.move(sItem)
      },
      disableRateCheck() {
        animationMixer.disableRateCheck()
      },
      destroy() {
        hooks.scene.remove(vrm.scene)
        hooks.octree?.remove(sItem)
      },
    }
  }
}
