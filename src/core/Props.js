// Unified property system - single source for all node properties

export const Props = {
  // Transform (common to all)
  position: { type: 'array', default: [0, 0, 0], onSet: 'updateTransform' },
  quaternion: { type: 'array', default: [0, 0, 0, 1], onSet: 'updateTransform' },
  scale: { type: 'array', default: [1, 1, 1], onSet: 'updateTransform' },

  // Visibility & Activation
  visible: { type: 'boolean', default: true },
  active: { type: 'boolean', default: true },

  // Mesh (Mesh node)
  type: { type: 'string', default: 'box' },
  width: { type: 'number', default: 1, onSet: 'updateGeometry' },
  height: { type: 'number', default: 1, onSet: 'updateGeometry' },
  depth: { type: 'number', default: 1, onSet: 'updateGeometry' },
  radius: { type: 'number', default: 0.5, onSet: 'updateGeometry' },
  linked: { type: 'boolean', default: false },
  castShadow: { type: 'boolean', default: true },
  receiveShadow: { type: 'boolean', default: true },

  // Material
  color: { type: 'string', default: '#ffffff' },
  metalness: { type: 'number', default: 0 },
  roughness: { type: 'number', default: 0.5 },
  emissive: { type: 'string', default: '#000000' },

  // Image (Image node)
  src: { type: 'string', default: null },
  fit: { type: 'string', default: 'contain' },
  pivot: { type: 'string', default: 'center' },
  lit: { type: 'boolean', default: false },
  doubleside: { type: 'boolean', default: false },

  // Video (Video node)
  screenId: { type: 'string', default: null },
  aspect: { type: 'number', default: 1 },

  // Audio & Spatial
  volume: { type: 'number', default: 1 },
  loop: { type: 'boolean', default: false },
  group: { type: 'string', default: 'sfx' },
  spatial: { type: 'boolean', default: false },
  distanceModel: { type: 'string', default: 'inverse' },
  refDistance: { type: 'number', default: 1 },
  maxDistance: { type: 'number', default: 100 },
  rolloffFactor: { type: 'number', default: 1 },
  coneInnerAngle: { type: 'number', default: 360 },
  coneOuterAngle: { type: 'number', default: 360 },
  coneOuterGain: { type: 'number', default: 0 },

  // Physics: RigidBody
  mass: { type: 'number', default: 1 },
  linearDamping: { type: 'number', default: 0 },
  angularDamping: { type: 'number', default: 0 },
  staticFriction: { type: 'number', default: 0.5 },
  dynamicFriction: { type: 'number', default: 0.5 },
  restitution: { type: 'number', default: 0 },
  tag: { type: 'any', default: null },
  trigger: { type: 'boolean', default: false },
  convex: { type: 'boolean', default: false },

  // Physics: Joint
  limitY: { type: 'number', default: null },
  limitZ: { type: 'number', default: null },
  limitMin: { type: 'number', default: null },
  limitMax: { type: 'number', default: null },
  limitStiffness: { type: 'number', default: null },
  limitDamping: { type: 'number', default: null },
  collide: { type: 'boolean', default: true },
  breakForce: { type: 'number', default: Infinity },
  breakTorque: { type: 'number', default: Infinity },

  // Physics: Controller
  // (inherits radius, height, visible, layer, tag)

  // UI: Base Container
  space: { type: 'string', default: 'world' },
  size: { type: 'number', default: 1 },
  res: { type: 'number', default: 1 },
  billboard: { type: 'string', default: 'none' },
  offset: { type: 'array', default: [0, 0, 0] },
  pointerEvents: { type: 'boolean', default: true },
  transparent: { type: 'boolean', default: false },

  // UI: Layout
  display: { type: 'string', default: 'flex' },
  flexDirection: { type: 'string', default: 'row' },
  justifyContent: { type: 'string', default: 'flex-start' },
  alignItems: { type: 'string', default: 'stretch' },
  alignContent: { type: 'string', default: 'flex-start' },
  flexWrap: { type: 'string', default: 'no-wrap' },
  gap: { type: 'number', default: 0 },

  // UI: Flex Item
  flexBasis: { type: 'any', default: 'auto' },
  flexGrow: { type: 'number', default: 0 },
  flexShrink: { type: 'number', default: 1 },

  // UI: View
  display: { type: 'string', default: 'flex' },
  absolute: { type: 'boolean', default: false },
  top: { type: 'number', default: null },
  right: { type: 'number', default: null },
  bottom: { type: 'number', default: null },
  left: { type: 'number', default: null },
  margin: { type: 'any', default: 0 },

  // UI: Styling
  backgroundColor: { type: 'string', default: 'transparent' },
  borderWidth: { type: 'number', default: 0 },
  borderColor: { type: 'string', default: 'transparent' },
  borderRadius: { type: 'number', default: 0 },
  padding: { type: 'any', default: 0 },

  // UI: Text
  value: { type: 'string', default: '' },
  fontSize: { type: 'number', default: 16 },
  lineHeight: { type: 'number', default: 1.2 },
  textAlign: { type: 'string', default: 'center' },
  fontFamily: { type: 'string', default: 'system-ui' },
  fontWeight: { type: 'any', default: 400 },

  // UI: Image
  objectFit: { type: 'string', default: 'contain' },

  // Animation (SkinnedMesh)
  // (inherits castShadow, receiveShadow)

  // Action
  label: { type: 'string', default: 'Interact' },
  distance: { type: 'number', default: 5 },
  duration: { type: 'number', default: 0.3 },

  // Avatar
  emote: { type: 'string', default: null },

  // Sky
  bg: { type: 'string', default: null },
  hdr: { type: 'string', default: null },
  rotationY: { type: 'number', default: null },
  sunDirection: { type: 'array', default: null },
  sunIntensity: { type: 'number', default: null },
  sunColor: { type: 'string', default: null },
  fogNear: { type: 'number', default: null },
  fogFar: { type: 'number', default: null },
  fogColor: { type: 'string', default: null },

  // Particles
  emitting: { type: 'boolean', default: false },
  shape: { type: 'array', default: ['sphere', 0.1] },
  direction: { type: 'number', default: 0.5 },
  rate: { type: 'number', default: 100 },
  bursts: { type: 'array', default: [] },
  duration: { type: 'number', default: 5 },
  max: { type: 'number', default: 1000 },
  timescale: { type: 'number', default: 1 },
  life: { type: 'string', default: '5' },
  speed: { type: 'string', default: '5' },
  rotate: { type: 'string', default: '0' },
  image: { type: 'string', default: null },
  spritesheet: { type: 'array', default: null },
  blending: { type: 'string', default: 'normal' },
  force: { type: 'array', default: null },
  velocityLinear: { type: 'array', default: null },
  velocityOrbital: { type: 'array', default: null },
  velocityRadial: { type: 'number', default: null },
  rateOverDistance: { type: 'number', default: 0 },
  sizeOverLife: { type: 'string', default: null },
  rotateOverLife: { type: 'string', default: null },
  colorOverLife: { type: 'string', default: null },
  alphaOverLife: { type: 'string', default: null },
  emissiveOverLife: { type: 'string', default: null },

  // Nametag
  health: { type: 'number', default: 100 },

  // LOD
  scaleAware: { type: 'boolean', default: false },

  // Content
  url: { type: 'string', default: null },
  text: { type: 'string', default: '' },
  model: { type: 'string', default: null },

  // Metadata
  name: { type: 'string', default: 'Node' },
  description: { type: 'string', default: '' },
  layer: { type: 'string', default: 'default' },
  renderLayer: { type: 'number', default: 0 },
}

export function prop(key, override = {}) {
  const base = Props[key] || { type: 'any', default: null }
  return { ...base, ...override }
}

export function propSchema(keys) {
  const schema = {}
  for (const key of keys) {
    schema[key] = Props[key] || { type: 'any' }
  }
  return schema
}
