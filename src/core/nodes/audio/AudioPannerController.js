import { v, q } from '../../utils/TempVectors.js'

export class AudioPannerController {
  static updatePannerPosition(audioNode) {
    if (!audioNode.pannerNode) return
    const audio = audioNode.ctx.world.audio
    const pos = v[0].setFromMatrixPosition(audioNode.matrixWorld)
    const qua = q[0].setFromRotationMatrix(audioNode.matrixWorld)
    const dir = v[1].set(0, 0, -1).applyQuaternion(qua)
    if (audioNode.pannerNode.positionX) {
      const endTime = audio.ctx.currentTime + audio.lastDelta
      audioNode.pannerNode.positionX.linearRampToValueAtTime(pos.x, endTime)
      audioNode.pannerNode.positionY.linearRampToValueAtTime(pos.y, endTime)
      audioNode.pannerNode.positionZ.linearRampToValueAtTime(pos.z, endTime)
      audioNode.pannerNode.orientationX.linearRampToValueAtTime(dir.x, endTime)
      audioNode.pannerNode.orientationY.linearRampToValueAtTime(dir.y, endTime)
      audioNode.pannerNode.orientationZ.linearRampToValueAtTime(dir.z, endTime)
    } else {
      audioNode.pannerNode.setPosition(pos.x, pos.y, pos.z)
      audioNode.pannerNode.setOrientation(dir.x, dir.y, dir.z)
    }
  }
}
