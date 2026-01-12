import * as pc from '../../extras/playcanvas.js'
import { VideoHelper } from '../../utils/helpers/Helpers.js'

export class VideoRenderer {
  constructor(video) {
    this.video = video
  }

  createMaterial(lit, doubleside, color) {
    const material = new pc.StandardMaterial()
    material.diffuse.set(1, 1, 1)
    material.emissive.set(0, 0, 0)
    material.metalness = lit ? 0 : 0
    material.roughness = lit ? 1 : 1
    material.opacity = 1
    material.transparent = false
    material.twoSided = doubleside
    material._uVidAspect = 1
    material._uGeoAspect = 1
    material._uFit = 0
    material._uColor = new pc.Color(1, 1, 1)
    material._uOffset = new pc.Vec2(0, 0)
    material.update()
    return material
  }

  createGeometry(width, height, pivot) {
    const gd = this.video.ctx.world.graphics.app.graphicsDevice
    const geometry = pc.createPlane(gd, { halfExtents: new pc.Vec3(width / 2, height / 2, 0) })
    geometry._oWidth = width
    geometry._oHeight = height
    return geometry
  }

  createMesh(geometry, material, castShadow, receiveShadow) {
    const gd = this.video.ctx.world.graphics.app.graphicsDevice
    const entity = new pc.Entity('video')
    entity.addComponent('render', {
      type: 'asset',
      meshInstances: [new pc.MeshInstance(geometry, material)]
    })
    const pos = this.video.matrixWorld.getTranslation(new pc.Vec3())
    const rot = this.video.matrixWorld.getRotation(new pc.Quat())
    entity.setLocalPosition(pos)
    entity.setLocalRotation(rot)
    this.video.ctx.world.stage.scene.addChild(entity)
    entity._castShadow = castShadow
    entity._receiveShadow = receiveShadow
    return entity
  }

  updateGeometry(currentGeometry, instance, width, height, pivot) {
    let vidAspect = instance.width / instance.height
    let geoAspect

    if (currentGeometry) {
      geoAspect = this.video._aspect
    } else {
      if (width === null && height === null) {
        height = 0
        width = 0
      } else if (width !== null && height === null) {
        height = width / vidAspect
      } else if (height !== null && width === null) {
        width = height * vidAspect
      }
      if (currentGeometry._oWidth !== width || currentGeometry._oHeight !== height) {
        const gd = this.video.ctx.world.graphics.app.graphicsDevice
        const newGeometry = pc.createPlane(gd, { halfExtents: new pc.Vec3(width / 2, height / 2, 0) })
        newGeometry._oWidth = width
        newGeometry._oHeight = height
        if (this.video.mesh) {
          this.video.mesh.meshInstances[0].mesh = newGeometry
        }
        return { newGeometry, vidAspect, geoAspect: width / height }
      }
      geoAspect = width / height
    }

    return { geometry: currentGeometry, vidAspect, geoAspect }
  }
}
