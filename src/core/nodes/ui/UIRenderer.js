import * as pc from '../../extras/playcanvas.js'
import { fillRoundRect } from '../../extras/roundRect.js'
import { borderRoundRect } from '../../extras/borderRoundRect.js'
import Yoga from 'yoga-layout'
import { UIHelper } from '../../utils/helpers/Helpers.js'
const { pivotGeometry, getPivotOffset, pivotCanvas } = UIHelper

export class UIRenderer {
  constructor(ui) {
    this.ui = ui
  }

  build() {
    const ui = this.ui
    if (typeof window === 'undefined') return
    this.unbuild()
    ui.canvas = document.createElement('canvas')
    ui.canvas.width = ui._width * ui._res
    ui.canvas.height = ui._height * ui._res
    ui.canvasCtx = ui.canvas.getContext('2d')
    if (ui._space === 'world') {
      const gd = ui.ctx.world.graphics.app.graphicsDevice
      ui.texture = new pc.Texture(gd, {
        width: ui.canvas.width,
        height: ui.canvas.height,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        autoMipmap: true
      })
      ui.geometry = pc.createPlane(gd, { halfExtents: new pc.Vec3(ui._width * ui._size / 2, ui._height * ui._size / 2, 0) })
      ui.pivotOffset = getPivotOffset(ui._pivot, ui._width, ui._height)
      ui.material = this.createMaterial(ui._lit, ui.texture, ui._transparent, ui._doubleside)
      ui.entity = new pc.Entity('ui')
      ui.entity.addComponent('render', {
        type: 'asset',
        meshInstances: [new pc.MeshInstance(ui.geometry, ui.material)]
      })
      ui.entity.setLocalPosition(ui.matrixWorld.getTranslation(new pc.Vec3()))
      ui.entity.setLocalRotation(ui.matrixWorld.getRotation(new pc.Quat()))
      ui.entity.setLocalScale(1, 1, 1)
      ui.ctx.world.stage.scene.addChild(ui.entity)
      if (ui._pointerEvents) {
        ui.sItem = {
          entity: ui.entity,
          getEntity: () => ui.ctx.entity,
          node: ui,
        }
        ui.ctx.world.stage.octree.insert(ui.sItem)
      }
      ui.ctx.world.setHot(ui, true)
    } else {
      ui.canvas.style.position = 'absolute'
      ui.canvas.style.width = ui._width + 'px'
      ui.canvas.style.height = ui._height + 'px'
      pivotCanvas(ui._pivot, ui.canvas, ui._width, ui._height)
      ui.canvas.style.left = `calc(${ui.position.x * 100}% + ${ui._offset.x}px)`
      ui.canvas.style.top = `calc(${ui.position.y * 100}% + ${ui._offset.y}px)`
      ui.canvas.style.pointerEvents = ui._pointerEvents ? 'auto' : 'none'
      if (ui._pointerEvents) {
        let hit
        const canvas = ui.canvas
        const world = ui.ctx.world
        const onPointerEnter = e => {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * ui._res
          const y = (e.clientY - rect.top) * ui._res
          hit = {
            node: ui,
            coords: new pc.Vec3(x, y, 0),
          }
          world.pointer.setScreenHit(hit)
        }
        const onPointerMove = e => {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * ui._res
          const y = (e.clientY - rect.top) * ui._res
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
        ui.cleanupPointer = () => {
          if (hit) world.pointer.setScreenHit(null)
          canvas.removeEventListener('pointerenter', onPointerEnter)
          canvas.removeEventListener('pointermove', onPointerMove)
          canvas.removeEventListener('pointerleave', onPointerLeave)
        }
      }
      ui.ctx.world.pointer.ui.prepend(ui.canvas)
    }
    ui.needsRebuild = false
  }

  unbuild() {
    const ui = this.ui
    if (ui.entity) {
      ui.ctx.world.stage.scene.removeChild(ui.entity)
      ui.texture?.destroy()
      ui.material?.destroy()
      ui.entity = null
      ui.canvas = null
      if (ui.sItem) {
        ui.ctx.world.stage.octree.remove(ui.sItem)
        ui.sItem = null
      }
      ui.ctx.world.setHot(ui, false)
    }
    if (ui.canvas) {
      ui.ctx.world.pointer.ui.removeChild(ui.canvas)
      ui.canvas = null
    }
    ui.cleanupPointer?.()
    ui.cleanupPointer = null
  }

  draw() {
    const ui = this.ui
    if (typeof window === 'undefined') return
    ui.yogaNode.calculateLayout(ui._width * ui._res, ui._height * ui._res, Yoga.DIRECTION_LTR)
    const ctx = ui.canvasCtx
    ctx.clearRect(0, 0, ui._width * ui._res, ui._height * ui._res)
    const left = ui.yogaNode.getComputedLeft()
    const top = ui.yogaNode.getComputedTop()
    const width = ui.yogaNode.getComputedWidth()
    const height = ui.yogaNode.getComputedHeight()
    if (ui._backgroundColor) {
      const inset = ui._borderColor && ui._borderWidth ? 1 * ui._res : 0
      const radius = Math.max(0, ui._borderRadius * ui._res - inset)
      const insetLeft = left + inset
      const insetTop = top + inset
      const insetWidth = width - inset * 2
      const insetHeight = height - inset * 2
      fillRoundRect(ctx, insetLeft, insetTop, insetWidth, insetHeight, radius, ui._backgroundColor)
    }
    if (ui._borderWidth && ui._borderColor) {
      const radius = ui._borderRadius * ui._res
      const thickness = ui._borderWidth * ui._res
      ctx.strokeStyle = ui._borderColor
      ctx.lineWidth = thickness
      if (ui._borderRadius) {
        borderRoundRect(ctx, left, top, width, height, radius, thickness)
      } else {
        const insetLeft = left + thickness / 2
        const insetTop = top + thickness / 2
        const insetWidth = width - thickness
        const insetHeight = height - thickness
        ctx.strokeRect(insetLeft, insetTop, insetWidth, insetHeight)
      }
    }
    ui.box = { left, top, width, height }
    ui.children.forEach(child => child.draw(ctx, left, top))
    if (ui.texture && ui.canvas) {
      const gd = ui.ctx.world.graphics.app.graphicsDevice
      ui.texture.setSource(ui.canvas)
    }
    ui.needsRedraw = false
  }

  createMaterial(lit, texture, transparent, doubleside) {
    const ui = this.ui
    const material = new pc.StandardMaterial()
    material.diffuse.set(1, 1, 1)
    material.emissive.set(0, 0, 0)
    material.metalness = 0
    material.roughness = 1
    material.opacity = transparent ? 0.5 : 1
    material.transparent = transparent
    material.diffuseMap = texture
    material.twoSided = doubleside
    material.update()
    return material
  }
}
