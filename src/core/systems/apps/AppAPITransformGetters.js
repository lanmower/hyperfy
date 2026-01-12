import * as THREE from '../../extras/three.js'
import { APIConfigBuilder } from '../../utils/api/index.js'

const b = new APIConfigBuilder('AppAPIConfig')

b.addGetter('matrixWorld', (apps, entity) => {
  const m = new THREE.Matrix4()
  const pos = entity.data?.position || [0, 0, 0]
  const quat = entity.data?.quaternion || [0, 0, 0, 1]
  const scale = entity.data?.scale || [1, 1, 1]
  m.compose(
    new THREE.Vector3(pos[0], pos[1], pos[2]),
    new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3]),
    new THREE.Vector3(scale[0], scale[1], scale[2])
  )
  return m
}, { defaultReturn: new THREE.Matrix4() })

b.addGetter('position', (apps, entity) => {
  const pos = entity.data?.position || [0, 0, 0]
  return new THREE.Vector3(pos[0], pos[1], pos[2])
}, { defaultReturn: new THREE.Vector3() })

b.addGetter('quaternion', (apps, entity) => {
  const quat = entity.data?.quaternion || [0, 0, 0, 1]
  return new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3])
}, { defaultReturn: new THREE.Quaternion() })

b.addGetter('scale', (apps, entity) => {
  const scale = entity.data?.scale || [1, 1, 1]
  return new THREE.Vector3(scale[0], scale[1], scale[2])
}, { defaultReturn: new THREE.Vector3(1, 1, 1) })

export { b as transformBuilder }
