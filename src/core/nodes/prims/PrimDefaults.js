export const defaults = {
  type: 'box',
  size: null,
  color: '#ffffff',
  emissive: null,
  emissiveIntensity: 0,
  metalness: 0.2,
  roughness: 0.8,
  opacity: 1,
  texture: null,
  castShadow: true,
  receiveShadow: true,
  doubleside: false,
  physics: null,
  mass: 1,
  linearDamping: 0,
  angularDamping: 0.05,
  staticFriction: 0.6,
  dynamicFriction: 0.6,
  restitution: 0,
  layer: 'environment',
  trigger: false,
  tag: null,
  onContactStart: null,
  onContactEnd: null,
  onTriggerEnter: null,
  onTriggerLeave: null,
}

export const defaultSizes = {
  box: [1, 1, 1],
  sphere: [0.5],
  cylinder: [0.5, 0.5, 1],
  cone: [0.5, 1],
  torus: [0.4, 0.1],
  plane: [1, 1],
}

export const types = Object.keys(defaultSizes)
