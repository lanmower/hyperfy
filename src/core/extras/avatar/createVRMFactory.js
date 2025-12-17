import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import * as THREE from './three.js'
import { DEG2RAD } from './general.js'
import { getTrianglesFromGeometry } from './getTrianglesFromGeometry.js'
import { getTextureBytesFromMaterial } from './getTextureBytesFromMaterial.js'
import { Emotes } from './playerEmotes.js'
import { Modes } from '../constants/AnimationModes.js'
import { DIST_MIN_RATE, DIST_MAX_RATE, DIST_MIN, DIST_MAX, MAX_GAZE_DISTANCE, AimAxis, UpAxis } from './VRMFactoryConfig.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const m1 = new THREE.Matrix4()

const FORWARD = new THREE.Vector3(0, 0, -1)

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

    const mixer = new THREE.AnimationMixer(skinnedMeshes[0])

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

    const loco = {
      mode: Modes.IDLE,
      axis: new THREE.Vector3(),
      gazeDir: null,
    }
    const setLocomotion = (mode, axis, gazeDir) => {
      loco.mode = mode
      loco.axis = axis
      loco.gazeDir = gazeDir
    }

    const emotes = {
    }
    let currentEmote
    const setEmote = url => {
      if (currentEmote?.url === url) return
      if (currentEmote) {
        currentEmote.action?.fadeOut(0.15)
        currentEmote = null
      }
      if (!url) return
      const opts = getQueryParams(url)
      const loop = opts.l !== '0'
      const speed = parseFloat(opts.s || 1)
      const gaze = opts.g == '1'

      if (emotes[url]) {
        currentEmote = emotes[url]
        if (currentEmote.action) {
          currentEmote.action.clampWhenFinished = !loop
          currentEmote.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
          currentEmote.action.reset().fadeIn(0.15).play()
          clearLocomotion()
        }
      } else {
        const emote = {
          url,
          loading: true,
          action: null,
          gaze,
        }
        emotes[url] = emote
        currentEmote = emote
        hooks.loader.load('emote', url).then(emo => {
          const clip = emo.toClip({
            rootToHips,
            version,
            getBoneName,
          })
          const action = mixer.clipAction(clip)
          action.timeScale = speed
          emote.action = action
          if (currentEmote === emote) {
            action.clampWhenFinished = !loop
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
            action.play()
            clearLocomotion()
          }
        })
      }
    }


    let elapsed = 0
    let rate = 0
    let rateCheck = true
    let distance

    const updateRate = () => {
      const vrmPos = v1.setFromMatrixPosition(vrm.scene.matrix)
      const camPos = v2.setFromMatrixPosition(hooks.camera.matrixWorld) // prettier-ignore
      distance = vrmPos.distanceTo(camPos)
      const clampedDistance = Math.max(distance - DIST_MIN, 0)
      const normalizedDistance = Math.min(clampedDistance / (DIST_MAX - DIST_MIN), 1) // prettier-ignore
      rate = DIST_MAX_RATE + normalizedDistance * (DIST_MIN_RATE - DIST_MAX_RATE) // prettier-ignore
    }

    const update = delta => {
      elapsed += delta
      const should = rateCheck ? elapsed >= rate : true
      if (should) {
        mixer.update(elapsed)
        skeleton.bones.forEach(bone => bone.updateMatrixWorld())
        skeleton.update = THREE.Skeleton.prototype.update
        if (!currentEmote) {
          updateLocomotion(delta)
        }
        if (loco.gazeDir && distance < MAX_GAZE_DISTANCE && (currentEmote ? currentEmote.gaze : true)) {
          aimBone('neck', loco.gazeDir, delta, {
            minAngle: -30,
            maxAngle: 30,
            smoothing: 0.4,
            weight: 0.6,
          })
          aimBone('head', loco.gazeDir, delta, {
            minAngle: -30,
            maxAngle: 30,
            smoothing: 0.4,
            weight: 0.6,
          })
        }
        elapsed = 0
      } else {
        skeleton.update = noop
      }
    }

    const aimBone = (() => {
      const smoothedRotations = new Map()
      const normalizedDir = new THREE.Vector3()
      const parentWorldMatrix = new THREE.Matrix4()
      const parentWorldRotationInverse = new THREE.Quaternion()
      const localDir = new THREE.Vector3()
      const currentAimDir = new THREE.Vector3()
      const rot = new THREE.Quaternion()
      const worldUp = new THREE.Vector3()
      const localUp = new THREE.Vector3()
      const rotatedUp = new THREE.Vector3()
      const projectedUp = new THREE.Vector3()
      const upCorrection = new THREE.Quaternion()
      const cross = new THREE.Vector3()
      const targetRotation = new THREE.Quaternion()
      const restToTarget = new THREE.Quaternion()

      return function aimBone(boneName, targetDir, delta, options = {}) {
        const {
          aimAxis = AimAxis.NEG_Z,
          upAxis = UpAxis.Y,
          smoothing = 0.7, // smoothing factor (0-1)
          weight = 1.0,
          maintainOffset = false,
          minAngle = -180,
          maxAngle = 180,
        } = options
        const bone = findBone(boneName)
        const parentBone = glb.userData.vrm.humanoid.humanBones[boneName].node.parent
        if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
        if (!parentBone) return console.warn(`aimBone: no parent bone`)
        const boneId = bone.uuid
        if (!smoothedRotations.has(boneId)) {
          smoothedRotations.set(boneId, {
            current: bone.quaternion.clone(),
            target: new THREE.Quaternion(),
          })
        }
        const smoothState = smoothedRotations.get(boneId)
        normalizedDir.copy(targetDir).normalize()
        parentWorldMatrix.multiplyMatrices(vrm.scene.matrixWorld, parentBone.matrixWorld)
        parentWorldMatrix.decompose(v1, parentWorldRotationInverse, v2)
        parentWorldRotationInverse.invert()
        localDir.copy(normalizedDir).applyQuaternion(parentWorldRotationInverse)
        if (maintainOffset && !bone.userData.initialRotationOffset) {
          bone.userData.initialRotationOffset = bone.quaternion.clone()
        }
        currentAimDir.copy(aimAxis)
        if (maintainOffset && bone.userData.initialRotationOffset) {
          currentAimDir.applyQuaternion(bone.userData.initialRotationOffset)
        }
        rot.setFromUnitVectors(aimAxis, localDir)
        worldUp.copy(upAxis)
        localUp.copy(worldUp).applyQuaternion(parentWorldRotationInverse)
        rotatedUp.copy(upAxis).applyQuaternion(rot)
        projectedUp.copy(localUp)
        projectedUp.sub(v1.copy(localDir).multiplyScalar(localDir.dot(localUp)))
        projectedUp.normalize()
        if (projectedUp.lengthSq() > 0.001) {
          upCorrection.setFromUnitVectors(rotatedUp, projectedUp)
          const angle = rotatedUp.angleTo(projectedUp)
          cross.crossVectors(rotatedUp, projectedUp)
          if (cross.dot(localDir) < 0) {
            upCorrection.setFromAxisAngle(localDir, -angle)
          } else {
            upCorrection.setFromAxisAngle(localDir, angle)
          }
          rot.premultiply(upCorrection)
        }
        targetRotation.copy(rot)
        if (maintainOffset && bone.userData.initialRotationOffset) {
          targetRotation.multiply(bone.userData.initialRotationOffset)
        }
        if (minAngle > -180 || maxAngle < 180) {
          if (!bone.userData.restRotation) {
            bone.userData.restRotation = bone.quaternion.clone()
          }
          restToTarget.copy(bone.userData.restRotation).invert().multiply(targetRotation)
          const w = restToTarget.w
          const angle = 2 * Math.acos(Math.min(Math.max(w, -1), 1))
          const angleDeg = THREE.MathUtils.radToDeg(angle)
          if (angleDeg > maxAngle || angleDeg < minAngle) {
            const clampedAngleDeg = THREE.MathUtils.clamp(angleDeg, minAngle, maxAngle)
            const clampedAngleRad = THREE.MathUtils.degToRad(clampedAngleDeg)
            const scale = clampedAngleRad / angle
            q1.copy(targetRotation)
            targetRotation.slerpQuaternions(bone.userData.restRotation, q1, scale)
          }
        }
        if (weight < 1.0) {
          targetRotation.slerp(bone.quaternion, 1.0 - weight)
        }
        smoothState.target.copy(targetRotation)
        smoothState.current.slerp(smoothState.target, smoothing)
        bone.quaternion.copy(smoothState.current)
        bone.updateMatrixWorld(true)
      }
    })()

    const aimBoneDir = new THREE.Vector3()
    function aimBoneAt(boneName, targetPos, delta, options = {}) {
      const bone = findBone(boneName)
      if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
      const boneWorldMatrix = getBoneTransform(boneName)
      const boneWorldPos = v1.setFromMatrixPosition(boneWorldMatrix)
      aimBoneDir.subVectors(targetPos, boneWorldPos).normalize()
      aimBone(boneName, aimBoneDir, delta, options)
    }


    const poses = {}
    function addPose(key, url) {
      const opts = getQueryParams(url)
      const speed = parseFloat(opts.s || 1)
      const pose = {
        loading: true,
        active: false,
        action: null,
        weight: 0,
        target: 0,
        setWeight: value => {
          pose.weight = value
          if (pose.action) {
            pose.action.weight = value
            if (!pose.active) {
              pose.action.reset().fadeIn(0.15).play()
              pose.active = true
            }
          }
        },
        fadeOut: () => {
          pose.weight = 0
          pose.action?.fadeOut(0.15)
          pose.active = false
        },
      }
      hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({
          rootToHips,
          version,
          getBoneName,
        })
        pose.action = mixer.clipAction(clip)
        pose.action.timeScale = speed
        pose.action.weight = pose.weight
        pose.action.play()
      })
      poses[key] = pose
    }
    addPose('idle', Emotes.IDLE)
    addPose('walk', Emotes.WALK)
    addPose('walkLeft', Emotes.WALK_LEFT)
    addPose('walkBack', Emotes.WALK_BACK)
    addPose('walkRight', Emotes.WALK_RIGHT)
    addPose('run', Emotes.RUN)
    addPose('runLeft', Emotes.RUN_LEFT)
    addPose('runBack', Emotes.RUN_BACK)
    addPose('runRight', Emotes.RUN_RIGHT)
    addPose('jump', Emotes.JUMP)
    addPose('fall', Emotes.FALL)
    addPose('fly', Emotes.FLY)
    addPose('talk', Emotes.TALK)
    function clearLocomotion() {
      for (const key in poses) {
        poses[key].fadeOut()
      }
    }
    function updateLocomotion(delta) {
      const { mode, axis } = loco
      for (const key in poses) {
        poses[key].target = 0
      }
      if (mode === Modes.IDLE) {
        poses.idle.target = 1
      } else if (mode === Modes.WALK || mode === Modes.RUN) {
        const angle = Math.atan2(axis.x, -axis.z)
        const angleDeg = ((angle * 180) / Math.PI + 360) % 360
        const prefix = mode === Modes.RUN ? 'run' : 'walk'
        const forwardKey = prefix // This should be "walk" or "run"
        const leftKey = `${prefix}Left`
        const backKey = `${prefix}Back`
        const rightKey = `${prefix}Right`
        if (axis.length() > 0.01) {
          if (angleDeg >= 337.5 || angleDeg < 22.5) {
            poses[forwardKey].target = 1
          } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
            const blend = (angleDeg - 22.5) / 45
            poses[forwardKey].target = 1 - blend
            poses[rightKey].target = blend
          } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
            poses[rightKey].target = 1
          } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
            const blend = (angleDeg - 112.5) / 45
            poses[rightKey].target = 1 - blend
            poses[backKey].target = blend
          } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
            poses[backKey].target = 1
          } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
            const blend = (angleDeg - 202.5) / 45
            poses[backKey].target = 1 - blend
            poses[leftKey].target = blend
          } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
            poses[leftKey].target = 1
          } else if (angleDeg >= 292.5 && angleDeg < 337.5) {
            const blend = (angleDeg - 292.5) / 45
            poses[leftKey].target = 1 - blend
            poses[forwardKey].target = blend
          }
        }
      } else if (mode === Modes.JUMP) {
        poses.jump.target = 1
      } else if (mode === Modes.FALL) {
        poses.fall.target = 1
      } else if (mode === Modes.FLY) {
        poses.fly.target = 1
      } else if (mode === Modes.TALK) {
        poses.talk.target = 1
      }
      const lerpSpeed = 16
      for (const key in poses) {
        const pose = poses[key]
        const weight = THREE.MathUtils.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
        pose.setWeight(weight)
      }
    }


    let firstPersonActive = false
    const setFirstPerson = active => {
      if (firstPersonActive === active) return
      const head = findBone('neck')
      head.scale.setScalar(active ? 0 : 1)
      firstPersonActive = active
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
        rateCheck = false
      },
      destroy() {
        hooks.scene.remove(vrm.scene)
        hooks.octree?.remove(sItem)
      },
    }
  }
}

function cloneGLB(glb) {
  return { ...glb, scene: SkeletonUtils.clone(glb.scene) }
}

function getSkinnedMeshes(scene) {
  let meshes = []
  scene.traverse(o => {
    if (o.isSkinnedMesh) {
      meshes.push(o)
    }
  })
  return meshes
}

function createCapsule(radius, height) {
  const fullHeight = radius + height + radius
  const geometry = new THREE.CapsuleGeometry(radius, height)
  geometry.translate(0, fullHeight / 2, 0)
  return geometry
}

let queryParams = {}
function getQueryParams(url) {
  if (!queryParams[url]) {
    url = new URL(url)
    const params = {}
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value
    }
    queryParams[url] = params
  }
  return queryParams[url]
}
