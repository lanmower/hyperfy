import * as THREE from '../../extras/three.js'
import { isNumber, isString } from 'lodash-es'

export class SkyManager {
  constructor(environment) {
    this.environment = environment
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
        this.update()
      },
    }
    this.skys.push(handle)
    this.update()
    return handle
  }

  async update(sunDirection, sunIntensity, sunColor) {
    if (!this.sky) {
      const geometry = new THREE.SphereGeometry(1000, 60, 40)
      const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide })
      this.sky = new THREE.Mesh(geometry, material)
      if (this.sky.geometry.computeBoundsTree) {
        this.sky.geometry.computeBoundsTree()
      }
      this.sky.material.fog = false
      this.sky.material.toneMapped = false
      this.sky.material.needsUpdate = true
      this.sky.matrixAutoUpdate = false
      this.sky.matrixWorldAutoUpdate = false
      this.sky.visible = false
      this.environment.stage.scene.add(this.sky)
    }
    const base = this.environment.base
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
    if (bgUrl) bgTexture = await this.environment.loader.load('texture', bgUrl)
    let hdrTexture
    if (hdrUrl) hdrTexture = await this.environment.loader.load('hdr', hdrUrl)
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
      this.environment.stage.scene.environment = hdrTexture
    }
    this.environment.stage.scene.environmentRotation.y = rotationY
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
      this.environment.stage.scene.fog = new THREE.Fog(color, fogNear, fogFar)
    } else {
      this.environment.stage.scene.fog = null
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
