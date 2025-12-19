import PhysXModule from './physx-js-webidl.js'


let promise
export function loadPhysX() {
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const originalError = console.error
      const originalWarn = console.warn
      console.error = () => {}
      console.warn = () => {}

      Promise.resolve()
        .then(() => PhysXModule())
        .then(() => {
          console.error = originalError
          console.warn = originalWarn
          const version = PHYSX.PHYSICS_VERSION
          const allocator = new PHYSX.PxDefaultAllocator()
          const errorCb = new PHYSX.PxDefaultErrorCallback()
          const foundation = PHYSX.CreateFoundation(version, allocator, errorCb)
          resolve({ version, allocator, errorCb, foundation })
        })
        .catch(err => {
          console.error = originalError
          console.warn = originalWarn
          reject(err)
        })
    })
  }
  return promise
}
