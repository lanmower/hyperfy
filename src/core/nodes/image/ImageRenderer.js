import * as pc from '../../extras/playcanvas.js'

export class ImageRenderer {
  constructor(imageNode) {
    this.node = imageNode
    this.n = 0
  }

  async build() {
    this.node.needsRebuild = false
    if (this.node.ctx.world.network.isServer) return
    if (!this.node._src) return
    const n = ++this.n
    let image = this.node.ctx.world.loader.get('image', this.node._src)
    if (!image) image = await this.node.ctx.world.loader.load('image', this.node._src)
    if (this.n !== n) return
    this.unbuild()
    const imgAspect = image.width / image.height
    let width = this.node._width
    let height = this.node._height
    if (width === null && height === null) {
      height = 0
      width = 0
    } else if (width !== null && height === null) {
      height = width / imgAspect
    } else if (height !== null && width === null) {
      width = height * imgAspect
    }
    const geoAspect = width / height
    const gd = this.node.ctx.world.graphics.app.graphicsDevice
    this.node.texture = new pc.Texture(gd, {
      width: image.width,
      height: image.height,
      format: pc.PIXELFORMAT_R8_G8_B8_A8,
      autoMipmap: true
    })
    this.node.texture.setSource(image)
    const geometry = pc.createPlane(gd, { halfExtents: new pc.Vec3(width / 2, height / 2, 0) })
    const material = new pc.StandardMaterial()
    material.diffuse.set(1, 1, 1)
    material.emissive.set(0, 0, 0)
    material.metalness = this.node._lit ? 0 : 0
    material.roughness = this.node._lit ? 1 : 1
    material.opacity = this.node._color === 'transparent' ? 0.5 : 1
    material.transparent = this.node._color === 'transparent'
    material.diffuseMap = this.node.texture
    material.twoSided = this.node._doubleside
    material._uImgAspect = imgAspect
    material._uGeoAspect = geoAspect
    material._uFit = this.node._fit === 'cover' ? 1 : this.node._fit === 'contain' ? 2 : 0
    material._uColor = new pc.Color(1, 1, 1)
    material.update()
    const entity = new pc.Entity('image')
    entity.addComponent('render', {
      type: 'asset',
      meshInstances: [new pc.MeshInstance(geometry, material)]
    })
    const pos = this.node.matrixWorld.getTranslation(new pc.Vec3())
    const rot = this.node.matrixWorld.getRotation(new pc.Quat())
    entity.setLocalPosition(pos)
    entity.setLocalRotation(rot)
    entity.castShadow = this.node._castShadow
    entity.receiveShadow = this.node._receiveShadow
    this.node.ctx.world.stage.scene.addChild(entity)
    this.node.mesh = entity
    this.node.sItem = {
      entity,
      getEntity: () => this.node.ctx.entity,
      node: this.node,
    }
    this.node.ctx.world.stage.octree.insert(this.node.sItem)
  }

  unbuild() {
    this.n++
    if (this.node.mesh) {
      this.node.ctx.world.stage.scene.removeChild(this.node.mesh)
      this.node.mesh = null
    }
    if (this.node.texture) {
      this.node.texture.destroy()
      this.node.texture = null
    }
    if (this.node.sItem) {
      this.node.ctx.world.stage.octree.remove(this.node.sItem)
      this.node.sItem = null
    }
  }
}
