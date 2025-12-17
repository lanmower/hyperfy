import { System } from './System.js'
import * as THREE from '../extras/three.js'
import { XRControllerModelFactory } from 'three/addons'

const UP = new THREE.Vector3(0, 1, 0)

const v1 = new THREE.Vector3()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

export class XR extends System {
  static DEPS = {
    graphics: 'graphics',
    events: 'events',
    rig: 'rig',
    camera: 'camera',
  }

  constructor(world) {
    super(world)
    this.session = null
    this.camera = null
    this.controller1Model = null
    this.controller2Model = null
    this.supportsVR = false
    this.supportsAR = false
    this.controllerModelFactory = new XRControllerModelFactory()
  }

  async init() {
    this.supportsVR = await navigator.xr?.isSessionSupported('immersive-vr')
    this.supportsAR = await navigator.xr?.isSessionSupported('immersive-ar')
  }

  async enter() {
    const session = await navigator.xr?.requestSession('immersive-vr', {
      requiredFeatures: ['local-floor'],
    })
    try {
      session.updateTargetFrameRate(72)
    } catch (err) {
      console.error(err)
      console.error('xr session.updateTargetFrameRate(72) failed')
    }
    this.graphics.renderer.xr.setSession(session)
    session.addEventListener('end', this.onSessionEnd)
    this.session = session
    this.camera = this.graphics.renderer.xr.getCamera()
    this.events.emit('xrSession', session)

    this.controller1Model = this.graphics.renderer.xr.getControllerGrip(0)
    this.controller1Model.add(this.controllerModelFactory.createControllerModel(this.controller1Model))
    this.rig.add(this.controller1Model)

    this.controller2Model = this.graphics.renderer.xr.getControllerGrip(1)
    this.controller2Model.add(this.controllerModelFactory.createControllerModel(this.controller2Model))
    this.rig.add(this.controller2Model)
  }

  onSessionEnd = () => {
    this.cameraService.position.set(0, 0, 0)
    this.cameraService.rotation.set(0, 0, 0)
    this.rig.remove(this.controller1Model)
    this.rig.remove(this.controller2Model)
    this.session = null
    this.camera = null
    this.controller1Model = null
    this.controller2Model = null
    this.events.emit('xrSession', null)
  }
}
