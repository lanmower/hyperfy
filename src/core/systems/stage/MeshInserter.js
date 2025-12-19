import * as THREE from '../../extras/three.js'
import { InstancedMeshManager } from './InstancedMeshManager.js'

export class MeshInserter {
  constructor(stage) {
    this.stage = stage
    this.models = new Map()
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
      const modelMaterial = this.stage.materialFactory.create({ raw: material })
      const manager = new InstancedMeshManager(this.stage, geometry, modelMaterial, castShadow, receiveShadow)
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
    material = this.stage.materialFactory.create({ raw: material })
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
    this.stage.scene.add(mesh)
    this.stage.octree.insert(sItem)
    return {
      material: material.proxy,
      move: matrix => {
        mesh.matrixWorld.copy(matrix)
        this.stage.octree.move(sItem)
      },
      destroy: () => {
        this.stage.scene.remove(mesh)
        this.stage.octree.remove(sItem)
      },
    }
  }

  clean() {
    this.models.forEach(model => model.clean())
  }

  clear() {
    this.models.clear()
  }
}
