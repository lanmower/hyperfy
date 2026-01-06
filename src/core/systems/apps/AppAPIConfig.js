import { instanceBuilder } from './AppAPIInstanceGetters.js'
import { transformBuilder } from './AppAPITransformGetters.js'
import { settersBuilder } from './AppAPISettersConfig.js'
import { eventsBuilder } from './AppAPIEvents.js'
import { nodeBuilder } from './AppAPINodeOps.js'

const builders = [
  instanceBuilder,
  transformBuilder,
  settersBuilder,
  eventsBuilder,
  nodeBuilder,
]

const config = builders.reduce((acc, builder) => {
  const built = builder.build()
  if (built.getters) Object.assign(acc.getters = acc.getters || {}, built.getters)
  if (built.setters) Object.assign(acc.setters = acc.setters || {}, built.setters)
  if (built.methods) Object.assign(acc.methods = acc.methods || {}, built.methods)
  return acc
}, { getters: {}, setters: {}, methods: {} })

export const AppAPIConfig = config
