import * as THREE from '../../extras/three.js'

export class ScreenManager {
  constructor(clientLiveKit) {
    this.clientLiveKit = clientLiveKit
    this.screens = []
    this.screenNodes = new Set()
  }

  createPlayerScreen({ playerId, targetId, track, publication }) {
    const elem = document.createElement('video')
    elem.playsInline = true
    elem.muted = true
    track.attach(elem)
    const texture = new THREE.VideoTexture(elem)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = this.clientLiveKit.world.graphics.maxAnisotropy
    texture.needsUpdate = true
    return { playerId, targetId, track, publication, texture, elem }
  }

  addScreen(screen) {
    this.screens.push(screen)
    for (const node of this.screenNodes) {
      if (node._screenId === screen.targetId) {
        node.needsRebuild = true
        node.setDirty()
      }
    }
  }

  removeScreen(screen) {
    screen.destroy()
    this.screens = this.screens.filter(s => s !== screen)
    for (const node of this.screenNodes) {
      if (node._screenId === screen.targetId) {
        node.needsRebuild = true
        node.setDirty()
      }
    }
  }

  setScreenShareTarget(targetId = null) {
    const room = this.clientLiveKit.room
    if (!room) return console.error('[livekit] setScreenShareTarget failed (not connected)')
    if (this.clientLiveKit.status.screenshare === targetId) return
    const metadata = JSON.stringify({ screenTargetId: targetId })
    room.localParticipant.setMetadata(metadata)
    room.localParticipant.setScreenShareEnabled(!!targetId, {})
  }

  registerScreenNode(node) {
    this.screenNodes.add(node)
    let match
    for (const screen of this.screens) {
      if (screen.targetId === node._screenId) {
        match = screen
      }
    }
    return match
  }

  unregisterScreenNode(node) {
    this.screenNodes.delete(node)
  }

  destroy() {
    this.screens.forEach(screen => screen.destroy())
    this.screens = []
    this.screenNodes.clear()
  }
}
