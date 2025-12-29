import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('AudioContextSetup')

export class AudioContextSetup {
  static createContext(prefs) {
    const ctx = new AudioContext()
    const masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
    const groupGains = {
      music: ctx.createGain(),
      sfx: ctx.createGain(),
      voice: ctx.createGain(),
    }
    groupGains.music.gain.value = prefs.state.get('music')
    groupGains.sfx.gain.value = prefs.state.get('sfx')
    groupGains.voice.gain.value = prefs.state.get('voice')
    groupGains.music.connect(masterGain)
    groupGains.sfx.connect(masterGain)
    groupGains.voice.connect(masterGain)
    const listener = ctx.listener
    listener.positionX.value = 0
    listener.positionY.value = 0
    listener.positionZ.value = 0
    listener.forwardX.value = 0
    listener.forwardY.value = 0
    listener.forwardZ.value = -1
    listener.upX.value = 0
    listener.upY.value = 1
    listener.upZ.value = 0
    return { ctx, masterGain, groupGains, listener }
  }

  static setupUnlockListener(ctx, queue, onUnlocked) {
    const complete = () => {
      onUnlocked()
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
      while (queue.length) {
        queue.pop()()
      }
      logger.info('Audio context unlocked', {})
    }
    const unlock = async () => {
      try {
        await ctx.resume()
        if (ctx.state !== 'running') throw new Error('Audio still suspended')
        const video = document.createElement('video')
        video.playsInline = true
        video.muted = true
        video.src = '/tiny.mp4'
        video
          .play()
          .then(() => {
            video.pause()
            video.remove()
            logger.info('Audio setup video played', {})
          })
          .catch(err => {
            logger.warn('Audio setup video failed', { error: err.message })
          })
      } catch (err) {
        logger.error('Audio context resume failed', { error: err.message })
      } finally {
        complete()
      }
    }
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    document.addEventListener('keydown', unlock)
    logger.info('Audio context suspended - waiting for user interaction', {})
  }
}
