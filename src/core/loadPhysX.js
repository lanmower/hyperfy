import PhysXModule from './physx-js-webidl.js'

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
          console.log('[loadPhysX] Starting PhysX module initialization')
          const moduleObj = {}
          console.log('[loadPhysX] Created moduleObj, calling PhysXModule factory')
          return PhysXModule(moduleObj).then(() => {
            console.log('[loadPhysX] PhysXModule factory returned, checking moduleObj contents')
            console.log('[loadPhysX] moduleObj keys:', Object.keys(moduleObj).length)
            return moduleObj
          })
        })
        .then(moduleObj => {
          if (originalError) console.error = originalError
          if (originalWarn) console.warn = originalWarn

          console.log('[loadPhysX] Setting globalThis.PHYSX with', Object.keys(moduleObj).length, 'properties')
          globalThis.PHYSX = moduleObj

          if (!globalThis.PHYSX) {
            throw new Error('globalThis.PHYSX was not set successfully')
          }

          if (!globalThis.PHYSX.PHYSICS_VERSION) {
            throw new Error('PHYSX.PHYSICS_VERSION is undefined - moduleObj not populated correctly. Available properties: ' + Object.keys(globalThis.PHYSX).slice(0, 10).join(', '))
          }

          console.log('[loadPhysX] PHYSICS_VERSION available:', globalThis.PHYSX.PHYSICS_VERSION)
          console.log('[loadPhysX] Creating allocator and error callback')

          const version = globalThis.PHYSX.PHYSICS_VERSION
          const allocator = new globalThis.PHYSX.PxDefaultAllocator()
          const errorCb = new globalThis.PHYSX.PxDefaultErrorCallback()

          console.log('[loadPhysX] Creating foundation')
          const foundation = globalThis.PHYSX.CreateFoundation(version, allocator, errorCb)

          if (!foundation) {
            throw new Error('Failed to create PhysX foundation')
          }

          console.log('[loadPhysX] PhysX initialization complete, returning module info')
          resolve({ version, allocator, errorCb, foundation })
        })
        .catch(err => {
          if (originalError) console.error = originalError
          if (originalWarn) console.warn = originalWarn
          console.error('[loadPhysX] CRITICAL ERROR during PhysX initialization:', err.message || err.toString())
          console.error('[loadPhysX] Error stack:', err.stack)
          console.error('[loadPhysX] Full error:', err)
          reject(err)
        })
    })
  }
  return promise
}
