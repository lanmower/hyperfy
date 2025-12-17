import { imageFits as fits, audioGroups as groups, distanceModels, pivots } from '../../utils/collections/NodeConstants.js'
import { isBoolean, isNumber, isString } from 'lodash-es'
import CustomShaderMaterial from '../libs/three-custom-shader-material/index.js'
import * as THREE from '../extras/three.js'

import { getRef, Node, secureRef } from './Node.js'
import { uuid } from '../utils.js'
import { v, q } from '../utils/TempVectors.js'
import { defineProps, createPropertyProxy } from '../../utils/helpers/defineProperty.js'
import { schema } from '../../utils/validation/createNodeSchema.js'

const propertySchema = schema('screenId', 'src', 'linked', 'loop', 'visible', 'color', 'lit', 'doubleside', 'castShadow', 'receiveShadow', 'aspect', 'fit', 'width', 'height', 'pivot', 'volume', 'group', 'spatial', 'distanceModel', 'refDistance', 'maxDistance', 'rolloffFactor', 'coneInnerAngle', 'coneOuterAngle', 'coneOuterGain')
  .overrideAll({
    src: { onSet() { this._loading = true; this.needsRebuild = true; this.setDirty() } },
    linked: { onSet() { this.needsRebuild = true; this.setDirty() } },
    loop: { onSet(v) { if (this.instance) this.instance.loop = v } },
    visible: { onSet() { this.needsRebuild = true; this.setDirty() } },
    color: { onSet() { this.needsRebuild = true; this.setDirty() } },
    lit: { onSet() { this.needsRebuild = true; this.setDirty() } },
    doubleside: { onSet(v) { if (this.mesh) { this.mesh.material.side = v ? THREE.DoubleSide : THREE.FrontSide; this.mesh.material.needsUpdate = true } } },
    castShadow: { onSet(v) { if (this.mesh) this.mesh.castShadow = v } },
    receiveShadow: { onSet(v) { if (this.mesh) this.mesh.receiveShadow = v } },
    aspect: { onSet() { this.needsRebuild = true; this.setDirty() } },
    fit: { onSet() { this.needsRebuild = true; this.setDirty() } },
    width: { onSet() { this.needsRebuild = true; this.setDirty() } },
    height: { onSet() { this.needsRebuild = true; this.setDirty() } },
    pivot: { onSet() { this.needsRebuild = true; this.setDirty() } },
    volume: { onSet(v) { if (this.gain) this.gain.gain.value = v } },
    group: { onSet() { this.needsRebuild = true; this.setDirty() } },
    spatial: { onSet() { this.needsRebuild = true; this.setDirty() } },
    distanceModel: { onSet(v) { if (this.pannerNode) this.pannerNode.distanceModel = v } },
    refDistance: { onSet(v) { if (this.pannerNode) this.pannerNode.refDistance = v } },
    maxDistance: { onSet(v) { if (this.pannerNode) this.pannerNode.maxDistance = v } },
    rolloffFactor: { onSet(v) { if (this.pannerNode) this.pannerNode.rolloffFactor = v } },
    coneInnerAngle: { onSet(v) { if (this.pannerNode) this.pannerNode.coneInnerAngle = v } },
    coneOuterAngle: { onSet(v) { if (this.pannerNode) this.pannerNode.coneOuterAngle = v } },
    coneOuterGain: { onSet(v) { if (this.pannerNode) this.pannerNode.coneOuterGain = v } },
  })
  .build()

