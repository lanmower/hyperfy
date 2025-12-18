import * as THREE from '../../extras/three.js'
import { isNumber, isString } from 'lodash-es'

export class SkyManager {
  constructor(stage, loader, base) {
    this.stage = stage
    this.loader = loader
    this.base = base
    this.skys = []
    this.sky = null
    this.skyN = 0
    this.skyInfo = null
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

  updatePosition(rigPosition) {
    if (this.sky) {
      this.sky.position.x = rigPosition.x
      this.sky.position.z = rigPosition.z
      this.sky.matrixWorld.setPosition(this.sky.position)
    }
  }
}
