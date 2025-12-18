import * as THREE from '../../extras/three.js'

export function patchFogShader() {
  THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG


  vFogDepth = length( mvPosition );



#endif
`
}
