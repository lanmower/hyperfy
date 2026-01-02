export function initHMRBridge(fastify) {
  if (process.env.NODE_ENV !== 'development') return

  if (process.send) {
    process.on('message', (msg) => {
      if (msg?.type === 'hotReload' && fastify?.hmr) {
        fastify.hmr.broadcast({
          type: 'file_change',
          file: msg.file || 'src/client/index.js'
        })
      }
    })
  }
}
