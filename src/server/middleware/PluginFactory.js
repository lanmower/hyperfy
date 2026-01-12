import fp from 'fastify-plugin'

export function createFastifyPlugin(hookFn, pluginName) {
  return fp(hookFn, {
    name: pluginName,
    fastify: '>=4.x',
  })
}
