export function createVideoMaterialProxy(parent) {
  return {
    get textureX() {
      return parent.mesh.material.uniforms.uOffset.value.x
    },
    set textureX(value) {
      parent.mesh.material.uniforms.uOffset.value.x = value
    },
    get textureY() {
      return parent.mesh.material.uniforms.uOffset.value.y
    },
    set textureY(value) {
      parent.mesh.material.uniforms.uOffset.value.y = value
    },
  }
}
