const MB = 1024 * 1024

export const AvatarConfig = {
  limits: {
    maxFileSize: 10 * MB,
    maxTextureBytes: 32 * MB,
    maxTriangles: 100000,
    builderFileSize: 5 * MB,
    builderTextureBytes: 16 * MB,
    builderTriangles: 50000,
  },

  preview: {
    canvasWidth: 512,
    canvasHeight: 512,
    cameraFOV: 50,
    cameraDistance: 2.5,
    rotationSpeed: 0.01,
  },

  animation: {
    idleAnimationSpeed: 1.0,
    emoteAnimationSpeed: 1.2,
    transitionDuration: 0.3,
  },

  cache: {
    maxCachedAvatars: 50,
    cacheTTL: 3600000,
  },
}

export default AvatarConfig
