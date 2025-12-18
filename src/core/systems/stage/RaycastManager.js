import * as THREE from '../../extras/three.js'

const vec2 = new THREE.Vector2()

export class RaycastManager {
  constructor(stage) {
    this.stage = stage
    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.raycastHits = []
    this.maskNone = new THREE.Layers()
    this.maskNone.enableAll()
  }

  raycastPointer(position, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.stage.viewport) throw new Error('no viewport')
    const rect = this.stage.viewport.getBoundingClientRect()
    vec2.x = ((position.x - rect.left) / rect.width) * 2 - 1
    vec2.y = -((position.y - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(vec2, this.stage.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.stage.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }

  raycastReticle(layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.stage.viewport) throw new Error('no viewport')
    vec2.x = 0
    vec2.y = 0
    this.raycaster.setFromCamera(vec2, this.stage.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.stage.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }
}
