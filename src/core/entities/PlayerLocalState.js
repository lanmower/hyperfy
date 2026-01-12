import { Modes } from '../constants/AnimationModes.js'
import { PhysicsConfig } from '../config/SystemConfig.js'
import { createNode } from '../extras/createNode.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const { v1: axisVec, v2: gazeVec } = SharedVectorPool('PlayerLocalState', 2, 0)

export class PlayerLocalState {
  static initializeState(player) {
    player.mass = PhysicsConfig.MASS
    player.capsuleRadius = PhysicsConfig.CAPSULE_RADIUS
    player.capsuleHeight = PhysicsConfig.CAPSULE_HEIGHT
    player.firstPerson = false
    player.mode = Modes.IDLE
    player.axis = axisVec.set(0, 0, 0)
    player.gaze = gazeVec.set(0, 0, 0)
    player.speaking = false
    player.lastSendAt = 0
    player.avatar = null
    player.avatarUrl = null
    player.effectOnEnd = null
  }

  static initializeSceneObjects(player) {
    player.pcEntity = null
    player.auraEntity = null
    player.base = null
    player.aura = null
  }

  static initializeUINodes(player) {
    player.nametag = createNode('nametag', {
      label: '',
      health: player.data.health,
      active: false,
    })

    player.bubble = createNode('ui', {
      id: 'bubble',
      width: 300,
      height: 512,
      pivot: 'bottom-center',
      billboard: 'full',
      scaler: [3, 30],
      justifyContent: 'flex-end',
      alignItems: 'center',
      active: false,
    })

    player.bubbleBox = createNode('uiview', {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
    })

    player.bubbleText = createNode('uitext', {
      color: 'white',
      fontWeight: 100,
      lineHeight: 1.4,
      fontSize: 16,
    })
  }

  static clearUINodes(player) {
    player.nametag = null
    player.bubble = null
    player.bubbleBox = null
    player.bubbleText = null
  }

  static clearAvatarData(player) {
    player.avatar = null
    player.avatarUrl = null
  }

  static clearPhysicsData(player) {
    player.physics = null
  }

  static clearSceneObjects(player) {
    player.base = null
    player.aura = null
  }

  static clearAllState(player) {
    player.pushForce = null
    player.stick = null
    player.pan = null
    player.effectOnEnd = null
  }
}
