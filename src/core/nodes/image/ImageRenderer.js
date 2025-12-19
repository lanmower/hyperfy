import * as THREE from '../../extras/three.js'
import CustomShaderMaterial from '../../libs/three-custom-shader-material/index.js'

export class ImageRenderer {
  constructor(imageNode) {
    this.node = imageNode
    this.n = 0
  }

  async build() {
    this.node.needsRebuild = false
    if (this.node.ctx.world.network.isServer) return
    if (!this.node._src) return
    const n = ++this.n
    let image = this.node.ctx.world.loader.get('image', this.node._src)
    if (!image) image = await this.node.ctx.world.loader.load('image', this.node._src)
    if (this.n !== n) return
    this.unbuild()
    const imgAspect = image.width / image.height
    let width = this.node._width
    let height = this.node._height
    if (width === null && height === null) {
      height = 0
      width = 0
    } else if (width !== null && height === null) {
      height = width / imgAspect
    } else if (height !== null && width === null) {
      width = height * imgAspect
    }
    const geoAspect = width / height
    this.node.texture = new THREE.Texture(image)
    this.node.texture.colorSpace = THREE.SRGBColorSpace
    this.node.texture.anisotropy = this.node.ctx.world.graphics.maxAnisotropy
    this.node.texture.needsUpdate = true
    if (this.node._width && this.node._height) {
      applyFit(this.node.texture, width, height, this.node._fit)
    }
    const geometry = new THREE.PlaneGeometry(width, height)
    applyPivot(geometry, width, height, this.node._pivot)
    const uniforms = {
      uMap: { value: this.node.texture },
      uImgAspect: { value: imgAspect },
      uGeoAspect: { value: geoAspect },
      uFit: { value: this.node._fit === 'cover' ? 1 : this.node._fit === 'contain' ? 2 : 0 },
      uColor: { value: new THREE.Color(this.node._color) },
      uTransparent: { value: this.node._color === 'transparent' ? 1.0 : 0.0 },
    }
    const material = new CustomShaderMaterial({
      baseMaterial: this.node._lit ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial,
      ...(this.node._lit ? { roughness: 1, metalness: 0 } : {}),
      side: this.node._doubleside ? THREE.DoubleSide : THREE.FrontSide,
      transparent: this.node._color === 'transparent',
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
        uniform float uFit;
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
    this.node.ctx.world.setupMaterial(material)
    this.node.mesh = new THREE.Mesh(geometry, material)
    this.node.mesh.castShadow = this.node._castShadow
    this.node.mesh.receiveShadow = this.node._receiveShadow
    this.node.mesh.matrixWorld.copy(this.node.matrixWorld)
    this.node.mesh.matrixAutoUpdate = false
    this.node.mesh.matrixWorldAutoUpdate = false
    this.node.ctx.world.stage.scene.add(this.node.mesh)
    this.node.sItem = {
      matrix: this.node.matrixWorld,
      geometry,
      material,
      getEntity: () => this.node.ctx.entity,
      node: this.node,
    }
    this.node.ctx.world.stage.octree.insert(this.node.sItem)
  }

  unbuild() {
    this.n++
    if (this.node.mesh) {
      this.node.ctx.world.stage.scene.remove(this.node.mesh)
      this.node.mesh.material.dispose()
      this.node.mesh.geometry.dispose()
      this.node.mesh = null
    }
    if (this.node.sItem) {
      this.node.ctx.world.stage.octree.remove(this.node.sItem)
      this.node.sItem = null
    }
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
