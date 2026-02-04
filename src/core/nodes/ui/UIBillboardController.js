import * as pc from '../../extras/playcanvas.js'
import { clamp } from '../../utils.js'
import { v, q, e } from '../../utils/TempVectors.js'

const FORWARD = new pc.Vec3(0, 0, 1)

export class UIBillboardController {
  constructor(parent) {
    this.parent = parent
  }

  update(delta) {
    const p = this.parent
    if (p._space !== 'world') return

    const world = p.ctx.world
    const camera = world.camera
    const camPosition = v[0].setFromMatrixPosition(camera.matrixWorld)
    const uiPosition = v[1].setFromMatrixPosition(p.matrixWorld)
    const distance = camPosition.distanceTo(uiPosition)

    const pos = v[2]
    const qua = q[0]
    const sca = v[3]
    p.matrixWorld.decompose(pos, qua, sca)

    this.applyBillboard(qua, pos, camPosition, world)
    this.applyScaler(sca, distance, world)

    p.matrixWorld.compose(pos, qua, sca)
    if (p.entity) {
      const pos2 = p.matrixWorld.getTranslation(new pc.Vec3())
      const rot = p.matrixWorld.getRotation(new pc.Quat())
      p.entity.setLocalPosition(pos2)
      p.entity.setLocalRotation(rot)
    }
    if (p.sItem) {
      world.stage.octree.move(p.sItem)
    }
  }

  applyBillboard(qua, pos, camPosition, world) {
    const p = this.parent
    if (p._billboard === 'full') {
      if (world.xr.session) {
        v[4].subVectors(camPosition, pos).normalize()
        qua.setFromUnitVectors(FORWARD, v[4])
        e[0].setFromQuaternion(qua)
        e[0].z = 0
        qua.setFromEuler(e[0])
      } else {
        qua.copy(world.rig.quaternion)
      }
    } else if (p._billboard === 'y') {
      if (world.xr.session) {
        v[4].subVectors(camPosition, pos).normalize()
        qua.setFromUnitVectors(FORWARD, v[4])
        e[0].setFromQuaternion(qua)
        e[0].x = 0
        e[0].z = 0
        qua.setFromEuler(e[0])
      } else {
        e[0].setFromQuaternion(world.rig.quaternion)
        e[0].x = 0
        e[0].z = 0
        qua.setFromEuler(e[0])
      }
    }
  }

  applyScaler(sca, distance, world) {
    const p = this.parent
    if (p._scaler) {
      const worldToScreenFactor = world.graphics.worldToScreenFactor
      const [minDistance, maxDistance, baseScale = 1] = p._scaler
      const clampedDistance = clamp(distance, minDistance, maxDistance)
      let scaleFactor = (baseScale * (worldToScreenFactor * clampedDistance)) / p._size
      sca.setScalar(scaleFactor)
    }
  }
}
