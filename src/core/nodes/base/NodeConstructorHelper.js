/* Node constructor boilerplate abstraction for 24 node types */
import { defineProps } from '../../utils/helpers/defineProperty.js'

export function initializeNode(instance, nodeName, propertySchema, defaultData, data) {
  instance.name = nodeName
  defineProps(instance, propertySchema, defaultData, data)
}
