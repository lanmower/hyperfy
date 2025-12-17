import * as THREE from 'three'
import { isString } from 'lodash'
import { Emotes } from '../core/extras/playerEmotes.js'
import { AvatarCamera } from './avatar/AvatarCamera.js'
import { AvatarStats } from './avatar/AvatarStats.js'

const MAX_UPLOAD_SIZE = 1000000000000
const MAX_UPLOAD_SIZE_LABEL = '1LOLS'
const HDR_URL = '/day2.hdr'
const DEG2RAD = THREE.MathUtils.DEG2RAD

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()

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

let renderer = null
function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    })
  }
  return renderer
}

export class AvatarPreview {
  constructor(world, viewport) {
    this.world = world
    this.viewport = viewport
    this.scene = new THREE.Scene()
    this.size = { width: 1080, height: 900, aspect: 1080 / 900 }
    this.camera = new THREE.PerspectiveCamera(70, this.size.aspect, 0.01, 2000)
    this.camera.layers.enableAll()
    this.scene.add(this.camera)
    this.sun = new THREE.DirectionalLight(0xffffff, 3)
    this.sun.position.fromArray([200, 400, 200])
    this.sun.target.position.copy(this.camera.position)
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)
    this.renderer = getRenderer()
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
    this.avatarCamera = new AvatarCamera(this.camera, this.size)
    this.resize(this.viewport.offsetWidth, this.viewport.offsetHeight, false)
    window.preview = this
  }

  async load(file, url) {
    this.file = file
    this.url = url
    console.log('file', this.file)
    if (this.file.size > MAX_UPLOAD_SIZE) {
      return { error: `Max file size ${MAX_UPLOAD_SIZE_LABEL}` }
    }
    const texture = await this.world.loader.load('hdr', HDR_URL)
    texture.mapping = THREE.EquirectangularReflectionMapping
    this.scene.environment = texture
    this.avatar = await this.world.loader.load('avatar', this.url)
    this.node = this.avatar
      .toNodes({
        camera: this.camera,
        scene: this.scene,
        octree: null,
        loader: this.world.loader,
      })
      .get('avatar')
    this.node.activate({})
    this.node.setEmote(Emotes.IDLE)
    if (!this.renderer) return
    this.avatarCamera.positionCamera(this.node)
    this.render()
    this.info = AvatarStats.resolveInfo(this.file, this.node)
    this.renderer.setAnimationLoop(this.update)
    return this.info
  }

  resize(width, height, render = true) {
    this.avatarCamera.resize(width, height)
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
    this.engine.urls.route(url, this.url) // instant equip!
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
