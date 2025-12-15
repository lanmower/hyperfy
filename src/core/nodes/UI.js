import * as THREE from '../extras/three.js'
import { every, isArray, isBoolean, isNumber, isString } from 'lodash-es'
import Yoga from 'yoga-layout'

import { Node } from './Node.js'
import { fillRoundRect } from '../extras/roundRect.js'
import {
  AlignContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
  isAlignContent,
  isAlignItem,
  isFlexDirection,
  isFlexWrap,
  isJustifyContent,
  JustifyContent,
} from '../extras/yoga.js'
import CustomShaderMaterial from '../libs/three-custom-shader-material/index.js'
import { borderRoundRect } from '../extras/borderRoundRect.js'
import { clamp } from '../utils.js'
import { defineProps } from '../utils/defineProperty.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const v5 = new THREE.Vector3()
const v6 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')
const m1 = new THREE.Matrix4()

const FORWARD = new THREE.Vector3(0, 0, 1)

const iQuaternion = new THREE.Quaternion(0, 0, 0, 1)
const iScale = new THREE.Vector3(1, 1, 1)

const isBrowser = typeof window !== 'undefined'

const spaces = ['world', 'screen']
const billboards = ['none', 'full', 'y']
const pivots = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

const defaults = {
  space: 'world',
  width: 100,
  height: 100,
  size: 0.01,
  res: 2,

  lit: false,
  doubleside: true,
  billboard: 'none',
  pivot: 'center',
  offset: [0, 0, 0],
  scaler: null,
  pointerEvents: true,

  transparent: true,
  backgroundColor: null,
  borderWidth: 0,
  borderColor: null,
  borderRadius: 0,
  padding: 0,
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'flex-start',
  flexWrap: 'no-wrap',
  gap: 0,
}

