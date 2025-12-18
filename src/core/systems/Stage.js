import * as THREE from '../extras/three.js'
import { isNumber } from 'lodash-es'

import { System } from './System.js'
import { LooseOctree } from '../extras/LooseOctree.js'
import { Model } from './stage/Model.js'

const raycasterVec2 = new THREE.Vector2()

function createMaterialProxy(raw, textures, material, world) {
  return {
    get id() {
      return raw.uuid
    },
    get textureX() {
      return textures[0]?.offset.x
    },
    set textureX(val) {
      for (const tex of textures) {
        tex.offset.x = val
      }
      raw.needsUpdate = true
    },
    get textureY() {
      return textures[0]?.offset.y
    },
    set textureY(val) {
      for (const tex of textures) {
        tex.offset.y = val
      }
      raw.needsUpdate = true
    },
    get color() {
      return raw.color
    },
    set color(val) {
      if (typeof val !== 'string') {
        throw new Error('[material] color must be a string (e.g. "red", "#ff0000", "rgb(255,0,0)")')
      }
      raw.color.set(val)
      raw.needsUpdate = true
    },
    get emissiveIntensity() {
      return raw.emissiveIntensity
    },
    set emissiveIntensity(value) {
      if (!isNumber(value)) {
        throw new Error('[material] emissiveIntensity not a number')
      }
      raw.emissiveIntensity = value
      raw.needsUpdate = true
    },
    get fog() {
      return raw.fog
    },
    set fog(value) {
      raw.fog = value
      raw.needsUpdate = true
    },
    get _ref() {
      if (world._allowMaterial) return material
    },
  }
}

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
    this.world = world
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
    this.models.clear()
  }
}
