import { collisionLayers as layers } from '../utils/NodeConstants.js'
import * as THREE from '../extras/three.js'
import { isString } from 'lodash-es'

import { DEG2RAD } from '../extras/general.js'

import { Node } from './Node.js'
import { Layers } from '../extras/Layers.js'
import { defineProps, validators, createPropertyProxy } from '../utils/defineProperty.js'
import { schema } from '../utils/createNodeSchema.js'

const defaults = {
  radius: 0.4,
  height: 1,
  visible: false,
  layer: 'environment',
  tag: null,
  onContactStart: null,
  onContactEnd: null,
}

const rebuild = function() { this.needsRebuild = true; this.setDirty() }
const propertySchema = schema('radius', 'height', 'visible', 'layer', 'tag', 'onContactStart', 'onContactEnd')
  .overrideAll({
    radius: { default: defaults.radius, onSet: rebuild },
    height: { default: defaults.height, onSet: rebuild },
    visible: { default: defaults.visible, onSet: rebuild },
    layer: { default: defaults.layer, onSet: rebuild },
    tag: { default: defaults.tag },
    onContactStart: { default: defaults.onContactStart },
    onContactEnd: { default: defaults.onContactEnd },
  })
  .build()

export class Controller extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'controller'
    defineProps(this, propertySchema, defaults, data)
  }

  mount() {
    this.needsRebuild = false
    if (this._visible) {
      const geometry = new THREE.CapsuleGeometry(this._radius, this._height, 2, 8)
      geometry.translate(0, this._height / 2 + this._radius, 0)
      geometry.computeBoundsTree()
      const material = new THREE.MeshStandardMaterial({ color: 'green' })
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.receiveShadow = true
      this.mesh.castShadow = true
      this.mesh.matrixAutoUpdate = false
      this.mesh.matrixWorldAutoUpdate = false
      this.mesh.matrix.copy(this.matrix)
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.mesh.node = this
      this.ctx.world.graphics.scene.add(this.mesh)
    }
    const desc = new PHYSX.PxCapsuleControllerDesc()
    desc.height = this._height
    desc.radius = this._radius
    desc.climbingMode = PHYSX.PxCapsuleClimbingModeEnum.eCONSTRAINED
    desc.slopeLimit = Math.cos(60 * DEG2RAD) // 60 degrees
    desc.material = this.ctx.world.physics.defaultMaterial
    desc.contactOffset = 0.1 // PhysX default = 0.1
    desc.stepOffset = 0.5 // PhysX default = 0.5m
    this.controller = this.ctx.world.physics.controllerManager.createController(desc) // prettier-ignore
    PHYSX.destroy(desc)
    const worldPosition = this.getWorldPosition()
    this.controller.setFootPosition(worldPosition.toPxExtVec3())

    const actor = this.controller.getActor()
    const nbShapes = actor.getNbShapes()
    const shapeBuffer = new PHYSX.PxArray_PxShapePtr(nbShapes)
    const shapesCount = actor.getShapes(shapeBuffer.begin(), nbShapes, 0)
    for (let i = 0; i < shapesCount; i++) {
      const shape = shapeBuffer.get(i)
      const layer = Layers[this._layer]
      let pairFlags =
        PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND |
        PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST |
        PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
      const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
      const shapeFlags = new PHYSX.PxShapeFlags()
      shapeFlags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
      shape.setFlags(shapeFlags)
      shape.setQueryFilterData(filterData)
      shape.setSimulationFilterData(filterData)
    }
    const self = this
    this.actorHandle = this.ctx.world.physics.addActor(actor, {
      controller: true,
      node: self,
      get tag() {
        return self._tag
      },
      playerId: null,
      get onContactStart() {
        return self._onContactStart
      },
      get onContactEnd() {
        return self._onContactEnd
      },
      onTriggerEnter: null,
      onTriggerLeave: null,
    })
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      this.mesh?.matrix.copy(this.matrix)
      this.mesh?.matrixWorld.copy(this.matrixWorld)
    }
  }

  unmount() {
    if (this.mesh) {
      this.ctx.world.graphics.scene.remove(this.mesh)
    }
    this.actorHandle?.destroy()
    this.actorHandle = null
    this.controller?.release()
    this.controller = null
  }

  get isGrounded() {
    return this.moveFlags.isSet(PHYSX.PxControllerCollisionFlagEnum.eCOLLISION_DOWN)
  }

  get isCeiling() {
    return this.moveFlags.isSet(PHYSX.PxControllerCollisionFlagEnum.eCOLLISION_UP)
  }

  teleport(vec3) {
    if (!vec3?.isVector3) {
      throw new Error('[controller] teleport expected Vector3')
    }
    this.position.copy(vec3)
    this.controller.setFootPosition(vec3.toPxExtVec3())
  }

  move(vec3) {
    if (!vec3?.isVector3) {
      throw new Error('[controller] move expected Vector3')
    }
    if (!this.controller) return
    this.moveFlags = this.controller.move(vec3.toPxVec3(), 0, 1 / 60, this.ctx.world.physics.controllerFilters)
    const pos = this.controller.getFootPosition()
    this.position.copy(pos)
    this.didMove = true
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {
          teleport: this.teleport,
          move: this.move,
        },
        {
          layer: { get: function() { return this.layer }, set: function(v) { if (v === 'player') throw new Error('[controller] layer invalid: player'); this.layer = v } },
          isGrounded: function() { return this.isGrounded },
          isCeiling: function() { return this.isCeiling },
        }
      )
    }
    return this.proxy
  }
}

function isLayer(value) {
  return layers.includes(value)
}
