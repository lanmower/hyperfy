export const PhysicsConstants = {
  SIMULATION: {
    GRAVITY: -9.81,
    FIXED_TIMESTEP: 1 / 60,
    TIME_SCALE: 1.0,
  },

  PLAYER: {
    MOVE_SPEED: 6,
    MOVE_ACCELERATION: 25,
    FRICTION: 0.85,
    AIR_RESISTANCE: 0.9,
    JUMP_FORCE: 5,
    GROUND_DAMPING: 0.5,
    SLIDE_FRICTION: 0.3,
    CLIMB_SPEED: 4,
    CLIMB_FRICTION: 0.95,
  },

  CAPSULE: {
    RADIUS: 0.3,
    HEIGHT: 1.8,
    CONTACT_OFFSET: 0.02,
    REST_OFFSET: 0.001,
  },

  COLLISION: {
    CONTACT_BUFFER_SIZE: 64,
    MAX_CONTACTS: 64,
    CONTACT_THRESHOLD: 0.01,
  },

  CONSTRAINTS: {
    POSITION_ITERATIONS: 3,
    VELOCITY_ITERATIONS: 1,
  },

  RAYCAST: {
    MAX_HITS: 10,
    BUFFER_SIZE: 64,
  },

  SHAPES: {
    BOX: 'box',
    SPHERE: 'sphere',
    CAPSULE: 'capsule',
    MESH: 'mesh',
    PLANE: 'plane',
  },

  BODY_TYPES: {
    STATIC: 'static',
    DYNAMIC: 'dynamic',
    KINEMATIC: 'kinematic',
  },

  LIMITS: {
    MAX_BODIES: 5000,
    MAX_SHAPES: 10000,
    MAX_CONSTRAINTS: 1000,
  },
}
