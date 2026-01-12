import * as THREE from '../../extras/three.js'

const raycasterVec2 = new THREE.Vector2()

export class StageRaycaster {
  constructor(octree, viewport, camera) {
    this.octree = octree
    this.viewport = viewport
    this.camera = camera
    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.raycastHits = []
    this.maskNone = new THREE.Layers()
    this.maskNone.enableAll()
  }

  raycastPointer(position, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport || typeof this.viewport.getBoundingClientRect !== 'function') throw new Error('no viewport')
    const rect = this.viewport.getBoundingClientRect()
    raycasterVec2.x = ((position.x - rect.left) / rect.width) * 2 - 1
    raycasterVec2.y = -((position.y - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(raycasterVec2, this.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }

  raycastReticle(camera, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    raycasterVec2.x = 0
    raycasterVec2.y = 0
    this.raycaster.setFromCamera(raycasterVec2, camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }
}
