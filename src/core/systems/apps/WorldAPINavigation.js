import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'

const b = new APIConfigBuilder('WorldAPINavigation')

b.addMethodDirect('open', (apps, entity, url, newWindow = false) => {
  ValidationHelper.assertNotNull(url, 'url', { operation: 'open' })
  ValidationHelper.assertIsString(url, 'url', { operation: 'open' })

  if (!apps?.world?.network?.isClient) {
    return
  }

  try {
    const resolvedUrl = apps.world.resolveURL(url)
    setTimeout(() => {
      if (newWindow) {
        window.open(resolvedUrl, '_blank')
      } else {
        window.location.href = resolvedUrl
      }
    }, 0)
  } catch (resolveErr) {
    throw new HyperfyError('OPERATION_NOT_SUPPORTED', `Failed to resolve URL: ${resolveErr.message}`, {
      operation: 'open',
      url,
    })
  }
}, {
  module: 'WorldAPIConfig',
  method: 'open',
})

b.addMethodDirect('getQueryParam', (apps, entity, key) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'getQueryParam' })

  if (typeof window === 'undefined') {
    throw new HyperfyError('OPERATION_NOT_SUPPORTED', 'getQueryParam() must be called in the browser', {
      operation: 'getQueryParam',
    })
  }

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(key)
}, {
  module: 'WorldAPIConfig',
  method: 'getQueryParam',
})

b.addMethodDirect('setQueryParam', (apps, entity, key, value) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'setQueryParam' })

  if (typeof window === 'undefined') {
    throw new HyperfyError('OPERATION_NOT_SUPPORTED', 'setQueryParam() must be called in the browser', {
      operation: 'setQueryParam',
    })
  }

  const urlParams = new URLSearchParams(window.location.search)
  if (value) {
    urlParams.set(key, value)
  } else {
    urlParams.delete(key)
  }

  const newUrl = window.location.pathname + '?' + urlParams.toString()
  window.history.replaceState({}, '', newUrl)
}, {
  module: 'WorldAPIConfig',
  method: 'setQueryParam',
})

export const WorldAPINavigation = b.build()
