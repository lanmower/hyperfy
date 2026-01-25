import * as THREE from '../core/extras/three.js'
import { Emotes } from '../core/extras/playerEmotes.js'
import { Ranks } from '../core/extras/ranks.js'
import { AvatarConfig } from './config/AvatarConfig.js'
import { FOV, DEG2RAD, PLANE_ASPECT_RATIO } from '../core/constants/MathConstants.js'

const MAX_UPLOAD_SIZE = 1000000000000
const MAX_UPLOAD_SIZE_LABEL = '1LOLS'
const HDR_URL = '/day2.hdr'
const materialSlots = [
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'map',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
]

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()

export class AvatarPreview {
  constructor(world, viewport) {
    this.world = world
    this.viewport = viewport
    this.scene = new THREE.Scene()
    this.size = { width: 1080, height: 900, aspect: 1080 / 900 }
    this.camera = new THREE.PerspectiveCamera(FOV, this.size.aspect, 0.01, 2000)
    this.camera.layers.enableAll()
    this.scene.add(this.camera)
    this.sun = new THREE.DirectionalLight(0xffffff, 3)
    this.sun.position.fromArray([200, 400, 200])
    this.sun.target.position.copy(this.camera.position)
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    })
    this.renderer.setClearColor(0xffffff, 0)
    this.renderer.setPixelRatio(window.devicePixelRatio || 1)
    this.renderer.setSize(this.size.width, this.size.height)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1
    this.rig = new THREE.Object3D()
    this.rig.rotation.y = 180 * DEG2RAD
    this.scene.add(this.rig)
    this.viewport.appendChild(this.renderer.domElement)
    this.resize(this.viewport.offsetWidth, this.viewport.offsetHeight, false)
    window.preview = this
  }

  async load(file, url) {
    this.file = file
    this.url = url
    if (this.file.size > MAX_UPLOAD_SIZE) {
      return { error: `Max file size ${MAX_UPLOAD_SIZE_LABEL}` }
    }
    const texture = await this.world.loader.load('hdr', HDR_URL)
    texture.mapping = THREE.EquirectangularReflectionMapping
    this.scene.environment = texture
    this.avatar = await this.world.loader.load('avatar', this.url)
    this.node = this.avatar.toNodes({
      camera: this.camera,
      scene: this.scene,
      octree: null,
      loader: this.world.loader,
    }).get('avatar')
    this.node.activate({})
    this.node.setEmote(Emotes.IDLE)
    if (!this.renderer) return
    this.positionCamera(this.node)
    this.render()
    this.info = this.resolveInfo(this.file, this.node)
    this.renderer.setAnimationLoop(this.update)
    return this.info
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

  resolveInfo(file, node) {
    const info = {
      file,
      fileSize: file.size,
      rank: Ranks.VISITOR,
      textures: 0,
      textureBytes: 0,
      triangles: 0,
    }
    const textures = new Set()
    node.model.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) {
          const index = child.geometry.index
          const position = child.geometry.attributes.position
          if (index) {
            info.triangles += index.count / 3
          } else if (position) {
            info.triangles += position.count / 3
          }
        }
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach(material => {
            materialSlots.forEach(slot => {
              const texture = material[slot]
              if (texture && texture.image) {
                textures.add(texture)
              }
            })
          })
        }
      }
    })
    info.textures = textures.size
    textures.forEach(texture => {
      if (texture.image) {
        const { width, height } = texture.image
        const bytesPerPixel = 4
        info.textureBytes += width * height * bytesPerPixel
      }
    })
    if (info.fileSize > AvatarConfig.limits.maxFileSize || info.textureBytes > AvatarConfig.limits.maxTextureBytes || info.triangles > AvatarConfig.limits.maxTriangles) {
      info.rank = Ranks.ADMIN
    } else if (info.fileSize > AvatarConfig.limits.builderFileSize || info.textureBytes > AvatarConfig.limits.builderTextureBytes || info.triangles > AvatarConfig.limits.builderTriangles) {
      info.rank = Ranks.BUILDER
    }
    return info
  }

  resize(width, height, render = true) {
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
    this.renderer.setSize(width, height)
    if (render) {
      this.render()
    }
  }

  update = time => {
    const delta = (this.lastTime ? time - this.lastTime : 0) / 1000
    this.lastTime = time
    this.node.instance.update(delta)
    this.render()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  capture(width, height) {
    const actualWidth = this.size.width
    const actualHeight = this.size.height
    this.resize(width, height)
    const base64 = this.renderer.domElement.toDataURL()
    this.resize(actualWidth, actualHeight)
    return base64
  }

  async uploadAndEquip(makeDefault) {
    let url = this.url
    if (!this.isAsset) {
      url = await this.engine.driver.uploadFile(this.file)
    }
    this.engine.urls.route(url, this.url)
    this.engine.driver.changeAvatar(url, this.info.rank, makeDefault)
  }

  destroy() {
    this.node?.deactivate()
    this.viewport.removeChild(this.renderer.domElement)
    this.renderer.setAnimationLoop(null)
    this.renderer.clear()
    this.renderer = null
  }
}