export class Video extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'video'

    defineProps(this, propertySchema, data)
    this._geometry = getRef(data.geometry)

    this.n = 0
    this._loading = true
  }

  async mount() {
    this.needsRebuild = false
    if (this.ctx.world.network.isServer) return
    this._loading = true

    const n = ++this.n

    let key = ''
    if (this._linked === true) {
      key += 'default'
    } else if (this._linked === false) {
      key += uuid()
    } else {
      key += this._linked
    }

    let screen
    if (this._screenId) {
      screen = this.ctx.world.livekit.registerScreenNode(this)
    }

    if (screen) {
      this.instance = screen
    } else if (this._src) {
      let factory = this.ctx.world.loader.get('video', this._src)
      if (!factory) factory = await this.ctx.world.loader.load('video', this._src)
      if (this.n !== n) return
      this.instance = factory.get(key)
    }

    if (this._visible) {
      let material
      let vidAspect = this.instance?.width / this.instance?.height || this._aspect
      const uniforms = {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uVidAspect: { value: vidAspect },
        uGeoAspect: { value: this._aspect },
        uFit: { value: this._fit === 'cover' ? 1 : this._fit === 'contain' ? 2 : 0 }, // 0 = none, 1 = cover, 2 = contain
        uColor: { value: new THREE.Color(this._color) },
        uOffset: { value: new THREE.Vector2(0, 0) },
      }
      material = new CustomShaderMaterial({
        baseMaterial: this._lit ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial,
        ...(this._lit ? { roughness: 1, metalness: 0 } : {}),
        side: this._doubleside ? THREE.DoubleSide : THREE.FrontSide,
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          uniform float uHasMap;
          uniform float uVidAspect;
          uniform float uGeoAspect;
          uniform float uFit; // 0 = none, 1 = cover, 2 = contain
          uniform vec3 uColor; 
          uniform vec2 uOffset;
          
          varying vec2 vUv;

          vec4 sRGBToLinear(vec4 color) {
            return vec4(pow(color.rgb, vec3(2.2)), color.a);
          }
          
          vec4 LinearToSRGB(vec4 color) {
              return vec4(pow(color.rgb, vec3(1.0 / 2.2)), color.a);
          }
          
          void main() {
            float aspect = uGeoAspect / uVidAspect;

            vec2 uv = vUv;

            uv = uv + uOffset;
            
            if (abs(uFit - 1.0) < 0.01) {
              uv = uv - 0.5;
              
              if (aspect > 1.0) {
                uv.y /= aspect;
              } else {
                uv.x *= aspect;
              }
              
              uv = uv + 0.5;
            }
            else if (abs(uFit - 2.0) < 0.01) {
              uv = uv - 0.5;
              
              if (aspect > 1.0) {
                uv.x *= aspect;
              } else {
                uv.y /= aspect;
              }
              
              uv = uv + 0.5;
            }

            vec2 uvClamped = clamp(uv, 0.0, 1.0);
            vec4 col = texture2D(uMap, uvClamped);

            if (uFit >= 1.5) {
              const float EPS = 0.005;
              bool outside = uv.x < -EPS || uv.x > 1.0 + EPS || uv.y < -EPS || uv.y > 1.0 + EPS;
              if (outside) {
                col = vec4(uColor, 1.0);
              }
            } 

            csm_DiffuseColor = sRGBToLinear(col);
          }
        `,
      })
      this.ctx.world.setupMaterial(material)

      let geometry
      if (this._geometry) {
        geometry = this._geometry
      }
      if (!this._geometry) {
        let width = this._width
        let height = this._height
        let preAspect = this._aspect
        if (width === null && height === null) {
          height = 0
          width = 0
        } else if (width !== null && height === null) {
          height = width / preAspect
        } else if (height !== null && width === null) {
          width = height * preAspect
        }
        geometry = new THREE.PlaneGeometry(width, height)
        geometry._oWidth = width
        geometry._oHeight = height
        applyPivot(geometry, width, height, this._pivot)
      }

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = this._castShadow
      this.mesh.receiveShadow = this._receiveShadow
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.mesh.matrixAutoUpdate = false
      this.mesh.matrixWorldAutoUpdate = false
      this.ctx.world.stage.scene.add(this.mesh)
      this.sItem = {
        matrix: this.matrixWorld,
        geometry,
        material,
        getEntity: () => this.ctx.entity,
        node: this,
      }
      this.ctx.world.stage.octree.insert(this.sItem)
    }

    if (!this.instance) return

    await this.instance.prepare
    if (this.n !== n) return

    this.instance.loop = this._loop

    this.gain = this.ctx.world.audio.ctx.createGain()
    this.gain.gain.value = this._volume
    this.gain.connect(this.ctx.world.audio.groupGains.music)
    if (this._spatial) {
      this.panner = this.ctx.world.audio.ctx.createPanner()
      this.panner.panningModel = 'HRTF'
      this.panner.distanceModel = this._distanceModel
      this.panner.refDistance = this._refDistance
      this.panner.maxDistance = this._maxDistance
      this.panner.rolloffFactor = this._rolloffFactor
      this.panner.coneInnerAngle = this._coneInnerAngle
      this.panner.coneOuterAngle = this._coneOuterAngle
      this.panner.coneOuterGain = this._coneOuterGain
      this.panner.connect(this.gain)
      this.instance.audio?.connect(this.panner)
      this.updatePannerPosition()
    } else {
      this.instance.audio?.connect(this.gain)
    }

    if (this._visible) {
      const geometry = this.mesh.geometry
      const material = this.mesh.material

      let vidAspect
      let geoAspect

      if (this._geometry) {
        vidAspect = this.instance.width / this.instance.height
        geoAspect = this._aspect
      }

      if (!this._geometry) {
        vidAspect = this.instance.width / this.instance.height
        let width = this._width
        let height = this._height
        if (width === null && height === null) {
          height = 0
          width = 0
        } else if (width !== null && height === null) {
          height = width / vidAspect
        } else if (height !== null && width === null) {
          width = height * vidAspect
        }
        if (geometry._oWidth !== width || geometry._oHeight !== height) {
          const newGeometry = new THREE.PlaneGeometry(width, height)
          applyPivot(newGeometry, width, height, this._pivot)
          this.mesh.geometry = newGeometry
          geometry.dispose()
        }
        geoAspect = width / height
      }

      material.color.set('white')
      material.uniforms.uVidAspect.value = vidAspect
      material.uniforms.uGeoAspect.value = geoAspect
      material.uniforms.uMap.value = this.instance.texture
      material.uniforms.uHasMap.value = 1
      material.needsUpdate = true

      this._loading = false
      this._onLoad?.()

      if (this.shouldPlay) {
        this.instance.play()
        this.shouldPlay = false
      }
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      if (this.mesh) {
        this.mesh.matrixWorld.copy(this.matrixWorld)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
      if (this.panner) {
        this.updatePannerPosition()
      }
    }
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    this.n++
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
    }
    if (this.instance) {
      if (this.panner) {
        this.instance.audio?.disconnect(this.panner)
      } else {
        this.instance.audio?.disconnect(this.gain)
      }
      this.panner = null
      this.gain = null
      this.instance.release()
      this.instance = null
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
    this.ctx.world.livekit.unregisterScreenNode(this)
  }

  updatePannerPosition() {
    const audio = this.ctx.world.audio
    const pos = v[0].setFromMatrixPosition(this.matrixWorld)
    const qua = q[0].setFromRotationMatrix(this.matrixWorld)
    const dir = v[1].set(0, 0, -1).applyQuaternion(qua)
    if (this.panner.positionX) {
      const endTime = audio.ctx.currentTime + audio.lastDelta
      this.panner.positionX.linearRampToValueAtTime(pos.x, endTime)
      this.panner.positionY.linearRampToValueAtTime(pos.y, endTime)
      this.panner.positionZ.linearRampToValueAtTime(pos.z, endTime)
      this.panner.orientationX.linearRampToValueAtTime(dir.x, endTime)
      this.panner.orientationY.linearRampToValueAtTime(dir.y, endTime)
      this.panner.orientationZ.linearRampToValueAtTime(dir.z, endTime)
    } else {
      this.panner.setPosition(pos.x, pos.y, pos.z)
      this.panner.setOrientation(dir.x, dir.y, dir.z)
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.copyProperties(source, propertySchema)
    this._geometry = source._geometry
    return this
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    this._geometry = getRef(value)
    this.needsRebuild = true
    this.setDirty()
  }

  get loading() {
    return this._loading
  }

  get duration() {
    return this.instance ? this.instance.duration : 0
  }

  get playing() {
    return this.instance ? this.instance.isPlaying : false
  }

  get time() {
    return this.instance ? this.instance.currentTime : 0
  }

  set time(value) {
    if (this.instance) {
      this.instance.currentTime = value
    }
  }

  get material() {
    if (!this._materialProxy) {
      const self = this
      this._materialProxy = {
        get textureX() {
          return self.mesh.material.uniforms.uOffset.value.x
        },
        set textureX(value) {
          self.mesh.material.uniforms.uOffset.value.x = value
        },
        get textureY() {
          return self.mesh.material.uniforms.uOffset.value.y
        },
        set textureY(value) {
          self.mesh.material.uniforms.uOffset.value.y = value
        },
      }
    }
    return this._materialProxy
  }

  set material(value) {
    throw new Error('[video] cannot set material')
  }

  get onLoad() {
    return this._onLoad
  }

  set onLoad(value) {
    this._onLoad = value
  }

  play(restartIfPlaying) {
    if (this.instance) {
      this.instance.play(restartIfPlaying)
    } else {
      this.shouldPlay = true
    }
  }

  pause() {
    this.instance?.pause()
  }

  stop() {
    this.instance?.stop()
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {
          play: this.play,
          pause: this.pause,
          stop: this.stop,
        },
        {
          loading: function() { return this.loading },
          duration: function() { return this.duration },
          playing: function() { return this.playing },
          time: { get: function() { return this.time }, set: function(v) { this.time = v } },
          material: { get: function() { return this.material }, set: function(v) { this.material = v } },
          onLoad: { get: function() { return this.onLoad }, set: function(v) { this.onLoad = v } },
        }
      )
    }
    return this.proxy
  }
}

function isDistanceModel(value) {
  return distanceModels.includes(value)
}

function isGroup(value) {
  return groups.includes(value)
}

function isFit(value) {
  return fits.includes(value)
}

function isPivot(value) {
  return pivots.includes(value)
}

function applyPivot(geometry, width, height, pivot) {
  if (pivot === 'center') return
  let offsetX = 0
  let offsetY = 0
  if (pivot.includes('left')) {
    offsetX = width / 2
  } else if (pivot.includes('right')) {
    offsetX = -width / 2
  }
  if (pivot.includes('top')) {
    offsetY = -height / 2
  } else if (pivot.includes('bottom')) {
    offsetY = height / 2
  }
  if (offsetX !== 0 || offsetY !== 0) {
    geometry.translate(offsetX, offsetY, 0)
  }
}
