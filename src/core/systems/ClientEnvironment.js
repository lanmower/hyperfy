import * as THREE from '../extras/three.js'

import { BaseEnvironment } from './BaseEnvironment.js'

import { CSM } from '../libs/csm/CSM.js'
import { isNumber, isString } from 'lodash-es'

const csmLevels = {
  none: {
    cascades: 1,
    shadowMapSize: 1024,
    castShadow: false,
    lightIntensity: 3,
  },
  low: {
    cascades: 1,
    shadowMapSize: 2048,
    castShadow: true,
    lightIntensity: 3,
    shadowBias: 0.0000009,
    shadowNormalBias: 0.001,
  },
  med: {
    cascades: 3,
    shadowMapSize: 1024,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.000002,
    shadowNormalBias: 0.002,
  },
  high: {
    cascades: 3,
    shadowMapSize: 2048,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.000003,
    shadowNormalBias: 0.002,
  },
}

THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG


  vFogDepth = length( mvPosition );



#endif
`

export class ClientEnvironment extends BaseEnvironment {
  static DEPS = {
    stage: 'stage',
    rig: 'rig',
    loader: 'loader',
    events: 'events',
    prefs: 'prefs',
    camera: 'camera',
  }

  static EVENTS = {
    prefChanged: 'onPrefChanged',
    graphicsResize: 'onGraphicsResize',
  }

  constructor(world) {
    super(world)
    this.skys = []
    this.sky = null
    this.skyN = 0
    this.bgUrl = null
    this.hdrUrl = null
  }

  init({ baseEnvironment }) {
    this.base = baseEnvironment
  }

  async start() {
    this.buildCSM()
    this.updateSky()
  }

  addSky(node) {
    const handle = {
      node,
      destroy: () => {
        const idx = this.skys.indexOf(handle)
        if (idx === -1) return
        this.skys.splice(idx, 1)
        this.updateSky()
      },
    }
    this.skys.push(handle)
    this.updateSky()
    return handle
  }

  getSky() {
  }

  async updateSky() {
    if (!this.sky) {
      const geometry = new THREE.SphereGeometry(1000, 60, 40)
      const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide })
      this.sky = new THREE.Mesh(geometry, material)
      this.sky.geometry.computeBoundsTree()
      this.sky.material.fog = false
      this.sky.material.toneMapped = false
      this.sky.material.needsUpdate = true
      this.sky.matrixAutoUpdate = false
      this.sky.matrixWorldAutoUpdate = false
      this.sky.visible = false
      this.stage.scene.add(this.sky)
    }

    const base = this.base
    const node = this.skys[this.skys.length - 1]?.node
    const bgUrl = node?._bg || base.bg
    const hdrUrl = node?._hdr || base.hdr
    const rotationY = isNumber(node?._rotationY) ? node._rotationY : base.rotationY
    const sunDirection = node?._sunDirection || base.sunDirection
    const sunIntensity = isNumber(node?._sunIntensity) ? node._sunIntensity : base.sunIntensity
    const sunColor = isString(node?._sunColor) ? node._sunColor : base.sunColor
    const fogNear = isNumber(node?._fogNear) ? node._fogNear : base.fogNear
    const fogFar = isNumber(node?._fogFar) ? node._fogFar : base.fogFar
    const fogColor = isString(node?._fogColor) ? node._fogColor : base.fogColor

    const n = ++this.skyN
    let bgTexture
    if (bgUrl) bgTexture = await this.loader.load('texture', bgUrl)
    let hdrTexture
    if (hdrUrl) hdrTexture = await this.loader.load('hdr', hdrUrl)
    if (n !== this.skyN) return

    if (bgTexture) {
      bgTexture.minFilter = bgTexture.magFilter = THREE.LinearFilter
      bgTexture.mapping = THREE.EquirectangularReflectionMapping
      bgTexture.colorSpace = THREE.SRGBColorSpace
      this.sky.material.map = bgTexture
      this.sky.visible = true
    } else {
      this.sky.visible = false
    }

    if (hdrTexture) {
      hdrTexture.mapping = THREE.EquirectangularReflectionMapping
      this.stage.scene.environment = hdrTexture
    }

    this.stage.scene.environmentRotation.y = rotationY
    this.sky.rotation.y = rotationY
    this.sky.matrixWorld.compose(this.sky.position, this.sky.quaternion, this.sky.scale)

    this.csm.lightDirection = sunDirection

    for (const light of this.csm.lights) {
      light.intensity = sunIntensity
      light.color.set(sunColor)
    }

    if (isNumber(fogNear) && isNumber(fogFar) && fogColor) {
      const color = new THREE.Color(fogColor)
      this.stage.scene.fog = new THREE.Fog(color, fogNear, fogFar)
    } else {
      this.stage.scene.fog = null
    }

    this.skyInfo = {
      bgUrl,
      hdrUrl,
      rotationY,
      sunDirection,
      sunIntensity,
      sunColor,
      fogNear,
      fogFar,
      fogColor,
    }
  }

  update(delta) {
    this.csm.update()
  }

  lateUpdate(delta) {
    this.sky.position.x = this.rig.position.x
    this.sky.position.z = this.rig.position.z
    this.sky.matrixWorld.setPosition(this.sky.position)
  }

  buildCSM() {
    const options = csmLevels[this.prefs.shadows]
    if (this.csm) {
      this.csm.updateCascades(options.cascades)
      this.csm.updateShadowMapSize(options.shadowMapSize)
      this.csm.lightDirection = this.skyInfo.sunDirection
      for (const light of this.csm.lights) {
        light.intensity = this.skyInfo.sunIntensity
        light.color.set(this.skyInfo.sunColor)
        light.castShadow = options.castShadow
      }
    } else {
      const scene = this.stage.scene
      const camera = this.camera
      this.csm = new CSM({
        mode: 'practical', // uniform, logarithmic, practical, custom
        cascades: 3,
        maxCascades: 3,
        shadowMapSize: 2048,
        maxFar: 100,
        lightIntensity: 1,
        lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
        fade: true,
        parent: scene,
        camera: camera,
        ...options,
      })
      if (!options.castShadow) {
        for (const light of this.csm.lights) {
          light.castShadow = false
        }
      }
    }
  }

  onPrefChanged = ({ key, value }) => {
    if (key === 'shadows') {
      this.buildCSM()
      this.updateSky()
    }
  }

  onGraphicsResize = () => {
    this.csm.updateFrustums()
  }
}
