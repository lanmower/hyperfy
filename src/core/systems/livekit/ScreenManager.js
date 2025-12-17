import * as THREE from '../../extras/three.js'

export class ScreenManager {
  constructor(livekit) {
    this.livekit = livekit
    this.screens = []
    this.screenNodes = new Set()
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

  destroyAll() {
    this.screens.forEach(screen => {
      screen.destroy()
    })
    this.screens = []
    this.screenNodes.clear()
  }
}

export function createPlayerScreen({ world, playerId, targetId, track, publication }) {
  const elem = document.createElement('video')
  elem.playsInline = true
  elem.muted = true
  track.attach(elem)
  const texture = new THREE.VideoTexture(elem)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = world.graphics.maxAnisotropy
  texture.needsUpdate = true
  let width
  let height
  let ready = false
  const prepare = (function () {
    return new Promise(async resolve => {
      let playing = false
      let data = false
      elem.addEventListener(
        'loadeddata',
        async () => {
          if (playing) elem.pause()
          data = true
          width = elem.videoWidth
          height = elem.videoHeight
          ready = true
          resolve()
        },
        { once: true }
      )
      elem.addEventListener(
        'loadedmetadata',
        async () => {
          if (data) return
        },
        { once: true }
      )
    })
  })()
  function isPlaying() {
    return true
  }
  function play(restartIfPlaying = false) {
  }
  function pause() {
  }
  function stop() {
  }
  function release() {
  }
  function destroy() {
    texture.dispose()
  }
  const handle = {
    isScreen: true,
    playerId,
    targetId,
    elem,
    audio: null,
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
    get loop() {
      return false
    },
    set loop(value) {
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
    destroy,
  }
  return handle
}
