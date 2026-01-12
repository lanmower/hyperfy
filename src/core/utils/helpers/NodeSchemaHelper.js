import { createPropertyProxy } from './defineProperty.js'

export function createSchemaProxy(instance, propertySchema, customMethods = {}, customProperties = {}) {
  if (!instance.proxy) {
    instance.proxy = createPropertyProxy(instance, propertySchema, instance.proxyFactory.getProxy(), customMethods, customProperties)
  }
  return instance.proxy
}
