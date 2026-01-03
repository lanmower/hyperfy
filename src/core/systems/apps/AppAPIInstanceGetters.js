import { APIConfigBuilder } from '../../utils/api/index.js'

const b = new APIConfigBuilder('AppAPIConfig')

b.addGetter('instanceId', (apps, entity) => entity.data.id, { defaultReturn: null })
b.addGetter('version', (apps, entity) => entity.blueprint?.version, { defaultReturn: null })
b.addGetter('modelUrl', (apps, entity) => entity.blueprint?.model, { defaultReturn: null })
b.addGetter('state', (apps, entity) => entity.data.state, { defaultReturn: {} })
b.addGetter('props', (apps, entity) => entity.blueprint?.props || {}, { defaultReturn: {} })
b.addGetter('config', (apps, entity) => entity.blueprint?.props || {}, { defaultReturn: {} })
b.addGetter('keepActive', (apps, entity) => entity.keepActive, { defaultReturn: false })

export { b as instanceBuilder }
