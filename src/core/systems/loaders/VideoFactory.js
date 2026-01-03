// Video factory with HLS and streaming support
import * as THREE from '../../extras/three.js'
import Hls from 'hls.js/dist/hls.js'
import { BaseFactory } from '../../patterns/BaseFactory.js'

export class VideoFactory extends BaseFactory {
  static create(config) {
    this.validate(config)
    const { url, world } = config
    return this.createVideoFactory(url, world)
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('VideoFactory config must be an object')
    }
    if (!config.url || !config.world) {
      throw new Error('VideoFactory config requires url and world')
    }
  }

  static createVideoFactory(url, world) {
    const isHLS = url?.endsWith('.m3u8')
    const sources = {}
    let width
    let height
    let duration
    let ready = false
    let prepare

    const createSource = (key) => {
      const elem = document.createElement('video')
      elem.crossOrigin = 'anonymous'
      elem.playsInline = true
      elem.loop = false
      elem.muted = true
      elem.style.width = '1px'
      elem.style.height = '1px'
      elem.style.position = 'absolute'
      elem.style.opacity = '0'
      elem.style.zIndex = '-1000'
      elem.style.pointerEvents = 'none'
      elem.style.overflow = 'hidden'

      const needsPolyfill = isHLS && !elem.canPlayType('application/vnd.apple.mpegurl') && Hls.isSupported()
      if (needsPolyfill) {
        const hls = new Hls()
        hls.loadSource(url)
        hls.attachMedia(elem)
      } else {
        elem.src = url
      }

      const audio = world.audio.ctx.createMediaElementSource(elem)
      let n = 0
      let dead

      world.audio.ready(() => {
        if (dead) return
        elem.muted = false
      })

      const texture = new THREE.VideoTexture(elem)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.anisotropy = world.graphics.maxAnisotropy

      if (!prepare) {
        prepare = (function () {
          return new Promise(async resolve => {
            let playing = false
            let data = false
            const loadedDataHandler = async () => {
              if (playing) elem.pause()
              data = true
              width = elem.videoWidth
              height = elem.videoHeight
              duration = elem.duration
              ready = true
              resolve()
            }
            const loadedMetadataHandler = async () => {
              if (data) return
              elem.play()
              playing = true
            }
            elem.addEventListener('loadeddata', loadedDataHandler, { once: true })
            elem.addEventListener('loadedmetadata', loadedMetadataHandler, { once: true })
          })
        })()
      }

      const isPlaying = () => {
        return elem.currentTime > 0 && !elem.paused && !elem.ended && elem.readyState > 2
      }

      const play = (restartIfPlaying = false) => {
        if (restartIfPlaying) elem.currentTime = 0
        elem.play()
      }

      const pause = () => {
        elem.pause()
      }

      const stop = () => {
        elem.currentTime = 0
        elem.pause()
      }

      const release = () => {
        n--
        if (n === 0) {
          stop()
          audio.disconnect()
          texture.dispose()
          document.body.removeChild(elem)
          delete sources[key]
          elem.src = ''
          elem.load()
        }
      }

      const handle = {
        elem,
        audio,
        texture,
        prepare,
        get ready() {
          return ready
        },
        get width() {
          return width
        },
        get height() {
          return height
        },
        get duration() {
          return duration
        },
        get loop() {
          return elem.loop
        },
        set loop(value) {
          elem.loop = value
        },
        get isPlaying() {
          return isPlaying()
        },
        get currentTime() {
          return elem.currentTime
        },
        set currentTime(value) {
          elem.currentTime = value
        },
        play,
        pause,
        stop,
        release,
      }

      return {
        createHandle() {
          n++
          if (n === 1) {
            document.body.appendChild(elem)
          }
          return handle
        },
      }
    }

    return {
      get(key) {
        let source = sources[key]
        if (!source) {
          source = createSource(key)
          sources[key] = source
        }
        return source.createHandle()
      },
      cleanup() {
        for (const key in sources) {
          const source = sources[key]
          if (source) {
            const handle = source.createHandle()
            handle.release()
          }
        }
      }
    }
  }
}

export function createVideoFactory(url, world) {
  return VideoFactory.create({ url, world })
}
