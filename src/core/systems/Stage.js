import * as THREE from '../extras/three.js'

import { System } from './System.js'
import { LooseOctree } from '../extras/LooseOctree.js'
import { MaterialFactory } from './stage/MaterialFactory.js'
import { RaycastManager } from './stage/RaycastManager.js'
import { Model } from './stage/Model.js'

export class Stage extends System {
  static DEPS = {
    rig: 'rig',
    camera: 'camera',
  }

  constructor(world) {
    super(world)
    this.scene = new THREE.Scene()
    this.models = new Map()
    this.octree = new LooseOctree({
      scene: this.scene,
      center: new THREE.Vector3(0, 0, 0),
      size: 10,
    })
    this.defaultMaterial = null
    this.dirtyNodes = new Set()
    this.setupMaterial = world.setupMaterial
    this.materialFactory = new MaterialFactory(world)
    this.raycastManager = new RaycastManager(this)
  }

  init({ viewport }) {
    this.viewport = viewport
    this.scene.add(this.rig)
  }

  update(delta) {
    this.models.forEach(model => model.clean())
  }

  postUpdate() {
    this.clean()
  }

  postLateUpdate() {
    this.clean()
  }

  getDefaultMaterial() {
    if (!this.defaultMaterial) {
      this.defaultMaterial = this.createMaterial()
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
    if (options.linked) {
      return this.insertLinked(options)
    } else {
      return this.insertSingle(options)
    }
  }

  insertLinked({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    const id = `${geometry.uuid}/${material.uuid}/${castShadow}/${receiveShadow}`
    if (!this.models.has(id)) {
      const model = new Model(this, geometry, material, castShadow, receiveShadow)
      this.models.set(id, model)
    }
    return this.models.get(id).create(node, matrix)
  }

  insertSingle({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    material = this.createMaterial({ raw: material })
    const mesh = new THREE.Mesh(geometry, material.raw)
    mesh.castShadow = castShadow
    mesh.receiveShadow = receiveShadow
    mesh.matrixWorld.copy(matrix)
    mesh.matrixAutoUpdate = false
    mesh.matrixWorldAutoUpdate = false
    const sItem = {
      matrix,
      geometry,
      material: material.raw,
      getEntity: () => node.ctx.entity,
      node,
    }
    this.scene.add(mesh)
    this.octree.insert(sItem)
    return {
      material: material.proxy,
      move: matrix => {
        mesh.matrixWorld.copy(matrix)
        this.octree.move(sItem)
      },
      destroy: () => {
        this.scene.remove(mesh)
        this.octree.remove(sItem)
      },
    }
  }

  createMaterial(options = {}) {
    return this.materialFactory.createMaterial(options)
  }

  raycastPointer(position, layers, min, max) {
    return this.raycastManager.raycastPointer(position, layers, min, max)
  }

  raycastReticle(layers, min, max) {
    return this.raycastManager.raycastReticle(layers, min, max)
  }

  destroy() {
    this.models.clear()
  }
}
