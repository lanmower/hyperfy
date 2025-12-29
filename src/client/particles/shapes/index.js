import { createPointShape } from './PointShape.js'
import { createSphereShape } from './SphereShape.js'
import { createHemisphereShape } from './HemisphereShape.js'
import { createConeShape } from './ConeShape.js'
import { createBoxShape } from './BoxShape.js'
import { createCircleShape } from './CircleShape.js'
import { createRectangleShape } from './RectangleShape.js'
import { ComponentLogger } from '../../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('shapes')

export function createShape(config) {
  const [type, ...args] = config
  switch (type) {
    case 'point':
      return createPointShape()
    case 'sphere':
      return createSphereShape(...args)
    case 'hemisphere':
      return createHemisphereShape(...args)
    case 'cone':
      return createConeShape(...args)
    case 'box':
      return createBoxShape(...args)
    case 'circle':
      return createCircleShape(...args)
    case 'rectangle':
      return createRectangleShape(...args)
    default:
      logger.warn('Unknown shape type, using point as fallback', { type })
      return createPointShape()
  }
}
