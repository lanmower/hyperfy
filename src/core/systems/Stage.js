import * as THREE from '../extras/three.js'

import { System } from './System.js'
import { LooseOctree } from '../extras/LooseOctree.js'
import { MaterialFactory } from './stage/MaterialFactory.js'
import { RaycastManager } from './stage/RaycastManager.js'
import { MeshInserter } from './stage/MeshInserter.js'

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
    this.raycastManager = new RaycastManager(this)
    this.meshInserter = new MeshInserter(this)
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

  raycastPointer(position, layers, min, max) {
    return this.raycastManager.raycastPointer(position, layers, min, max)
  }

  raycastReticle(layers, min, max) {
    return this.raycastManager.raycastReticle(layers, min, max)
  }

  destroy() {
    this.meshInserter.clear()
  }
}
