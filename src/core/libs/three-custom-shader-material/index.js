export default class CustomShaderMaterial {
  constructor(props) {
    this.baseMaterial = props.baseMaterial
    this.uniforms = props.uniforms || {}
    this.vertexShader = props.vertexShader
    this.fragmentShader = props.fragmentShader
    this.roughness = props.roughness
    this.metalness = props.metalness
  }
}
