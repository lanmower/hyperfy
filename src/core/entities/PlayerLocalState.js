import * as THREE from '../extras/three.js'
import { Modes } from '../constants/AnimationModes.js'
import { PhysicsConfig } from '../config/SystemConfig.js'
import { createNode } from '../extras/createNode.js'

export class PlayerLocalState {
  static initializeState(player) {
    player.mass = PhysicsConfig.MASS
    player.capsuleRadius = PhysicsConfig.CAPSULE_RADIUS
    player.capsuleHeight = PhysicsConfig.CAPSULE_HEIGHT
    player.firstPerson = false
    player.mode = Modes.IDLE
    player.axis = new THREE.Vector3()
    player.gaze = new THREE.Vector3()
    player.speaking = false
    player.lastSendAt = 0
    player.avatar = null
    player.avatarUrl = null
    player.effectOnEnd = null
  }

  static initializeSceneObjects(player) {
    player.base = new THREE.Object3D()
    player.base.position.fromArray(player.data.position)
    player.base.quaternion.fromArray(player.data.quaternion)
    player.world.stage.scene.add(player.base)

    player.aura = new THREE.Object3D()
    player.world.stage.scene.add(player.aura)
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
    if (player.base && player.world.stage?.scene) {
      player.world.stage.scene.remove(player.base)
      player.base = null
    }

    if (player.aura && player.world.stage?.scene) {
      player.world.stage.scene.remove(player.aura)
      player.aura = null
    }

    if (player.avatar?.raw?.scene && player.base) {
      player.base.remove(player.avatar.raw.scene)
    }
  }

  static clearAllState(player) {
    player.pushForce = null
    player.stick = null
    player.pan = null
    player.effectOnEnd = null
  }
}
