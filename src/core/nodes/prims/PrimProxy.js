import { createSchemaProxy } from '../../patterns/SchemaProxyGenerator.js'

const primSchema = {
  type: { get: true, set: true },
  size: { get: true, set: true },
  color: { get: true, set: true },
  emissive: { get: true, set: true },
  emissiveIntensity: { get: true, set: true },
  metalness: { get: true, set: true },
  roughness: { get: true, set: true },
  opacity: { get: true, set: true },
  transparent: { get: true, set: true, deprecated: true },
  texture: { get: true, set: true },
  castShadow: { get: true, set: true },
  receiveShadow: { get: true, set: true },
  physics: { get: true, set: true },
  mass: { get: true, set: true },
  linearDamping: { get: true, set: true },
  angularDamping: { get: true, set: true },
  staticFriction: { get: true, set: true },
  dynamicFriction: { get: true, set: true },
  restitution: { get: true, set: true },
  layer: { get: true, set: true },
  trigger: { get: true, set: true },
  tag: { get: true, set: true },
  onContactStart: { get: true, set: true },
  onContactEnd: { get: true, set: true },
  onTriggerEnter: { get: true, set: true },
  onTriggerLeave: { get: true, set: true },
  doubleside: { get: true, set: true },
}

export function createPrimProxy(prim, nodeProxy) {
  const proxy = createSchemaProxy(prim, primSchema)
  Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(nodeProxy))
  return proxy
}
