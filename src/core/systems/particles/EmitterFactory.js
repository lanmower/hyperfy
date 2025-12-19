import * as THREE from '../../extras/three.js'
import { uuid } from '../../utils.js'
import { ParticleGeometryBuilder } from './ParticleGeometryBuilder.js'
import { ParticleMaterialFactory } from './ParticleMaterialFactory.js'
import { EmitterController } from './EmitterController.js'

const billboardModeInts = {
  full: 0,
  y: 1,
  direction: 2,
}

export class EmitterFactory {
  static create(node, worker, loader, stage, camera, uOrientationFull, uOrientationY) {
    const id = uuid()
    const config = node.getConfig()

    const { geometry, attributes } = ParticleGeometryBuilder.create(node._max)
    const { aPosition, aRotation, aDirection, aSize, aColor, aAlpha, aEmissive, aUV } = attributes

    const next = ParticleGeometryBuilder.createNextBuffers(node._max)

    const uniforms = {
      uTexture: { value: new THREE.Texture() },
      uBillboard: { value: billboardModeInts[node._billboard] },
      uOrientation: node._billboard === 'full' ? uOrientationFull : uOrientationY,
    }
    loader.load('texture', node._image).then(texture => {
      texture.colorSpace = THREE.SRGBColorSpace
      uniforms.uTexture.value = texture
    })

    const material = ParticleMaterialFactory.create(node, uniforms, loader)
    const mesh = new THREE.InstancedMesh(geometry, material, node._max)
    mesh._node = node
    mesh.count = 0
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    mesh.matrixAutoUpdate = false
    mesh.matrixWorldAutoUpdate = false
    stage.scene.add(mesh)

    const controller = new EmitterController(id, node, mesh, worker, next, attributes, camera, stage)

    const handle = {
      id,
      node,
      send: controller.send.bind(controller),
      setEmitting: controller.setEmitting.bind(controller),
      onMessage: controller.onMessage.bind(controller),
      update: controller.update.bind(controller),
      destroy: controller.destroy.bind(controller),
    }

    worker.postMessage({ op: 'create', id, ...config })
    return handle
  }
}
