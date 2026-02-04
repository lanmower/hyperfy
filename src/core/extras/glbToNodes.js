import { createNode } from './createNode.js'
import * as THREE from './three.js'
import { addWind } from './glb/WindShaderSetup.js'
import { setupSplatmap } from './glb/SplatmapSetup.js'

const groupTypes = ['Scene', 'Group', 'Object3D']

export function glbToNodes(glb, world) {
  function registerNode(name, data) {
    const node = createNode(name, data)
    return node
  }
  function parse(object3ds, parentNode) {
    for (const object3d of object3ds) {
      const props = object3d.userData || {}
      const isSkinnedMeshRoot = !!object3d.children.find(c => c.isSkinnedMesh)
      if (isSkinnedMeshRoot) {
        const node = registerNode('skinnedmesh', {
          id: object3d.name,
          object3d,
          animations: glb.animations,
          castShadow: props.castShadow,
          receiveShadow: props.receiveShadow,
          active: props.active,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
        })
        if (parentNode.name === 'lod' && props.maxDistance) {
          parentNode.insert(node, props.maxDistance)
        } else {
          parentNode.add(node)
        }
      }
      else if (props.node === 'snap') {
        const node = registerNode('snap', {
          id: object3d.name,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
        })
        parentNode.add(node)
        parse(object3d.children, node)
      }
      else if (props.node === 'lod') {
        const node = registerNode('lod', {
          id: object3d.name,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
          scaleAware: props.scaleAware,
        })
        parentNode.add(node)
        parse(object3d.children, node)
      }
      else if (props.node === 'rigidbody') {
        const node = registerNode('rigidbody', {
          id: object3d.name,
          type: props.type,
          mass: props.mass,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
        })
        parentNode.add(node)
        parse(object3d.children, node)
      }
      else if (props.node === 'collider' && object3d.isMesh) {
        const node = registerNode('collider', {
          id: object3d.name,
          type: 'geometry',
          geometry: object3d.geometry,
          convex: props.convex,
          trigger: props.trigger,
          layer: props.layer,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
        })
        parentNode.add(node)
        parse(object3d.children, node)
      }
      else if (object3d.type === 'Mesh') {
        if (props.exp_splatmap && !world.network.isServer) {
          setupSplatmap(object3d)
        }
        else if (object3d.material.userData.wind) {
          addWind(object3d, world)
        }
        const hasMorphTargets = object3d.morphTargetDictionary || object3d.morphTargetInfluences?.length > 0
        const node = registerNode('mesh', {
          id: object3d.name,
          type: 'geometry',
          geometry: object3d.geometry,
          material: object3d.material,
          linked: !hasMorphTargets && !object3d.material.transparent,
          castShadow: props.castShadow,
          receiveShadow: props.receiveShadow,
          visible: props.visible,
          active: props.active,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
        })
        if (parentNode.name === 'lod' && props.maxDistance) {
          parentNode.insert(node, props.maxDistance)
        } else {
          parentNode.add(node)
        }
        parse(object3d.children, node)
      }
      else if (object3d.type === 'SkinnedMesh') {
      }
      else if (groupTypes.includes(object3d.type)) {
        const node = registerNode('group', {
          id: object3d.name,
          position: object3d.position.toArray(),
          quaternion: object3d.quaternion.toArray(),
          scale: object3d.scale.toArray(),
        })
        parentNode.add(node)
        parse(object3d.children, node)
      }
    }
  }
  const root = registerNode('group', {
    id: '$root',
  })
  parse(glb.scene.children, root)
  return root
}
