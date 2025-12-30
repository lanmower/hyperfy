import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { LooseOctree } from '../extras/LooseOctree.js'
import { createMaterialProxy } from '../systems/stage/MaterialProxy.js'
import { isNumber } from 'lodash-es'
import { MeshInserter } from './stage/MeshInserter.js'
import { ObjectPool } from './stage/ObjectPool.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Stage')
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
    this.meshInserter = new MeshInserter(this)
    this.objectPool = new ObjectPool()
    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.raycastHits = []
    this.maskNone = new THREE.Layers()
    this.maskNone.enableAll()
    this.renderStats = {
      drawCalls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
    }
  }

  init({ viewport }) {
    this.viewport = viewport
    logger.info('Adding rig to scene', {})
    this.scene.add(this.rig)
    logger.info('Scene initialized', { childrenCount: this.scene.children.length })
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

  createMaterial(options = {}) {
    const material = {}
    let raw

    if (options.raw) {
      raw = options.raw.clone()
      raw.onBeforeCompile = options.raw.onBeforeCompile
    } else if (options.unlit) {
      raw = new THREE.MeshBasicMaterial({
        color: options.color || 'white',
      })
    } else {
      raw = new THREE.MeshStandardMaterial({
        color: options.color || 'white',
        metalness: isNumber(options.metalness) ? options.metalness : 0,
        roughness: isNumber(options.roughness) ? options.roughness : 1,
      })
    }

    raw.shadowSide = THREE.BackSide

    const textures = []
    if (raw.map) {
      raw.map = raw.map.clone()
      textures.push(raw.map)
    }
    if (raw.emissiveMap) {
      raw.emissiveMap = raw.emissiveMap.clone()
      textures.push(raw.emissiveMap)
    }
    if (raw.normalMap) {
      raw.normalMap = raw.normalMap.clone()
      textures.push(raw.normalMap)
    }
    if (raw.bumpMap) {
      raw.bumpMap = raw.bumpMap.clone()
      textures.push(raw.bumpMap)
    }
    if (raw.roughnessMap) {
      raw.roughnessMap = raw.roughnessMap.clone()
      textures.push(raw.roughnessMap)
    }
    if (raw.metalnessMap) {
      raw.metalnessMap = raw.metalnessMap.clone()
      textures.push(raw.metalnessMap)
    }

    this.world.setupMaterial(raw)
    const proxy = createMaterialProxy(raw, textures, material, this.world)
    material.raw = raw
    material.proxy = proxy
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

  raycastReticle(layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    raycasterVec2.x = 0
    raycasterVec2.y = 0
    this.raycaster.setFromCamera(raycasterVec2, this.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    if (this.octree?.raycast) {
      this.octree.raycast(this.raycaster, this.raycastHits)
    }
    return this.raycastHits
  }

  destroy() {
    this.meshInserter.clear()
  }
}
