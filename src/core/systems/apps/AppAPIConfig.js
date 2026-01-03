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
  Object.assign(acc, builder)
  return acc
}, {})

export const AppAPIConfig = config
