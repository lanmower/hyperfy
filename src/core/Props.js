// Unified property system for all node types - single source of truth for properties

const properties = {
  // Transform
  position: { type: 'vector3', default: [0, 0, 0] },
  quaternion: { type: 'quaternion', default: [0, 0, 0, 1] },
  scale: { type: 'vector3', default: [1, 1, 1] },
  rotation: { type: 'euler', default: [0, 0, 0] },

  // Visibility
  visible: { type: 'boolean', default: true },
  active: { type: 'boolean', default: true },

  // Mesh geometry
  type: { type: 'string', default: 'box' },
  width: { type: 'number', default: 1 },
  height: { type: 'number', default: 1 },
  depth: { type: 'number', default: 1 },
  radius: { type: 'number', default: 0.5 },
  widthSegments: { type: 'number', default: 1 },
  heightSegments: { type: 'number', default: 1 },
  linked: { type: 'string', default: null },
  castShadow: { type: 'boolean', default: true },
  receiveShadow: { type: 'boolean', default: true },

  // Material
  color: { type: 'color', default: '#ffffff' },
  metalness: { type: 'number', default: 0 },
  roughness: { type: 'number', default: 1 },
  emissive: { type: 'color', default: '#000000' },
  opacity: { type: 'number', default: 1 },
  transparent: { type: 'boolean', default: false },

  // Image/Video
  src: { type: 'string', default: null },
  fit: { type: 'string', default: 'cover' },
  pivot: { type: 'string', default: 'center' },
  screenId: { type: 'string', default: null },
  aspect: { type: 'number', default: null },

  // Audio
  volume: { type: 'number', default: 1 },
  loop: { type: 'boolean', default: false },
  group: { type: 'string', default: 'default' },
  spatial: { type: 'boolean', default: false },
  distanceModel: { type: 'string', default: 'inverse' },
  refDistance: { type: 'number', default: 1 },
  maxDistance: { type: 'number', default: 10000 },
  rolloffFactor: { type: 'number', default: 1 },
  coneInnerAngle: { type: 'number', default: 360 },
  coneOuterAngle: { type: 'number', default: 0 },
  coneOuterGain: { type: 'number', default: 0 },

  // Physics RigidBody
  mass: { type: 'number', default: 1 },
  damping: { type: 'number', default: 0.04 },
  angularDamping: { type: 'number', default: 0.04 },
  friction: { type: 'number', default: 0.3 },
  restitution: { type: 'number', default: 0.3 },
  tag: { type: 'string', default: null },
  trigger: { type: 'boolean', default: false },
  convex: { type: 'boolean', default: true },

  // Physics Joint
  limits: { type: 'vector3', default: [0, 0, 0] },
  stiffness: { type: 'number', default: 1 },
  joint_damping: { type: 'number', default: 0.01 },
  collide: { type: 'boolean', default: false },
  breakForce: { type: 'number', default: Infinity },
  breakTorque: { type: 'number', default: Infinity },

  // UI Layout
  display: { type: 'string', default: 'flex' },
  flexDirection: { type: 'string', default: 'row' },
  justifyContent: { type: 'string', default: 'flex-start' },
  alignItems: { type: 'string', default: 'stretch' },
  gap: { type: 'number', default: 0 },
  flexBasis: { type: 'string', default: 'auto' },
  flexGrow: { type: 'number', default: 0 },
  flexShrink: { type: 'number', default: 1 },

  // UI View positioning
  absolute: { type: 'boolean', default: false },
  top: { type: 'string', default: 'auto' },
  right: { type: 'string', default: 'auto' },
  bottom: { type: 'string', default: 'auto' },
  left: { type: 'string', default: 'auto' },
  margin: { type: 'string', default: '0' },
  padding: { type: 'string', default: '0' },

  // UI Styling
  backgroundColor: { type: 'color', default: 'transparent' },
  borderWidth: { type: 'number', default: 0 },
  borderColor: { type: 'color', default: '#000000' },
  borderRadius: { type: 'number', default: 0 },

  // UI Text
  value: { type: 'string', default: '' },
  fontSize: { type: 'number', default: 16 },
  lineHeight: { type: 'number', default: 1.2 },
  textAlign: { type: 'string', default: 'left' },
  fontFamily: { type: 'string', default: 'system-ui' },
  fontWeight: { type: 'string', default: '400' },
  textColor: { type: 'color', default: '#000000' },

  // Animation
  life: { type: 'number', default: 1 },
  speed: { type: 'number', default: 1 },
  rotate: { type: 'boolean', default: false },
  blending: { type: 'string', default: 'normal' },

  // Particles
  emitting: { type: 'boolean', default: true },
  shape: { type: 'string', default: 'sphere' },
  direction: { type: 'vector3', default: [0, 1, 0] },
  rate: { type: 'number', default: 100 },
  bursts: { type: 'array', default: [] },
  duration: { type: 'number', default: 1 },
  max: { type: 'number', default: 100 },
  velocityLinear: { type: 'vector3', default: [0, 0, 0] },
  velocityOrbital: { type: 'vector3', default: [0, 0, 0] },
  colorOverLife: { type: 'string', default: null },
  alphaOverLife: { type: 'string', default: null },

  // Nametag
  health: { type: 'number', default: 100 },

  // LOD
  scaleAware: { type: 'boolean', default: false },

  // Sky/Environment
  bg: { type: 'string', default: null },
  hdr: { type: 'string', default: null },
  rotationY: { type: 'number', default: 0 },
  sunDirection: { type: 'vector3', default: [1, 1, 1] },
  sunIntensity: { type: 'number', default: 1 },
  fogNear: { type: 'number', default: 0 },
  fogFar: { type: 'number', default: 1000 },
  fogColor: { type: 'color', default: '#cccccc' },

  // Content
  url: { type: 'string', default: null },
  text: { type: 'string', default: null },
  model: { type: 'string', default: null },

  // Metadata
  name: { type: 'string', default: '' },
  description: { type: 'string', default: '' },
  layer: { type: 'number', default: 0 },
  renderLayer: { type: 'string', default: 'default' },
}

export class Props {
  static get(key) {
    return properties[key]
  }

  static all() {
    return { ...properties }
  }

  static schema(keys = null) {
    if (!keys) return properties
    const schema = {}
    for (const key of keys) {
      if (properties[key]) schema[key] = properties[key]
    }
    return schema
  }

  static validate(data, schema) {
    const result = {}
    for (const [key, config] of Object.entries(schema)) {
      result[key] = data[key] ?? config.default
    }
    return result
  }
}

export function prop(key, override = {}) {
  const base = properties[key] || { type: 'unknown', default: null }
  return { ...base, ...override }
}

export function propSchema(keys) {
  const schema = {}
  for (const key of keys) {
    if (properties[key]) schema[key] = properties[key]
  }
  return schema
}
