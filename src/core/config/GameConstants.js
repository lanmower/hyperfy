
export const GameConstants = {
  player: {
    healthMax: 100,
    defaultAvatar: 'asset://avatar.vrm',
    enteredAtTimestamp: true,
  },

  network: {
    saveInterval: 60, // seconds
    pingRate: 1, // seconds
    maxUploadSize: 52428800, // 50MB
  },

  physics: {
    gravity: -9.8,
    airDrag: 0.1,
    groundDrag: 0.3,
    jumpForce: 10,
    walkSpeed: 5,
    runSpeed: 10,
  },

  animation: {
    defaultMode: 'idle',
    modes: {
      idle: 0,
      walk: 1,
      run: 2,
      jump: 3,
      fall: 4,
    },
  },

  transform: {
    position: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
    minScale: 0.01,
    maxScale: 100,
  },

  controls: {
    defaultMode: 'first-person',
    modes: {
      'first-person': 'first-person',
      orbit: 'orbit',
      topdown: 'topdown',
    },
    priorities: {
      ui: 1000,
      builder: 900,
      controls: 800,
      other: 0,
    },
    sensitivity: {
      mouse: 0.1,
      gamepad: 0.8,
      touch: 0.05,
    },
  },

  ranks: {
    visitor: 0,
    builder: 10,
    admin: 20,
  },

  ui: {
    display: {
      flex: 'flex',
      none: 'none',
      block: 'block',
    },
    flexDirection: {
      row: 'row',
      column: 'column',
      rowReverse: 'row-reverse',
      columnReverse: 'column-reverse',
    },
    justifyContent: {
      flexStart: 'flex-start',
      flexEnd: 'flex-end',
      center: 'center',
      spaceBetween: 'space-between',
      spaceAround: 'space-around',
    },
    alignItems: {
      flexStart: 'flex-start',
      flexEnd: 'flex-end',
      center: 'center',
      stretch: 'stretch',
    },
  },

  graphics: {
    defaultPixelRatio: 1,
    maxAnisotropy: 16,
    shadowMapType: 'PCFSoftShadowMap',
    toneMapping: 'NoToneMapping',
    colorSpace: 'SRGBColorSpace',
  },

  assets: {
    defaultAvatar: 'asset://avatar.vrm',
    placeholderModel: 'asset://placeholder.glb',
  },

  timestamps: {
    sessionStart: null, // Set at runtime
    lastSave: null,
  },
}

export default GameConstants
