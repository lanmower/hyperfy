import { Node } from './Node.js'
import * as THREE from '../extras/three.js'
import CustomShaderMaterial from '../libs/three-custom-shader-material/index.js'
import { defineProps, createPropertyProxy } from '../utils/defineProperty.js'
import { createImageSchema } from '../utils/createNodeSchema.js'

const propertySchema = createImageSchema()

export class Image extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'image'
    defineProps(this, propertySchema, defaults, data)

    this.n = 0
  }

  async mount() {
    this.build()
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.build()
      return
    }
    if (didMove) {
      if (this.mesh) {
        this.mesh.matrixWorld.copy(this.matrixWorld)
      }
    }
  }

  unmount() {
    this.unbuild()
  }

  async build() {
    this.needsRebuild = false
    if (this.ctx.world.network.isServer) return
    if (!this._src) return
    const n = ++this.n
    let image = this.ctx.world.loader.get('image', this._src)
    if (!image) image = await this.ctx.world.loader.load('image', this._src)
    if (this.n !== n) return
    this.unbuild()
    const imgAspect = image.width / image.height
    let width = this._width
    let height = this._height
    if (width === null && height === null) {
      height = 0
      width = 0
    } else if (width !== null && height === null) {
      height = width / imgAspect
    } else if (height !== null && width === null) {
      width = height * imgAspect
    }
    const geoAspect = width / height
    this.texture = new THREE.Texture(image)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.anisotropy = this.ctx.world.graphics.maxAnisotropy
    this.texture.needsUpdate = true
    if (this._width && this._height) {
      applyFit(this.texture, width, height, this._fit)
    }
    const geometry = new THREE.PlaneGeometry(width, height)
    applyPivot(geometry, width, height, this._pivot)
    const uniforms = {
      uMap: { value: this.texture },
      uImgAspect: { value: imgAspect },
      uGeoAspect: { value: geoAspect },
      uFit: { value: this._fit === 'cover' ? 1 : this._fit === 'contain' ? 2 : 0 }, // 0 = none, 1 = cover, 2 = contain
      uColor: { value: new THREE.Color(this._color) },
      uTransparent: { value: this._color === 'transparent' ? 1.0 : 0.0 },
    }
    const material = new CustomShaderMaterial({
      baseMaterial: this._lit ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial,
      ...(this._lit ? { roughness: 1, metalness: 0 } : {}),
      side: this._doubleside ? THREE.DoubleSide : THREE.FrontSide,
      transparent: this._color === 'transparent',
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uImgAspect;
        uniform float uGeoAspect;
        uniform float uFit; // 0 = none, 1 = cover, 2 = contain
        uniform vec3 uColor; 
        uniform float uTransparent;
        
        varying vec2 vUv;

        vec4 sRGBToLinear(vec4 color) {
          return vec4(pow(color.rgb, vec3(2.2)), color.a);
        }
        
        vec4 LinearToSRGB(vec4 color) {
            return vec4(pow(color.rgb, vec3(1.0 / 2.2)), color.a);
        }
        
        void main() {
          float aspect = uGeoAspect / uImgAspect;

          vec2 uv = vUv;
          
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
              col = uTransparent > 0.5 ? vec4(0.0, 0.0, 0.0, 0.0) : vec4(uColor, 1.0);
            }
          } 

          csm_DiffuseColor = col;
        }
      `,
    })
    this.ctx.world.setupMaterial(material)
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

  unbuild() {
    this.n++
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
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

function applyFit(texture, width, height, fit) {
  if (fit === 'none') return
  const containerAspect = width / height
  const imageAspect = texture.image.width / texture.image.height
  let scaleX = 1
  let scaleY = 1
  if (fit === 'contain') {
    if (imageAspect > containerAspect) {
      scaleY = containerAspect / imageAspect
      texture.offset.y = (1 - scaleY) / 2
    } else {
      scaleX = imageAspect / containerAspect
      texture.offset.x = (1 - scaleX) / 2
    }
  } else if (fit === 'cover') {
    if (imageAspect > containerAspect) {
      scaleX = containerAspect / imageAspect
      texture.offset.x = (1 - 1 / scaleX) / 2
      scaleX = 1 / scaleX
    } else {
      scaleY = imageAspect / containerAspect
      texture.offset.y = (1 - 1 / scaleY) / 2
      scaleY = 1 / scaleY
    }
  }
  texture.repeat.set(scaleX, scaleY)
  texture.needsUpdate = true
}
