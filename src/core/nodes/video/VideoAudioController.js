import { v, q } from '../../utils/TempVectors.js'

export class VideoAudioController {
  constructor(video) {
    this.video = video
  }

  setupAudio(instance) {
    const video = this.video
    const ctx = video.ctx.world.audio

    video.gain = ctx.ctx.createGain()
    video.gain.gain.value = video._volume
    video.gain.connect(ctx.groupGains.music)

    if (video._spatial) {
      video.pannerNode = ctx.ctx.createPanner()
      video.pannerNode.panningModel = 'HRTF'
      video.pannerNode.distanceModel = video._distanceModel
      video.pannerNode.refDistance = video._refDistance
      video.pannerNode.maxDistance = video._maxDistance
      video.pannerNode.rolloffFactor = video._rolloffFactor
      video.pannerNode.coneInnerAngle = video._coneInnerAngle
      video.pannerNode.coneOuterAngle = video._coneOuterAngle
      video.pannerNode.coneOuterGain = video._coneOuterGain
      video.pannerNode.connect(video.gain)
      instance.audio?.connect(video.pannerNode)
      this.updatePannerPosition()
    } else {
      instance.audio?.connect(video.gain)
    }
  }

  updatePannerPosition() {
    const video = this.video
    if (!video.pannerNode) return

    const audio = video.ctx.world.audio
    const pos = v[0].setFromMatrixPosition(video.matrixWorld)
    const qua = q[0].setFromRotationMatrix(video.matrixWorld)
    const dir = v[1].set(0, 0, -1).applyQuaternion(qua)

    if (video.pannerNode.positionX) {
      const endTime = audio.ctx.currentTime + audio.lastDelta
      video.pannerNode.positionX.linearRampToValueAtTime(pos.x, endTime)
      video.pannerNode.positionY.linearRampToValueAtTime(pos.y, endTime)
      video.pannerNode.positionZ.linearRampToValueAtTime(pos.z, endTime)
      video.pannerNode.orientationX.linearRampToValueAtTime(dir.x, endTime)
      video.pannerNode.orientationY.linearRampToValueAtTime(dir.y, endTime)
      video.pannerNode.orientationZ.linearRampToValueAtTime(dir.z, endTime)
    } else {
      video.pannerNode.setPosition(pos.x, pos.y, pos.z)
      video.pannerNode.setOrientation(dir.x, dir.y, dir.z)
    }
  }

  cleanup() {
    const video = this.video
    if (video.instance) {
      if (video.pannerNode) {
        video.instance.audio?.disconnect(video.pannerNode)
      } else {
        video.instance.audio?.disconnect(video.gain)
      }
    }
    video.pannerNode = null
    video.gain = null
  }
}
