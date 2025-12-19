import * as THREE from '../../extras/three.js'
import { InstancedMeshManager } from './InstancedMeshManager.js'

export class StageMeshInserter {
  constructor(world, scene, octree, materialFactory, models) {
    this.world = world
    this.scene = scene
    this.octree = octree
    this.materialFactory = materialFactory
    this.models = models
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
      const modelMaterial = this.materialFactory.create({ raw: material })
      const manager = new InstancedMeshManager(this, geometry, modelMaterial, castShadow, receiveShadow)
      this.models.set(id, {
        geometry,
        material: modelMaterial,
        iMesh: manager.iMesh,
        items: manager.items,
        create: (node, matrix) => manager.create(node, matrix),
        clean: () => manager.clean(),
      })
    }
    return this.models.get(id).create(node, matrix)
  }

  insertSingle({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    material = this.materialFactory.create({ raw: material })
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
}
