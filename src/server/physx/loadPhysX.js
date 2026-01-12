import PhysXModule from './physx-js-webidl.js'

/**
 * PhysX Loader
 *
 * This function is passed into world.init() providing a nodejs specific method for loading PhysX.
 * Currently we are using a fork of physx-js-webidl and a custom build, modifying `PhysXWasmBindings.cmake` to use:
 *
 * -s MODULARIZE=1
 * -s EXPORT_ES6=1
 * -s USE_ES6_IMPORT_META=1
 * -s EXPORT_NAME=PhysX
 * -s ENVIRONMENT=node
 *
 * Esbuild is also set up to copy over the .wasm file to the build directory so that it can be located
 *
 */
let promise
export async function loadPhysX() {
  if (!promise) {
    promise = new Promise(async resolve => {
      globalThis.PHYSX = await PhysXModule()
      const version = PHYSX.PHYSICS_VERSION
      const allocator = new PHYSX.PxDefaultAllocator()
      const errorCb = new PHYSX.PxDefaultErrorCallback()
      const foundation = PHYSX.CreateFoundation(version, allocator, errorCb)
      resolve({ version, allocator, errorCb, foundation })
    })
  }
  return promise
}
