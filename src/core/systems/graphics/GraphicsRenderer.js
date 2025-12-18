import * as THREE from '../../extras/three.js'

let renderer

export function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
    })
  }
  return renderer
}

export class GraphicsRenderer {
  constructor({ viewport, prefs }) {
    this.viewport = viewport
    this.prefs = prefs
    this.renderer = getRenderer()
    this.width = viewport.offsetWidth
    this.height = viewport.offsetHeight
    this.aspect = this.width / this.height
    this.resizer = null
  }

  init() {
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0xffffff, 0)
    this.renderer.setPixelRatio(this.prefs.state.get('dpr'))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()
    THREE.Texture.DEFAULT_ANISOTROPY = this.maxAnisotropy
    this.viewport.appendChild(this.renderer.domElement)
  }

  setDPR(value) {
    this.renderer.setPixelRatio(value)
  }

  resize(width, height, camera) {
    this.width = width
    this.height = height
    this.aspect = this.width / this.height
    camera.aspect = this.aspect
    camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render(scene, camera) {
    this.renderer.render(scene, camera)
  }

  setupResizeObserver(callback) {
    this.resizer = new ResizeObserver(() => {
      callback(this.viewport.offsetWidth, this.viewport.offsetHeight)
    })
    this.resizer.observe(this.viewport)
  }

  destroy() {
    if (this.resizer) {
      this.resizer.disconnect()
    }
    this.viewport.removeChild(this.renderer.domElement)
  }
}
