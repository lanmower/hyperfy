import * as THREE from '../../extras/three.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

export class PlayerVoiceController {
  constructor(world, player, level, muted, track, participant, livekit) {
    this.world = world
    this.player = player
    this.level = level
    this.muted = muted
    this.track = track
    this.participant = participant
    this.livekit = livekit
    this.track.setAudioContext(world.audio.ctx)
    this.root = world.audio.ctx.createGain()
    this.panner = world.audio.ctx.createPanner()
    this.panner.panningModel = 'HRTF'
    this.panner.distanceModel = 'inverse'
    this.panner.refDistance = 1
    this.panner.maxDistance = 40
    this.panner.rolloffFactor = 3
    this.panner.coneInnerAngle = 360
    this.panner.coneOuterAngle = 360
    this.panner.coneOuterGain = 0
    this.gain = world.audio.groupGains.voice
    this.root.connect(this.gain)
    this.root.connect(this.panner)
    this.panner.connect(this.gain)
    this.track.attach()
    this.apply()
  }

  setMuted(muted) {
    if (this.muted === muted) return
    this.muted = muted
    this.apply()
  }

  setLevel(level) {
    if (this.level === level) return
    this.level = level
    this.apply()
  }

  apply() {
    if (this.muted) {
      this.root.gain.value = 0
      this.track.setWebAudioPlugins([this.root])
    } else if (this.level === 'disabled') {
      this.root.gain.value = 0
      this.track.setWebAudioPlugins([this.root])
    } else if (this.level === 'spatial') {
      this.root.gain.value = 1
      this.track.setWebAudioPlugins([this.panner])
    } else if (this.level === 'global') {
      this.root.gain.value = 1
      this.track.setWebAudioPlugins([this.root])
    }
  }

  lateUpdate(delta) {
    if (this.muted) return
    if (this.level !== 'spatial') return
    const audio = this.world.audio
    const matrix = this.player.base.matrixWorld
    const pos = v1.setFromMatrixPosition(matrix)
    const qua = q1.setFromRotationMatrix(matrix)
    const dir = v2.set(0, 0, -1).applyQuaternion(qua)
    if (this.panner.positionX) {
      const endTime = audio.ctx.currentTime + audio.lastDelta
      this.panner.positionX.linearRampToValueAtTime(pos.x, endTime)
      this.panner.positionY.linearRampToValueAtTime(pos.y, endTime)
      this.panner.positionZ.linearRampToValueAtTime(pos.z, endTime)
      this.panner.orientationX.linearRampToValueAtTime(dir.x, endTime)
      this.panner.orientationY.linearRampToValueAtTime(dir.y, endTime)
      this.panner.orientationZ.linearRampToValueAtTime(dir.z, endTime)
    } else {
      this.panner.setPosition(pos.x, pos.y, pos.z)
      this.panner.setOrientation(dir.x, dir.y, dir.z)
    }
  }

  destroy() {
    this.livekit.emit('speaking', { playerId: this.player.data.id, speaking: false })
    this.player.setSpeaking(false)
    this.track.detach()
  }
}
