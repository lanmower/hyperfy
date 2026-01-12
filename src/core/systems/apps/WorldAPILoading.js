import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'

const b = new APIConfigBuilder('WorldAPILoading')

b.config.methods.load = (apps, entity, type, url) => {
  return new Promise(async (resolve, reject) => {
    try {
      ValidationHelper.assertIsString(type, 'type', { operation: 'load' })
      ValidationHelper.assertIsString(url, 'url', { operation: 'load' })

      const hook = entity.getDeadHook()
      const allowLoaders = ['avatar', 'model']

      if (!allowLoaders.includes(type)) {
        return reject(
          new HyperfyError('OPERATION_NOT_SUPPORTED', `cannot load type: ${type}`, {
            operation: 'load',
            type,
          })
        )
      }

      if (!apps?.world?.loader) {
        return reject(
          new HyperfyError('INVALID_STATE', 'Loader system not available', {
            operation: 'load',
            type,
          })
        )
      }

      let glb = apps.world.loader.get(type, url)
      if (!glb) {
        glb = await apps.world.loader.load(type, url)
      }

      if (hook.dead) return

      const root = glb.toNodes()
      resolve(type === 'avatar' ? root.children[0] : root)
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('OPERATION_NOT_SUPPORTED', err.message, { originalError: err.toString() })
      reject(hyperfyError)
    }
  })
}

export const WorldAPILoading = b.build()
