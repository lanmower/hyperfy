/* Cascade shadow mapping configuration for PlayCanvas */

export const csmLevels = {
  none: {
    cascades: 1,
    shadowResolution: 1024,
    shadowDistance: 100,
    castShadow: false,
  },
  low: {
    cascades: 1,
    shadowResolution: 2048,
    shadowDistance: 200,
    castShadow: true,
  },
  med: {
    cascades: 3,
    shadowResolution: 1024,
    shadowDistance: 500,
    castShadow: true,
  },
  high: {
    cascades: 3,
    shadowResolution: 2048,
    shadowDistance: 500,
    castShadow: true,
  },
}
