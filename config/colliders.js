export const ColliderPresets = {
  player: {
    type: 'capsule',
    radius: 0.4,
    halfHeight: 0.9,
    mass: 80,
    friction: 0.5,
    restitution: 0.0
  },

  crate: {
    type: 'box',
    halfExtents: [0.5, 0.5, 0.5],
    mass: 50,
    friction: 0.3,
    restitution: 0.2
  },

  obstacle: {
    type: 'box',
    halfExtents: [2, 2, 2],
    mass: 0,
    friction: 0.8,
    restitution: 0.0
  },

  grenade: {
    type: 'sphere',
    radius: 0.2,
    mass: 2,
    friction: 0.4,
    restitution: 0.8
  },

  trimesh_static: {
    type: 'trimesh',
    mass: 0,
    friction: 0.9,
    restitution: 0.0
  }
}

export function getCollider(preset) {
  if (typeof preset === 'string') {
    return ColliderPresets[preset]
  }
  return preset
}
