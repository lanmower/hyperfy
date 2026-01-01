import PhysXModule from './physx-js-webidl.js'
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('loadPhysX')
let promise
export function loadPhysX() {
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      let originalError, originalWarn
      try {
        originalError = console.error
        originalWarn = console.warn
        console.error = () => {}
        console.warn = () => {}
      } catch (e) {
        // Console functions may be read-only, just proceed without suppression
        originalError = null
        originalWarn = null
      }

      Promise.resolve()
        .then(() => {
          logger.info('Starting PhysX module initialization')
          const moduleObj = {}
          logger.info('Created moduleObj, calling PhysXModule factory')
          return PhysXModule(moduleObj).then(() => {
            logger.info('PhysXModule factory returned, checking moduleObj contents')
            logger.info('moduleObj keys', { count: Object.keys(moduleObj).length })
            return moduleObj
          })
        })
        .then(moduleObj => {
          if (originalError) console.error = originalError
          if (originalWarn) console.warn = originalWarn

          logger.info('Setting globalThis.PHYSX', { properties: Object.keys(moduleObj).length })
          globalThis.PHYSX = moduleObj

          if (!globalThis.PHYSX) {
            throw new Error('globalThis.PHYSX was not set successfully')
          }

          if (!globalThis.PHYSX.PHYSICS_VERSION) {
            throw new Error('PHYSX.PHYSICS_VERSION is undefined - moduleObj not populated correctly. Available properties: ' + Object.keys(globalThis.PHYSX).slice(0, 10).join(', '))
          }

          logger.info('PHYSICS_VERSION available', { version: globalThis.PHYSX.PHYSICS_VERSION })
          logger.info('Creating allocator and error callback')

          const version = globalThis.PHYSX.PHYSICS_VERSION
          const allocator = new globalThis.PHYSX.PxDefaultAllocator()
          const errorCb = new globalThis.PHYSX.PxDefaultErrorCallback()

          logger.info('Creating foundation')
          const foundation = globalThis.PHYSX.CreateFoundation(version, allocator, errorCb)

          if (!foundation) {
            throw new Error('Failed to create PhysX foundation')
          }

          logger.info('PhysX initialization complete, returning module info')
          resolve({ version, allocator, errorCb, foundation })
        })
        .catch(err => {
          if (originalError) console.error = originalError
          if (originalWarn) console.warn = originalWarn
          logger.error('CRITICAL ERROR during PhysX initialization', err)
          reject(err)
        })
    })
  }
  return promise
}
