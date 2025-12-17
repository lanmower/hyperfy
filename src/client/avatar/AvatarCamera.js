import * as THREE from 'three'

const FOV = 70
const PLANE_ASPECT_RATIO = 16 / 9
const DEG2RAD = THREE.MathUtils.DEG2RAD

const v1 = new THREE.Vector3()

export class AvatarCamera {
  constructor(camera, size) {
    this.camera = camera
    this.size = size
  }

  positionCamera(node) {
    const camera = this.camera
    const raw = node.instance.raw
    const hips = raw.userData.vrm.humanoid.getRawBone('hips').node

    const box = new THREE.Box3()
    box.setFromObject(raw.scene)

    const hipsY = hips.getWorldPosition(v1).y
    box.min.y = hipsY

    box.min.x = 0.5
    box.max.x = 0.5

    camera.position.y = box.max.y - box.getSize(v1).y / 2

    const size = new THREE.Vector3()
    box.getSize(size)

    const fov = camera.fov * (Math.PI / 180)
    const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)
    const dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2))
    const dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2))
    const cameraZ = Math.max(dx, dy)

    camera.position.z = -cameraZ
    camera.rotation.y += 180 * DEG2RAD

    const minZ = box.min.z
    const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ

    camera.far = cameraToFarEdge * 3
    camera.updateProjectionMatrix()
  }

  resize(width, height) {
    this.size.width = width
    this.size.height = height
    this.size.aspect = width / height
    this.camera.aspect = this.size.aspect

    if (this.size.aspect > PLANE_ASPECT_RATIO) {
      const cameraHeight = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
      const ratio = this.camera.aspect / PLANE_ASPECT_RATIO
      const newCameraHeight = cameraHeight / ratio
      this.camera.fov = THREE.MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2
    } else {
      this.camera.fov = FOV
    }

    this.camera.updateProjectionMatrix()
  }
}
