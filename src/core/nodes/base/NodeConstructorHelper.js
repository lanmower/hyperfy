/* Node constructor boilerplate abstraction for 24 node types */

export function initializeNode(instance, nodeName, propertySchema, defaultData, data) {
  instance.name = nodeName
  const { defineProps } = await import('../../utils/helpers/defineProperty.js')
  defineProps(instance, propertySchema, defaultData, data)
}
