import * as pc from '../../extras/playcanvas.js'

export class SkyManager {
  constructor(app) {
    this.app = app
    this.skyboxEntity = null
    this.environmentTexture = null
    this.sunLight = null
  }

  async initWithHDR(hdrImagePath) {
    if (!hdrImagePath) {
      hdrImagePath = '/day2.hdr'
    }

    try {
      const asset = new pc.Asset('hdr', 'texture', { url: hdrImagePath })
      this.app.assets.add(asset)

      console.log('Loading HDR as texture from path', { path: hdrImagePath })

      const texture = await new Promise((resolve, reject) => {
        const loadHandler = () => {
          asset.off('load', loadHandler)
          asset.off('error', errorHandler)
          const tex = asset.resource
          console.log('HDR texture loaded', { hasResource: !!tex, resourceType: tex?.type })
          if (tex) {
            resolve(tex)
          } else {
            reject(new Error('HDR asset loaded but resource is null'))
          }
        }
        const errorHandler = (err) => {
          asset.off('load', loadHandler)
          asset.off('error', errorHandler)
          reject(err)
        }
        asset.on('load', loadHandler)
        asset.on('error', errorHandler)
        this.app.assets.load(asset)
      })

      this.app.scene.skyboxIntensity = 1.0
      this.app.scene.envAtlas = texture
      this.app.scene.gammaCorrection = pc.GAMMA_SRGB
      this.app.scene.toneMapping = pc.TONEMAP_FILMIC

      this.environmentTexture = texture
      console.log('HDR applied to scene', { envAtlasSet: !!this.app.scene.envAtlas })
      return texture
    } catch (err) {
      console.error('Failed to load HDR:', err.message)
      this.setFallbackSkyColor()
    }
  }

  setFallbackSkyColor() {
    const cameraEntity = this.app.scene.activeCamera?.entity
    if (cameraEntity?.camera) {
      cameraEntity.camera.clearColor = new pc.Color(0.5, 0.7, 0.9, 1)
    }
    this.app.scene.skyboxIntensity = 0
  }

  setIntensity(intensity) {
    this.app.scene.skyboxIntensity = Math.max(0, Math.min(1, intensity))
  }

  async setBackgroundImage(imagePath) {
    try {
      const texture = await new Promise((resolve, reject) => {
        const asset = new pc.Asset('bg', 'texture', { url: imagePath })
        asset.on('load', () => resolve(asset.resource))
        asset.on('error', reject)
        this.app.assets.add(asset)
        this.app.assets.load(asset)
      })

      this.app.scene.envAtlas = texture
      this.environmentTexture = texture
    } catch (err) {
      console.error('Failed to load background image:', err)
    }
  }

  setFog(near, far, color = [1, 1, 1]) {
    this.app.scene.fogStart = near
    this.app.scene.fogEnd = far
    this.app.scene.fogColor = new pc.Color(color[0], color[1], color[2])
    this.app.scene.fog = pc.FOG_LINEAR
  }

  disableFog() {
    this.app.scene.fog = pc.FOG_NONE
  }

  setSun(direction, intensity = 1.0, color = [1, 1, 1]) {
    let sunLight = null
    for (const entity of this.app.root.children) {
      if (entity.name === 'sun') {
        sunLight = entity
        break
      }
    }

    if (!sunLight) {
      sunLight = new pc.Entity('sun')
      sunLight.addComponent('light', {
        type: 'directional',
        castShadows: true,
        shadowResolution: 2048,
        shadowDistance: 500,
        numCascades: 3
      })
      this.app.root.addChild(sunLight)
    }

    const dir = new pc.Vec3(direction[0], direction[1], direction[2]).normalize()
    const angle = Math.atan2(dir.x, dir.z)
    const elevation = Math.acos(dir.y)

    sunLight.setLocalEulerAngles(
      Math.PI / 2 - elevation,
      angle,
      0
    )

    const light = sunLight.light
    light.intensity = intensity
    light.color = new pc.Color(color[0], color[1], color[2])

    this.sunLight = sunLight
    return sunLight
  }

  setRotation(y = 0) {
    if (this.skyboxEntity) {
      this.skyboxEntity.setLocalEulerAngles(0, y, 0)
    }
  }
}
