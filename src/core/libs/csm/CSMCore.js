import * as three from 'three'
import { CSMShader } from './CSMShader.js'
import { CSMFrustum } from './CSMFrustum.js'

function uniformSplit(amount, near, far, target) {
  for (let i = 1; i < amount; i++) {
    target.push((near + ((far - near) * i) / amount) / far)
  }
  target.push(1)
}

function logarithmicSplit(amount, near, far, target) {
  for (let i = 1; i < amount; i++) {
    target.push((near * Math.pow(far / near, i / amount)) / far)
  }
  target.push(1)
}

function practicalSplit(amount, near, far, lambda, target) {
  _uniformArray.length = 0
  _logArray.length = 0
  logarithmicSplit(amount, near, far, _logArray)
  uniformSplit(amount, near, far, _uniformArray)
  for (let i = 1; i < amount; i++) {
    target.push(three.MathUtils.lerp(_uniformArray[i - 1], _logArray[i - 1], lambda))
  }
  target.push(1)
}

const _origin = new three.Vector3(0, 0, 0)
const _lightOrientationMatrix = new three.Matrix4()
const _lightOrientationMatrixInverse = new three.Matrix4()
const _cameraToLightParentMatrix = new three.Matrix4()
const _cameraToLightMatrix = new three.Matrix4()
const _lightSpaceFrustum = new CSMFrustum()
const _center = new three.Vector3()
const _bbox = new three.Box3()
const _uniformArray = []
const _logArray = []

export class CSM {
  constructor(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q
    this.mainFrustum = new CSMFrustum()
    this.frustums = []
    this.breaks = []
    this.lights = []
    this.shaders = new Map()
    this.camera = data.camera
    this.parent = data.parent
    this.cascades = (_a = data.cascades) !== null && _a !== void 0 ? _a : 3
    this.maxCascades = (_b = data.maxCascades) !== null && _b !== void 0 ? _b : data.cascades
    this.maxFar = (_c = data.maxFar) !== null && _c !== void 0 ? _c : 100000
    this.mode = (_d = data.mode) !== null && _d !== void 0 ? _d : 'practical'
    this.practicalModeLambda = (_e = data.practicalModeLambda) !== null && _e !== void 0 ? _e : 0.5
    this.shadowMapSize = (_f = data.shadowMapSize) !== null && _f !== void 0 ? _f : 2048
    this.shadowBias = (_g = data.shadowBias) !== null && _g !== void 0 ? _g : 0
    this.shadowNormalBias = (_h = data.shadowNormalBias) !== null && _h !== void 0 ? _h : 0
    this.lightDirection =
      (_j = data.lightDirection) !== null && _j !== void 0 ? _j : new three.Vector3(1, -1, 1).normalize()
    this.lightDirectionUp = (_k = data.lightDirectionUp) !== null && _k !== void 0 ? _k : three.Object3D.DEFAULT_UP
    this.lightIntensity = (_l = data.lightIntensity) !== null && _l !== void 0 ? _l : 1
    this.lightColor = (_m = data.lightColor) !== null && _m !== void 0 ? _m : new three.Color(0xffffff)
    this.lightMargin = (_o = data.lightMargin) !== null && _o !== void 0 ? _o : 200
    this.fade = (_p = data.fade) !== null && _p !== void 0 ? _p : false
    this.noLastCascadeCutOff = (_q = data.noLastCascadeCutOff) !== null && _q !== void 0 ? _q : false
    this.customSplitsCallback = data.customSplitsCallback
    this.createLights()
    this.updateFrustums()
    this.injectInclude()
  }