const propertySchema = {
  space: {
    default: defaults.space,
    validate: v => !isSpace(v) ? '[ui] space not valid' : null,
    onSet() {
      this.rebuild()
    },
  },
  width: {
    default: defaults.width,
    validate: v => !isNumber(v) ? '[ui] width not a number' : null,
    onSet() {
      this.yogaNode?.setWidth(this._width * this._res)
      this.rebuild()
    },
  },
  height: {
    default: defaults.height,
    validate: v => !isNumber(v) ? '[ui] height not a number' : null,
    onSet() {
      this.yogaNode?.setHeight(this._height * this._res)
      this.rebuild()
    },
  },
  size: {
    default: defaults.size,
    validate: v => !isNumber(v) ? '[ui] size not a number' : null,
    onSet() {
      this.rebuild()
    },
  },
  res: {
    default: defaults.res,
    validate: v => !isNumber(v) ? '[ui] res not a number' : null,
    onSet() {
      this.rebuild()
    },
  },
  lit: {
    default: defaults.lit,
    validate: v => !isBoolean(v) ? '[ui] lit not a boolean' : null,
    onSet() {
      this.rebuild()
    },
  },
  doubleside: {
    default: defaults.doubleside,
    validate: v => !isBoolean(v) ? '[ui] doubleside not a boolean' : null,
    onSet() {
      this.rebuild()
    },
  },
  billboard: {
    default: defaults.billboard,
    validate: v => !isBillboard(v) ? `[ui] billboard invalid: ${v}` : null,
    onSet() {
      this.rebuild()
    },
  },
  pivot: {
    default: defaults.pivot,
    validate: v => !isPivot(v) ? `[ui] pivot invalid: ${v}` : null,
    onSet() {
      this.rebuild()
    },
  },
  scaler: {
    default: defaults.scaler,
    validate: v => v !== null && !isScaler(v) ? '[ui] scaler invalid' : null,
    onSet() {
      this.rebuild()
    },
  },
  pointerEvents: {
    default: defaults.pointerEvents,
    validate: v => !isBoolean(v) ? '[ui] pointerEvents not a boolean' : null,
    onSet() {
      this.redraw()
    },
  },
  transparent: {
    default: defaults.transparent,
    validate: v => !isBoolean(v) ? '[ui] transparent not a boolean' : null,
    onSet() {
      this.redraw()
    },
  },
  backgroundColor: {
    default: defaults.backgroundColor,
    validate: v => v !== null && !isString(v) ? '[ui] backgroundColor not a string' : null,
    onSet() {
      this.redraw()
    },
  },
  borderWidth: {
    default: defaults.borderWidth,
    validate: v => !isNumber(v) ? '[ui] borderWidth not a number' : null,
    onSet() {
      this.redraw()
    },
  },
  borderColor: {
    default: defaults.borderColor,
    validate: v => v !== null && !isString(v) ? '[ui] borderColor not a string' : null,
    onSet() {
      this.redraw()
    },
  },
  borderRadius: {
    default: defaults.borderRadius,
    validate: v => !isNumber(v) ? '[ui] borderRadius not a number' : null,
    onSet() {
      this.redraw()
    },
  },
  padding: {
    default: defaults.padding,
    validate: v => !isEdge(v) ? '[ui] padding not a number or array of numbers' : null,
    onSet() {
      if (isArray(this._padding)) {
        const [top, right, bottom, left] = this._padding
        this.yogaNode?.setPadding(Yoga.EDGE_TOP, top * this._res)
        this.yogaNode?.setPadding(Yoga.EDGE_RIGHT, right * this._res)
        this.yogaNode?.setPadding(Yoga.EDGE_BOTTOM, bottom * this._res)
        this.yogaNode?.setPadding(Yoga.EDGE_LEFT, left * this._res)
      } else {
        this.yogaNode?.setPadding(Yoga.EDGE_ALL, this._padding * this._res)
      }
      this.redraw()
    },
  },
  flexDirection: {
    default: defaults.flexDirection,
    validate: v => !isFlexDirection(v) ? `[ui] flexDirection invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setFlexDirection(FlexDirection[this._flexDirection])
      this.redraw()
    },
  },
  justifyContent: {
    default: defaults.justifyContent,
    validate: v => !isJustifyContent(v) ? `[ui] justifyContent invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setJustifyContent(JustifyContent[this._justifyContent])
      this.redraw()
    },
  },
  alignItems: {
    default: defaults.alignItems,
    validate: v => !isAlignItem(v) ? `[ui] alignItems invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setAlignItems(AlignItems[this._alignItems])
      this.redraw()
    },
  },
  alignContent: {
    default: defaults.alignContent,
    validate: v => !isAlignContent(v) ? `[ui] alignContent invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setAlignContent(AlignContent[this._alignContent])
      this.redraw()
    },
  },
  flexWrap: {
    default: defaults.flexWrap,
    validate: v => !isFlexWrap(v) ? `[uiview] flexWrap invalid: ${v}` : null,
    onSet() {
      this.yogaNode?.setFlexWrap(FlexWrap[this._flexWrap])
      this.redraw()
    },
  },
  gap: {
    default: defaults.gap,
    validate: v => !isNumber(v) ? '[uiview] gap not a number' : null,
    onSet() {
      this.yogaNode?.setGap(Yoga.GUTTER_ALL, this._gap * this._res)
      this.redraw()
    },
  },
}

