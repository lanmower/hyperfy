import * as THREE from '../extras/three.js'
import { isNumber, isString } from 'lodash-es'
import { CSM } from '../libs/csm/CSM.js'

import { System } from './System.js'
import { csmLevels } from './environment/csmConfig.js'
import { patchFogShader } from './environment/shaderPatches.js'

patchFogShader()

export class ClientEnvironment extends System {
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
    this.csm = null
    this.csmLevels = csmLevels
    this.skys = []
    this.sky = null
    this.skyN = 0
    this.skyInfo = null
  }

  init({ baseEnvironment }) {
    this.base = baseEnvironment
  }

  async start() {
    this.buildCSM(this.prefs.shadows)
    this.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
  }

  buildCSM(shadowLevel) {
    const options = this.csmLevels[shadowLevel] || this.csmLevels.med
    if (this.csm) {
      this.csm.updateCascades(options.cascades)
      this.csm.updateShadowMapSize(options.shadowMapSize)
      return
    }
    this.csm = new CSM({
      mode: 'practical',
      cascades: 3,
      maxCascades: 3,
      shadowMapSize: 2048,
      maxFar: 100,
      lightIntensity: 1,
      lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
      fade: true,
      parent: this.stage.scene,
      camera: this.camera,
      ...options,
    })
    if (!options.castShadow) {
      for (const light of this.csm.lights) {
        light.castShadow = false
      }
    }
  }

  updateCSM(shadowLevel, sunDirection, sunIntensity, sunColor) {
    if (!this.csm) return
    const options = this.csmLevels[shadowLevel] || this.csmLevels.med
    this.csm.lightDirection = sunDirection
    this.csm.updateCascades(options.cascades)
    this.csm.updateShadowMapSize(options.shadowMapSize)
    for (const light of this.csm.lights) {
      light.intensity = sunIntensity
      light.color.set(sunColor)
      light.castShadow = options.castShadow
    }
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

  async updateSky(sunDirection, sunIntensity, sunColor) {
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
    const finalSunDirection = node?._sunDirection || sunDirection
    const finalSunIntensity = isNumber(node?._sunIntensity) ? node._sunIntensity : sunIntensity
    const finalSunColor = isString(node?._sunColor) ? node._sunColor : sunColor
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
    if (finalSunDirection && finalSunIntensity !== undefined && finalSunColor) {
      this.skyInfo = {
        bgUrl,
        hdrUrl,
        rotationY,
        sunDirection: finalSunDirection,
        sunIntensity: finalSunIntensity,
        sunColor: finalSunColor,
        fogNear,
        fogFar,
        fogColor,
      }
    }
    if (isNumber(fogNear) && isNumber(fogFar) && fogColor) {
      const color = new THREE.Color(fogColor)
      this.stage.scene.fog = new THREE.Fog(color, fogNear, fogFar)
    } else {
      this.stage.scene.fog = null
    }
  }

  updateSkyPosition(rigPosition) {
    if (this.sky) {
      this.sky.position.x = rigPosition.x
      this.sky.position.z = rigPosition.z
      this.sky.matrixWorld.setPosition(this.sky.position)
    }
  }

  update(delta) {
    if (this.csm) {
      this.csm.update()
    }
  }

  lateUpdate(delta) {
    this.updateSkyPosition(this.rig.position)
  }

  onPrefChanged = ({ key, value }) => {
    if (key === 'shadows') {
      this.buildCSM(value)
      if (this.skyInfo) {
        this.updateCSM(value, this.skyInfo.sunDirection, this.skyInfo.sunIntensity, this.skyInfo.sunColor)
      }
      this.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
    }
  }

  onGraphicsResize = () => {
    if (this.csm) {
      this.csm.updateFrustums()
    }
  }
}
