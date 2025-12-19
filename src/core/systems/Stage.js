import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { LooseOctree } from '../extras/LooseOctree.js'
import { MaterialFactory } from './stage/MaterialFactory.js'
import { MeshInserter } from './stage/MeshInserter.js'

const raycasterVec2 = new THREE.Vector2()

export class Stage extends System {
  static DEPS = {
    rig: 'rig',
    camera: 'camera',
  }

  constructor(world) {
    super(world)
    this.scene = new THREE.Scene()
    this.octree = new LooseOctree({
      scene: this.scene,
      center: new THREE.Vector3(0, 0, 0),
      size: 10,
    })
    this.defaultMaterial = null
    this.dirtyNodes = new Set()
    this.world = world
    this.materialFactory = new MaterialFactory(world)
    this.meshInserter = new MeshInserter(this)
    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.raycastHits = []
    this.maskNone = new THREE.Layers()
    this.maskNone.enableAll()
  }

  init({ viewport }) {
    this.viewport = viewport
    this.scene.add(this.rig)
  }

  update(delta) {
    this.meshInserter.clean()
  }

  postUpdate() {
    this.clean()
  }

  postLateUpdate() {
    this.clean()
  }

  getDefaultMaterial() {
    if (!this.defaultMaterial) {
      this.defaultMaterial = this.materialFactory.create()
    }
    return this.defaultMaterial
  }

  clean() {
    for (const node of this.dirtyNodes) {
      node.clean()
    }
    this.dirtyNodes.clear()
  }

  insert(options) {
    return this.meshInserter.insert(options)
  }

  insertLinked(options) {
    return this.meshInserter.insertLinked(options)
  }

  insertSingle(options) {
    return this.meshInserter.insertSingle(options)
  }

  createMaterial(options = {}) {
    return this.materialFactory.create(options)
  }

  raycastPointer(position, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
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

  raycastReticle(layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    raycasterVec2.x = 0
    raycasterVec2.y = 0
    this.raycaster.setFromCamera(raycasterVec2, this.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }

  destroy() {
    this.meshInserter.clear()
  }
}
