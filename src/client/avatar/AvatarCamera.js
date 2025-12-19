import * as THREE from '../../core/extras/three.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const DEG2RAD = THREE.MathUtils.DEG2RAD
const FOV = 70
const PLANE_ASPECT_RATIO = 16 / 9

export class AvatarCamera {
  constructor(camera, size) {
    this.camera = camera
    this.size = size
  }

  positionCamera(node) {
    const bbox = new THREE.Box3().setFromObject(node.model)
    const center = bbox.getCenter(v1)
    const size = bbox.getSize(v2)
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * DEG2RAD
    let distance = maxDim / (2 * Math.tan(fov / 2))
    distance *= 1.2
    this.camera.position.copy(center)
    this.camera.position.z += distance
    this.camera.lookAt(center)
    this.camera.updateProjectionMatrix()
  }

  resize(width, height) {
    const planeHeight = 2 * Math.tan((FOV * DEG2RAD) / 2) * 1
    const planeWidth = planeHeight * PLANE_ASPECT_RATIO
    const viewportAspect = width / height
    let finalWidth, finalHeight
    if (viewportAspect > PLANE_ASPECT_RATIO) {
      finalHeight = height
      finalWidth = finalHeight * PLANE_ASPECT_RATIO
    } else {
      finalWidth = width
      finalHeight = finalWidth / PLANE_ASPECT_RATIO
    }
    const left = (width - finalWidth) / 2
    const bottom = (height - finalHeight) / 2
    this.camera.setViewOffset(width, height, left, bottom, finalWidth, finalHeight)
    this.camera.aspect = finalWidth / finalHeight
    this.camera.updateProjectionMatrix()
  }
}