export class UI extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'ui'

    defineProps(this, propertySchema, data)
    this._offset = new THREE.Vector3().fromArray(data.offset || defaults.offset)

    this.ui = this

    this._offset._onChange = () => this.rebuild()
  }

  build() {
    if (!isBrowser) return
    this.unbuild()
    this.canvas = document.createElement('canvas')
    this.canvas.width = this._width * this._res
    this.canvas.height = this._height * this._res
    this.canvasCtx = this.canvas.getContext('2d')
    if (this._space === 'world') {
      // world-space
      this.texture = new THREE.CanvasTexture(this.canvas)
      this.texture.colorSpace = THREE.SRGBColorSpace
      this.texture.anisotropy = this.ctx.world.graphics.maxAnisotropy
      // this.texture.minFilter = THREE.LinearFilter // or THREE.NearestFilter for pixel-perfect but potentially aliased text
      // this.texture.magFilter = THREE.LinearFilter
      // this.texture.generateMipmaps = true
      this.geometry = new THREE.PlaneGeometry(this._width, this._height)
      this.geometry.scale(this._size, this._size, this._size)
      pivotGeometry(this._pivot, this.geometry, this._width * this._size, this._height * this._size)
      this.pivotOffset = getPivotOffset(this._pivot, this._width, this._height)
      this.material = this.createMaterial(this._lit, this.texture, this._transparent, this._doubleside)
      this.mesh = new THREE.Mesh(this.geometry, this.material)
      this.mesh.matrixAutoUpdate = false
      this.mesh.matrixWorldAutoUpdate = false
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.ctx.world.stage.scene.add(this.mesh)
      if (this._pointerEvents) {
        this.sItem = {
          matrix: this.mesh.matrixWorld,
          geometry: this.geometry,
          material: this.material,
          getEntity: () => this.ctx.entity,
          node: this,
        }
        this.ctx.world.stage.octree.insert(this.sItem)
      }
      this.ctx.world.setHot(this, true)
    } else {
      // screen-space
      this.canvas.style.position = 'absolute'
      this.canvas.style.width = this._width + 'px'
      this.canvas.style.height = this._height + 'px'
      pivotCanvas(this._pivot, this.canvas, this._width, this._height)
      this.canvas.style.left = `calc(${this.position.x * 100}% + ${this._offset.x}px)`
      this.canvas.style.top = `calc(${this.position.y * 100}% + ${this._offset.y}px)`
      this.canvas.style.pointerEvents = this._pointerEvents ? 'auto' : 'none'
      if (this._pointerEvents) {
        let hit
        const canvas = this.canvas
        const world = this.ctx.world
        const onPointerEnter = e => {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * this._res
          const y = (e.clientY - rect.top) * this._res
          hit = {
            node: this,
            coords: new THREE.Vector3(x, y, 0),
          }
          world.pointer.setScreenHit(hit)
        }
        const onPointerMove = e => {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * this._res
          const y = (e.clientY - rect.top) * this._res
          hit.coords.x = x
          hit.coords.y = y
        }
        const onPointerLeave = e => {
          hit = null
          world.pointer.setScreenHit(null)
        }
        canvas.addEventListener('pointerenter', onPointerEnter)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerleave', onPointerLeave)
        this.cleanupPointer = () => {
          if (hit) world.pointer.setScreenHit(null)
          canvas.removeEventListener('pointerenter', onPointerEnter)
          canvas.removeEventListener('pointermove', onPointerMove)
          canvas.removeEventListener('pointerleave', onPointerLeave)
        }
      }
      this.ctx.world.pointer.ui.prepend(this.canvas)
    }
    this.needsRebuild = false
  }

  unbuild() {
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.texture.dispose()
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
      this.canvas = null
      if (this.sItem) {
        this.ctx.world.stage.octree.remove(this.sItem)
        this.sItem = null
      }
      this.ctx.world.setHot(this, false)
    }
    if (this.canvas) {
      this.ctx.world.pointer.ui.removeChild(this.canvas)
      this.canvas = null
    }
    this.cleanupPointer?.()
    this.cleanupPointer = null
  }

  draw() {
    if (!isBrowser) return
    this.yogaNode.calculateLayout(this._width * this._res, this._height * this._res, Yoga.DIRECTION_LTR)
    const ctx = this.canvasCtx
    ctx.clearRect(0, 0, this._width * this._res, this._height * this._res)
    const left = this.yogaNode.getComputedLeft()
    const top = this.yogaNode.getComputedTop()
    const width = this.yogaNode.getComputedWidth()
    const height = this.yogaNode.getComputedHeight()
    if (this._backgroundColor) {
      // when theres a border, slightly inset to prevent bleeding
      const inset = this._borderColor && this._borderWidth ? 1 * this._res : 0
      const radius = Math.max(0, this._borderRadius * this._res - inset)
      const insetLeft = left + inset
      const insetTop = top + inset
      const insetWidth = width - inset * 2
      const insetHeight = height - inset * 2
      fillRoundRect(ctx, insetLeft, insetTop, insetWidth, insetHeight, radius, this._backgroundColor)
    }
    if (this._borderWidth && this._borderColor) {
      const radius = this._borderRadius * this._res
      const thickness = this._borderWidth * this._res
      ctx.strokeStyle = this._borderColor
      ctx.lineWidth = thickness
      if (this._borderRadius) {
        borderRoundRect(ctx, left, top, width, height, radius, thickness)
      } else {
        const insetLeft = left + thickness / 2
        const insetTop = top + thickness / 2
        const insetWidth = width - thickness
        const insetHeight = height - thickness
        ctx.strokeRect(insetLeft, insetTop, insetWidth, insetHeight)
      }
    }
    this.box = { left, top, width, height }
    this.children.forEach(child => child.draw(ctx, left, top))
    if (this.texture) this.texture.needsUpdate = true
    this.needsRedraw = false
  }

  mount() {
    if (this.ctx.world.network.isServer) return
    if (this.parent?.ui) return console.error('ui: cannot be nested inside another ui')
    this.yogaNode = Yoga.Node.create()
    this.yogaNode.setWidth(this._width * this._res)
    this.yogaNode.setHeight(this._height * this._res)
    this.yogaNode.setBorder(Yoga.EDGE_ALL, this._borderWidth * this._res)
    if (isArray(this._padding)) {
      const [top, right, bottom, left] = this._padding
      this.yogaNode.setPadding(Yoga.EDGE_TOP, top * this._res)
      this.yogaNode.setPadding(Yoga.EDGE_RIGHT, right * this._res)
      this.yogaNode.setPadding(Yoga.EDGE_BOTTOM, bottom * this._res)
      this.yogaNode.setPadding(Yoga.EDGE_LEFT, left * this._res)
    } else {
      this.yogaNode.setPadding(Yoga.EDGE_ALL, this._padding * this._res)
    }
    this.yogaNode.setFlexDirection(FlexDirection[this._flexDirection])
    this.yogaNode.setJustifyContent(JustifyContent[this._justifyContent])
    this.yogaNode.setAlignItems(AlignItems[this._alignItems])
    this.yogaNode.setAlignContent(AlignContent[this._alignContent])
    this.yogaNode.setFlexWrap(FlexWrap[this._flexWrap])
    this.yogaNode.setGap(Yoga.GUTTER_ALL, this._gap * this._res)
    this.build()
    this.needsRedraw = true
    this.setDirty()
  }

  commit(didMove) {
    if (this.ctx.world.network.isServer) {
      return
    }
    if (this.needsRebuild) {
      this.build()
    }
    if (this.needsRedraw) {
      this.draw()
    }
    if (didMove) {
      // if (this._billboard !== 'none') {
      //   v1.setFromMatrixPosition(this.matrixWorld)
      //   v2.setFromMatrixScale(this.matrixWorld)
      //   this.mesh.matrixWorld.compose(v1, iQuaternion, v2)
      // } else {
      //   this.mesh.matrixWorld.copy(this.matrixWorld)
      //   this.ctx.world.stage.octree.move(this.sItem)
      // }
    }
  }

  lateUpdate(delta) {
    if (this._space === 'world') {
      const world = this.ctx.world
      const camera = world.camera
      const camPosition = v1.setFromMatrixPosition(camera.matrixWorld)
      const uiPosition = v2.setFromMatrixPosition(this.matrixWorld)
      const distance = camPosition.distanceTo(uiPosition)
      // this.mesh.renderOrder = -distance // Same ordering as particles

      const pos = v3
      const qua = q1
      const sca = v4
      this.matrixWorld.decompose(pos, qua, sca)
      if (this._billboard === 'full') {
        if (world.xr.session) {
          // full in XR means lookAt camera (excludes roll)
          v5.subVectors(camPosition, pos).normalize()
          qua.setFromUnitVectors(FORWARD, v5)
          e1.setFromQuaternion(qua)
          e1.z = 0
          qua.setFromEuler(e1)
        } else {
          // full in desktop/mobile means matching camera rotation
          qua.copy(world.rig.quaternion)
        }
      } else if (this._billboard === 'y') {
        if (world.xr.session) {
          // full in XR means lookAt camera (only y)
          v5.subVectors(camPosition, pos).normalize()
          qua.setFromUnitVectors(FORWARD, v5)
          e1.setFromQuaternion(qua)
          e1.x = 0
          e1.z = 0
          qua.setFromEuler(e1)
        } else {
          // full in desktop/mobile means matching camera y rotation
          e1.setFromQuaternion(world.rig.quaternion)
          e1.x = 0
          e1.z = 0
          qua.setFromEuler(e1)
        }
      }
      if (this._scaler) {
        const worldToScreenFactor = world.graphics.worldToScreenFactor
        const [minDistance, maxDistance, baseScale = 1] = this._scaler
        const clampedDistance = clamp(distance, minDistance, maxDistance)
        // calculate scale factor based on the distance
        // When distance is at min, scale is 1.0 (or some other base scale)
        // When distance is at max, scale adjusts proportionally
        let scaleFactor = (baseScale * (worldToScreenFactor * clampedDistance)) / this._size
        // if (world.xr.session) scaleFactor *= 0.3 // roughly matches desktop fov etc
        sca.setScalar(scaleFactor)
      }
      this.matrixWorld.compose(pos, qua, sca)
      this.mesh.matrixWorld.copy(this.matrixWorld)
      if (this.sItem) {
        world.stage.octree.move(this.sItem)
      }
    }
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    this.unbuild()
    this.needRebuild = false
    this.needsRedraw = false
    this.yogaNode?.free()
    this.yogaNode = null
    this.box = null
  }

  rebuild() {
    this.needsRebuild = true
    this.needsRedraw = true
    this.setDirty()
  }

  redraw() {
    this.needsRedraw = true
    this.setDirty()
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
    this._offset = source._offset
    return this
  }

  resolveHit(hit) {
    if (hit?.point) {
      const inverseMatrix = m1.copy(this.mesh.matrixWorld).invert()
      // convert world hit point to canvas coordinates (0,0 is top left x,y)
      v1.copy(hit.point)
        .applyMatrix4(inverseMatrix)
        .multiplyScalar(1 / this._size)
        .sub(this.pivotOffset)
      const x = v1.x * this._res
      const y = -v1.y * this._res
      return this.findNodeAt(x, y)
    }
    if (hit?.coords) {
      return this.findNodeAt(hit.coords.x, hit.coords.y)
    }
    return null
  }

  findNodeAt(x, y) {
    const findHitNode = (node, offsetX = 0, offsetY = 0) => {
      if (!node.box || node._display === 'none') return null
      const left = offsetX + node.box.left
      const top = offsetY + node.box.top
      const width = node.box.width
      const height = node.box.height
      if (x < left || x > left + width || y < top || y > top + height) {
        return null
      }
      // Check children from front to back
      for (let i = node.children.length - 1; i >= 0; i--) {
        const childHit = findHitNode(node.children[i], offsetX, offsetY)
        if (childHit) return childHit
      }
      return node
    }
    return findHitNode(this)
  }

  createMaterial(lit, texture, transparent, doubleside) {
    const material = lit
      ? new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 })
      : new THREE.MeshBasicMaterial({})
    material.color.set('white')
    material.transparent = transparent
    material.depthWrite = false
    material.map = texture
    material.side = doubleside ? THREE.DoubleSide : THREE.FrontSide
    this.ctx.world.setupMaterial(material)
    return material
  }

  get offset() {
    return this._offset
  }

  set offset(value) {
    if (!value || !value.isVector3) {
      throw new Error(`[ui] offset invalid`)
    }
    this._offset.copy(value)
    this.rebuild()
  }

  getProxy() {
    if (!this.proxy) {
      var self = this
      let proxy = {
        get space() {
          return self.space
        },
        set space(value) {
          self.space = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get size() {
          return self.size
        },
        set size(value) {
          self.size = value
        },
        get res() {
          return self.res
        },
        set res(value) {
          self.res = value
        },
        get lit() {
          return self.lit
        },
        set lit(value) {
          self.lit = value
        },
        get doubleside() {
          return self.doubleside
        },
        set doubleside(value) {
          self.doubleside = value
        },
        get billboard() {
          return self.billboard
        },
        set billboard(value) {
          self.billboard = value
        },
        get pivot() {
          return self.pivot
        },
        set pivot(value) {
          self.pivot = value
        },
        get offset() {
          return self.offset
        },
        set offset(value) {
          self.offset = value
        },
        get scaler() {
          return self.scaler
        },
        set scaler(value) {
          self.scaler = value
        },
        get pointerEvents() {
          return self.pointerEvents
        },
        set pointerEvents(value) {
          self.pointerEvents = value
        },
        get transparent() {
          return self.transparent
        },
        set transparent(value) {
          self.transparent = value
        },
        get backgroundColor() {
          return self.backgroundColor
        },
        set backgroundColor(value) {
          self.backgroundColor = value
        },
        get borderWidth() {
          return self.borderWidth
        },
        set borderWidth(value) {
          self.borderWidth = value
        },
        get borderColor() {
          return self.borderColor
        },
        set borderColor(value) {
          self.borderColor = value
        },
        get borderRadius() {
          return self.borderRadius
        },
        set borderRadius(value) {
          self.borderRadius = value
        },
        get padding() {
          return self.padding
        },
        set padding(value) {
          self.padding = value
        },
        get flexDirection() {
          return self.flexDirection
        },
        set flexDirection(value) {
          self.flexDirection = value
        },
        get justifyContent() {
          return self.justifyContent
        },
        set justifyContent(value) {
          self.justifyContent = value
        },
        get alignItems() {
          return self.alignItems
        },
        set alignItems(value) {
          self.alignItems = value
        },
        get alignContent() {
          return self.alignContent
        },
        set alignContent(value) {
          self.alignContent = value
        },
        get flexWrap() {
          return self.flexWrap
        },
        set flexWrap(value) {
          self.flexWrap = value
        },
        get gap() {
          return self.gap
        },
        set gap(value) {
          self.gap = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function pivotGeometry(pivot, geometry, width, height) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  switch (pivot) {
    case 'top-left':
      geometry.translate(halfWidth, -halfHeight, 0)
      break
    case 'top-center':
      geometry.translate(0, -halfHeight, 0)
      break
    case 'top-right':
      geometry.translate(-halfWidth, -halfHeight, 0)
      break
    case 'center-left':
      geometry.translate(halfWidth, 0, 0)
      break
    case 'center-right':
      geometry.translate(-halfWidth, 0, 0)
      break
    case 'bottom-left':
      geometry.translate(halfWidth, halfHeight, 0)
      break
    case 'bottom-center':
      geometry.translate(0, halfHeight, 0)
      break
    case 'bottom-right':
      geometry.translate(-halfWidth, halfHeight, 0)
      break
    case 'center':
    default:
      break
  }
}

function pivotCanvas(pivot, canvas, width, height) {
  // const halfWidth = width / 2
  // const halfHeight = height / 2
  switch (pivot) {
    case 'top-left':
      canvas.style.transform = `translate(0%, 0%)`
      break
    case 'top-center':
      canvas.style.transform = `translate(-50%, 0%)`
      break
    case 'top-right':
      canvas.style.transform = `translate(-100%, 0%)`
      break
    case 'center-left':
      canvas.style.transform = `translate(0%, -50%)`
      break
    case 'center-right':
      canvas.style.transform = `translate(-100%, -50%)`
      break
    case 'bottom-left':
      canvas.style.transform = `translate(0%, -100%)`
      break
    case 'bottom-center':
      canvas.style.transform = `translate(-50%, -100%)`
      break
    case 'bottom-right':
      canvas.style.transform = `translate(-100%, -100%)`
      break
    case 'center':
    default:
      canvas.style.transform = `translate(-50%, -50%)`
      break
  }
}

function isBillboard(value) {
  return billboards.includes(value)
}

function isPivot(value) {
  return pivots.includes(value)
}

function isSpace(value) {
  return spaces.includes(value)
}

// pivotOffset == ( - pivotX, - pivotY )
// i.e., the negative of whatever pivotGeometry just did.
function getPivotOffset(pivot, width, height) {
  // The top-left corner is originally (-halfW, +halfH).
  // Then pivotGeometry adds the following translation:
  const halfW = width / 2
  const halfH = height / 2
  let tx = 0,
    ty = 0
  switch (pivot) {
    case 'top-left':
      tx = +halfW
      ty = -halfH
      break
    case 'top-center':
      tx = 0
      ty = -halfH
      break
    case 'top-right':
      tx = -halfW
      ty = -halfH
      break
    case 'center-left':
      tx = +halfW
      ty = 0
      break
    case 'center-right':
      tx = -halfW
      ty = 0
      break
    case 'bottom-left':
      tx = +halfW
      ty = +halfH
      break
    case 'bottom-center':
      tx = 0
      ty = +halfH
      break
    case 'bottom-right':
      tx = -halfW
      ty = +halfH
      break
    case 'center':
    default:
      tx = 0
      ty = 0
      break
  }

  // So the final local coordinate of top-left corner is:
  //   originalTopLeft + pivotTranslation
  // = (-halfW + tx, +halfH + ty)
  return new THREE.Vector2(-halfW + tx, +halfH + ty)
}

function isEdge(value) {
  if (isNumber(value)) {
    return true
  }
  if (isArray(value)) {
    return value.length === 4 && every(value, n => isNumber(n))
  }
  return false
}

function isScaler(value) {
  return isArray(value) && isNumber(value[0]) && isNumber(value[1])
}
