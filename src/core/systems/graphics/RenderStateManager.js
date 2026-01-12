import * as THREE from '../../extras/three.js'

export class RenderStateManager {
  constructor() {
    this.width = 0
    this.height = 0
    this.aspect = 1
    this.worldToScreenFactor = 0
    this.xrWidth = null
    this.xrHeight = null
    this.xrSession = null
    this.xrDimensionsNeeded = false
  }

  initialize(renderer, viewport, dpr) {
    renderer.setClearColor(0xffffff, 0)
    renderer.setPixelRatio(dpr)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.NoToneMapping
    renderer.toneMappingExposure = 1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
    THREE.Texture.DEFAULT_ANISOTROPY = maxAnisotropy
    this.width = viewport.offsetWidth || window.innerWidth
    this.height = viewport.offsetHeight || window.innerHeight
    this.aspect = this.width / this.height || 1
    return maxAnisotropy
  }

  initializeXR(renderer) {
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpaceType('local-floor')
    renderer.xr.setFoveation(1)
  }

  updateSize(width, height) {
    this.width = width
    this.height = height
    this.aspect = this.width / this.height
  }

  updateWorldToScreenFactor(camera) {
    const fovRadians = camera.fov * (Math.PI / 180)
    const rendererHeight = this.xrHeight || this.height
    this.worldToScreenFactor = (Math.tan(fovRadians / 2) * 2) / rendererHeight
  }

  handleXRSession(session) {
    if (session) {
      this.xrSession = session
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = true
    } else {
      this.xrSession = null
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = false
    }
  }
}
