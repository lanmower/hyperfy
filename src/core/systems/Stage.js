import * as pc from '../extras/playcanvas.js'
import { System } from './System.js'
import { LooseOctree } from '../extras/LooseOctree.js'
import { MeshInserter } from './stage/MeshInserter.js'
import { isNumber } from '../utils/helpers/typeChecks.js'

export class Stage extends System {
  static DEPS = {
    camera: 'camera',
  }

  constructor(world) {
    super(world)
    this.scene = null
    this.octree = new LooseOctree({
      center: new pc.Vec3(0, 0, 0),
      radius: 200,
    })
    this.defaultMaterial = null
    this.dirtyNodes = new Set()
    this.world = world
    this.viewport = null
    this.raycastHits = []
    this.materialCache = new Map()
    this.meshInserter = new MeshInserter(this)
    this.pcEntities = new Map()
  }

  init({ viewport }) {
    this.viewport = viewport
    this.scene = this.world.graphics.app.root
  }

  update(delta) {
    this.meshInserter.clean?.()
  }

  postUpdate() {
    this.clean()
  }

  postLateUpdate() {
    this.clean()
  }

  createMaterial(options = {}) {
    const material = {}
    let pcMat

    if (options.unlit) {
      pcMat = new pc.Material()
      pcMat.emissive.set(options.color || new pc.Color(1, 1, 1))
    } else {
      pcMat = new pc.StandardMaterial()
      pcMat.diffuse.set(options.color || new pc.Color(1, 1, 1))
      pcMat.metalness = isNumber(options.metalness) ? options.metalness : 0
      pcMat.roughness = isNumber(options.roughness) ? options.roughness : 1
    }

    if (options.raw && options.raw.clone) {
      pcMat = options.raw.clone()
    }

    this.world.setupMaterial?.(pcMat)
    material.raw = pcMat
    material.pc = pcMat
    return material
  }

  getDefaultMaterial() {
    if (!this.defaultMaterial) {
      this.defaultMaterial = this.createMaterial()
    }
    return this.defaultMaterial
  }

  clean() {
    for (const node of this.dirtyNodes) {
      if (node.clean && typeof node.clean === 'function') {
        node.clean()
      }
    }
    this.dirtyNodes.clear()
  }

  insert(options) {
    return this.insertLinked(options)
  }

  insertLinked(options) {
    const material = options.material || this.getDefaultMaterial()
    const materialWithProxy = {
      pc: material.pc || material.raw || material,
      proxy: {
        setColor: (color) => {
          if (typeof color === 'string') {
            const c = parseInt(color.replace('#', ''), 16)
            material.pc?.diffuse?.set(
              ((c >> 16) & 255) / 255,
              ((c >> 8) & 255) / 255,
              (c & 255) / 255
            )
          }
        },
        setEmissive: (color) => {
          if (typeof color === 'string') {
            const c = parseInt(color.replace('#', ''), 16)
            material.pc?.emissive?.set(
              ((c >> 16) & 255) / 255,
              ((c >> 8) & 255) / 255,
              (c & 255) / 255
            )
          }
        },
        setEmissiveIntensity: (value) => {
          if (material.pc && material.pc.emissiveIntensity !== undefined) {
            material.pc.emissiveIntensity = value
          }
        },
      }
    }
    const handle = this.meshInserter.insertSingle({
      geometry: options.geometry,
      material: materialWithProxy,
      castShadow: options.castShadow,
      receiveShadow: options.receiveShadow,
      node: options.node,
      matrix: options.matrix,
    })
    if (handle && options.node) {
      this.pcEntities.set(options.node, handle)
    }
    return handle
  }

  insertSingle(options) {
    return this.insertLinked(options)
  }

  raycastPointer(position, min = 0, max = Infinity) {
    if (!this.viewport || typeof this.viewport.getBoundingClientRect !== 'function') {
      throw new Error('no viewport')
    }

    const rect = this.viewport.getBoundingClientRect()
    const x = ((position.x - rect.left) / rect.width) * 2 - 1
    const y = -((position.y - rect.top) / rect.height) * 2 + 1

    const camComp = this.camera.camera
    if (!camComp) return this.raycastHits

    const ray = camComp.screenToWorld(
      (position.x - rect.left),
      (position.y - rect.top),
      max
    )

    this.raycastHits.length = 0
    this._raycastEntities(ray, this.scene, this.raycastHits, min, max)
    return this.raycastHits
  }

  raycastReticle(min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')

    const rect = this.viewport.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const camComp = this.camera.camera
    if (!camComp) return this.raycastHits

    const ray = camComp.screenToWorld(centerX, centerY, max)

    this.raycastHits.length = 0
    this._raycastEntities(ray, this.scene, this.raycastHits, min, max)
    return this.raycastHits
  }

  _raycastEntities(ray, entity, results, min, max) {
    if (!entity) return

    if (entity.model && entity.model.meshInstances && entity.model.meshInstances.length > 0) {
      const mi = entity.model.meshInstances[0]
      if (mi.aabb) {
        const intersection = ray.intersectAABB(mi.aabb)
        if (intersection) {
          const dist = pc.Vec3.distance(ray.origin, entity.getWorldPosition())
          if (dist >= min && dist <= max) {
            results.push({
              object: entity,
              distance: dist,
              point: ray.origin.clone().add(ray.direction.clone().scale(dist))
            })
          }
        }
      }
    }

    if (entity.children) {
      for (let i = 0; i < entity.children.length; i++) {
        this._raycastEntities(ray, entity.children[i], results, min, max)
      }
    }
  }

  destroy() {
    this.materialCache.clear()
    this.raycastHits.length = 0
  }
}