  createLights() {
    for (let i = 0; i < this.cascades; i++) {
      const light = new three.DirectionalLight(this.lightColor, this.lightIntensity)
      light.castShadow = true
      light.shadow.mapSize.width = this.shadowMapSize
      light.shadow.mapSize.height = this.shadowMapSize
      light.shadow.camera.near = 0
      light.shadow.camera.far = 1
      this.parent.add(light.target)
      this.lights.push(light)
    }
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const light = this.lights[i]
      light.parent = this.parent
      this.parent.children.unshift(light)
    }
  }

  initCascades() {
    this.mainFrustum.setFromProjectionMatrix(this.camera.projectionMatrix, this.maxFar)
    this.mainFrustum.split(this.breaks, this.frustums)
  }

  updateShadowBounds() {
    const frustums = this.frustums
    for (let i = 0; i < frustums.length; i++) {
      const light = this.lights[i]
      const shadowCam = light.shadow.camera
      const frustum = this.frustums[i]
      const nearVerts = frustum.vertices.near
      const farVerts = frustum.vertices.far
      const point1 = farVerts[0]
      let point2
      if (point1.distanceTo(farVerts[2]) > point1.distanceTo(nearVerts[2])) {
        point2 = farVerts[2]
      } else {
        point2 = nearVerts[2]
      }
      let squaredBBWidth = point1.distanceTo(point2)
      if (this.fade) {
        const camera = this.camera
        const far = Math.max(camera.far, this.maxFar)
        const linearDepth = frustum.vertices.far[0].z / (far - camera.near)
        const margin = 0.25 * Math.pow(linearDepth, 2.0) * (far - camera.near)
        squaredBBWidth += margin
      }
      shadowCam.left = -squaredBBWidth / 2
      shadowCam.right = squaredBBWidth / 2
      shadowCam.top = squaredBBWidth / 2
      shadowCam.bottom = -squaredBBWidth / 2
      shadowCam.near = 0
      shadowCam.far = squaredBBWidth + this.lightMargin
      shadowCam.updateProjectionMatrix()
      light.shadow.bias = this.shadowBias * squaredBBWidth
      light.shadow.normalBias = this.shadowNormalBias * squaredBBWidth
    }
  }

  updateBreaks() {
    const camera = this.camera
    const far = Math.min(camera.far, this.maxFar)
    this.breaks.length = 0
    switch (this.mode) {
      case 'uniform':
        uniformSplit(this.cascades, camera.near, far, this.breaks)
        break
      case 'logarithmic':
        logarithmicSplit(this.cascades, camera.near, far, this.breaks)
        break
      case 'practical':
        practicalSplit(this.cascades, camera.near, far, this.practicalModeLambda, this.breaks)
        break
      case 'custom':
        if (this.customSplitsCallback === undefined) {
          throw new Error('CSM: Custom split scheme callback not defined.')
        }
        this.breaks.push(...this.customSplitsCallback(this.cascades, camera.near, far))
        break
    }
  }

  update() {
    for (let i = 0; i < this.frustums.length; i++) {
      const light = this.lights[i]
      const shadowCam = light.shadow.camera
      const texelWidth = (shadowCam.right - shadowCam.left) / this.shadowMapSize
      const texelHeight = (shadowCam.top - shadowCam.bottom) / this.shadowMapSize
      _lightOrientationMatrix.lookAt(_origin, this.lightDirection, this.lightDirectionUp)
      _lightOrientationMatrixInverse.copy(_lightOrientationMatrix).invert()
      _cameraToLightParentMatrix.copy(this.parent.matrixWorld).invert().multiply(this.camera.matrixWorld)
      _cameraToLightMatrix.multiplyMatrices(_lightOrientationMatrixInverse, _cameraToLightParentMatrix)
      this.frustums[i].toSpace(_cameraToLightMatrix, _lightSpaceFrustum)
      const nearVerts = _lightSpaceFrustum.vertices.near
      const farVerts = _lightSpaceFrustum.vertices.far
      _bbox.makeEmpty()
      for (let j = 0; j < 4; j++) {
        _bbox.expandByPoint(nearVerts[j])
        _bbox.expandByPoint(farVerts[j])
      }
      _bbox.getCenter(_center)
      _center.z = _bbox.max.z + this.lightMargin
      _center.x = Math.floor(_center.x / texelWidth) * texelWidth
      _center.y = Math.floor(_center.y / texelHeight) * texelHeight
      _center.applyMatrix4(_lightOrientationMatrix)
      light.position.copy(_center)
      light.target.position.copy(_center)
      light.target.position.x += this.lightDirection.x
      light.target.position.y += this.lightDirection.y
      light.target.position.z += this.lightDirection.z
    }
  }

  injectInclude() {
    three.ShaderChunk.lights_fragment_begin = CSMShader.lights_fragment_begin(this.cascades)
    three.ShaderChunk.lights_pars_begin = CSMShader.lights_pars_begin(this.maxCascades)
  }

  setupMaterial(material) {
    const fn = shader => {
      const breaksVec2 = this.getExtendedBreaks()
      const far = Math.min(this.camera.far, this.maxFar)
      shader.uniforms.CSM_cascades = { value: breaksVec2 }
      shader.uniforms.cameraNear = { value: Math.min(this.maxFar, this.camera.near) }
      shader.uniforms.shadowFar = { value: far }
      material.defines = material.defines || {}
      material.defines.USE_CSM = 1
      material.defines.CSM_CASCADES = this.cascades
      material.defines.CSM_FADE = this.fade ? '1' : '0'
      material.needsUpdate = true
      this.shaders.set(material, shader)
      material.addEventListener('dispose', () => {
        this.shaders.delete(material)
      })
    }
    if (!material.onBeforeCompile) {
      material.onBeforeCompile = fn
    } else {
      const previousFn = material.onBeforeCompile
      material.onBeforeCompile = (...args) => {
        previousFn(...args)
        fn(args[0])
      }
    }
  }

  updateUniforms() {
    const far = Math.min(this.camera.far, this.maxFar)
    const breaks = this.getExtendedBreaks()
    this.shaders.forEach((shader, material) => {
      if (shader !== null) {
        const uniforms = shader.uniforms
        uniforms.CSM_cascades.value = breaks
        uniforms.cameraNear.value = Math.min(this.maxFar, this.camera.near)
        uniforms.shadowFar.value = far
      }
      let definesChanged = false
      const fadeValue = this.fade ? '1' : '0'
      if (material.defines.CSM_FADE !== fadeValue) {
        material.defines.CSM_FADE = fadeValue
        definesChanged = true
      }
      if (material.defines.CSM_CASCADES !== this.cascades) {
        material.defines.CSM_CASCADES = this.cascades
        definesChanged = true
      }
      if (definesChanged) {
        material.needsUpdate = true
      }
    })
  }

  getExtendedBreaks() {
    const target = []
    for (let i = 0; i < this.maxCascades; i++) {
      const amount = this.breaks[i] || 0
      const prev = this.breaks[i - 1] || 0
      target.push(new three.Vector2(prev, amount))
    }
    if (this.noLastCascadeCutOff) {
      target[this.breaks.length - 1].y = Infinity
    }
    return target
  }

  updateFrustums() {
    this.updateBreaks()
    this.initCascades()
    this.updateShadowBounds()
    this.updateUniforms()
  }

  updateCascades(cascades) {
    this.cascades = cascades
    for (const light of this.lights) {
      this.parent.remove(light)
      light.dispose()
    }
    this.lights.length = 0
    this.createLights()
    this.injectInclude()
    this.updateFrustums()
  }

  updateShadowMapSize(size) {
    this.shadowMapSize = size
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i]
      light.shadow.mapSize.width = size
      light.shadow.mapSize.height = size
      if (light.shadow.map) {
        light.shadow.map.dispose()
        light.shadow.map = null
      }
    }
  }

  dispose() {
    this.shaders.forEach(function (shader, material) {
      delete material.onBeforeCompile
      delete material.defines.USE_CSM
      delete material.defines.CSM_CASCADES
      delete material.defines.CSM_FADE
      if (shader !== null) {
        delete shader.uniforms.CSM_cascades
        delete shader.uniforms.cameraNear
        delete shader.uniforms.shadowFar
      }
      material.needsUpdate = true
    })
    this.shaders.clear()
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i]
      this.parent.remove(light)
      light.dispose()
    }
  }
}
