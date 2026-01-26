// Fix: Use host-based URL construction for WS, API, and Assets (force reload v3)
import statics from '@fastify/static'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import * as Babel from '@babel/standalone'
import { generateETag } from '../performance/CachingStrategy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../../..')
const srcDir = path.join(rootDir, 'src')
const clientDir = path.join(srcDir, 'client')
const publicDir = path.join(clientDir, 'public')

async function transformCode(code, filepath) {
  if (!filepath.endsWith('.js') && !filepath.endsWith('.ts')) {
    console.debug(`[Transform] Skipping non-JS/TS file: ${filepath}`)
    return code
  }
  if (typeof code !== 'string') {
    console.debug(`[Transform] Code is not string for: ${filepath}`)
    return code
  }
  if (filepath.includes('node_modules')) {
    console.debug(`[Transform] Skipping node_modules: ${filepath}`)
    return code
  }

  console.log(`[Transform] Attempting transform for ${filepath} (${code.length} bytes)`)

  try {
    const result = Babel.transform(code, {
      presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
      filename: filepath,
      babelrc: false
    })
    if (!result || !result.code) {
      console.error(`[Transform] No result for ${filepath}`)
      return code
    }
    const wasTransformed = result.code !== code
    console.log(`[Transform] ${wasTransformed ? 'TRANSFORMED' : 'NO CHANGE'} ${filepath}`)
    return result.code
  } catch (err) {
    console.error(`[Transform ERROR] ${filepath}:`, err.message)
    console.error(err.stack)
    return code
  }
}

export async function registerStaticAssets(fastify, buildDir, assetsDir, world) {
  fastify.get('/debug-babel', async (req, reply) => {
    const hasBabel = typeof Babel !== 'undefined'
    const hasTransform = hasBabel && typeof Babel.transform === 'function'
    const testCode = 'function App() { return <div>test</div> }'

    let transformed = 'NO_TRANSFORM'
    let error = null

    if (hasTransform) {
      try {
        const result = Babel.transform(testCode, {
          presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
          filename: 'test.js',
          babelrc: false
        })
        transformed = result.code
      } catch (err) {
        error = err.message
      }
    }

    return reply.type('application/json').send({
      hasBabel,
      hasTransform,
      transformed,
      error
    })
  })

  fastify.get('/test-transform', async (req, reply) => {
    const testCode = 'function App() { return <div>test</div> }'
    try {
      const result = Babel.transform(testCode, {
        presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
        filename: 'test.js',
        babelrc: false
      })
      return reply.type('text/plain').send(`SUCCESS: ${result.code}`)
    } catch (err) {
      return reply.type('text/plain').send(`FAIL: ${err.message}`)
    }
  })

  fastify.get('/', async (req, reply) => {
    try {
      const buildId = Date.now().toString()
      const particlesPath = '/src/client/particles.js'
      let html = await fs.readFile(path.join(publicDir, 'index.html'), 'utf-8')
      html = html
        .replaceAll('{title}', 'Hyperfy')
        .replaceAll('{desc}', 'Hyperfy Virtual Worlds')
        .replaceAll('{url}', `${req.protocol}://${req.headers.host}`)
        .replaceAll('{image}', `${req.protocol}://${req.headers.host}/public/favicon.svg`)
        .replaceAll('{buildId}', buildId)
        .replaceAll('{particlesPath}', particlesPath)
      return reply.type('text/html').send(html)
    } catch (err) {
      fastify.logger.error(`Failed to serve index.html: ${err.message}`)
      return reply.code(500).send('Server error')
    }
  })

  fastify.get('/particles', async (req, reply) => {
    const filepath = path.join(clientDir, 'particles.js')
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      const transformed = await transformCode(code, filepath)
      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      return reply.code(404).send(`Not found: particles.js`)
    }
  })

  // Serve src/client files directly (buildless)
  fastify.get('/src/client/*', async (req, reply) => {
    let filepath = path.join(clientDir, req.params['*'])
    if (!await fs.pathExists(filepath) && filepath.endsWith('.js')) {
      const tsPath = filepath.replace(/\.js$/, '.ts')
      if (await fs.pathExists(tsPath)) {
        filepath = tsPath
      }
    }
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      let transformed = code

      // Force transform JSX files
      if ((filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.js') || filepath.endsWith('.jsx')) && !filepath.includes('node_modules')) {
        try {
          const result = Babel.transform(code, {
            presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
            filename: filepath,
            babelrc: false
          })
          if (result && result.code) {
            transformed = result.code
            console.log(`[CLIENT_ROUTE] Transformed ${filepath}`)
          } else {
            console.log(`[CLIENT_ROUTE] No result from Babel for ${filepath}`)
          }
        } catch (transformErr) {
          console.error(`[CLIENT_ROUTE] Transform error for ${filepath}:`, transformErr.message)
        }
      }

      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      fastify.logger.error(`[STATIC] Error serving ${filepath}: ${err.message}`)
      return reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Serve src/core files directly (buildless)
  fastify.get('/src/core/*', async (req, reply) => {
    let filepath = path.join(srcDir, 'core', req.params['*'])
    if (!await fs.pathExists(filepath) && filepath.endsWith('.js')) {
      const tsPath = filepath.replace(/\.js$/, '.ts')
      if (await fs.pathExists(tsPath)) {
        filepath = tsPath
      }
    }
    try {
      // Serve binary files (WASM) without text transformation
      if (filepath.endsWith('.wasm')) {
        const data = await fs.readFile(filepath)
        return reply.type('application/wasm').send(data)
      }
      const code = await fs.readFile(filepath, 'utf-8')
      if (code.includes('server/utils/errors')) {
        console.error(`[STATIC_ASSETS] WARNING: ${req.params['*']} imports from server/utils/errors`)
      }
      const transformed = await transformCode(code, filepath)
      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      return reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Serve node_modules files directly (buildless)
  fastify.get('/node_modules/*', async (req, reply) => {
    const filepath = path.join(rootDir, 'node_modules', req.params['*'])
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      const transformed = await transformCode(code, filepath)
      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      return reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Stub handler for server-only files accessed from client
  fastify.get('/src/server/*', async (req, reply) => {
    const path_str = req.params['*'];
    // Special handling for HyperfyError - return the actual core implementation
    if (path_str.includes('errors/HyperfyError')) {
      try {
        const coreHyperfyErrorPath = path.join(srcDir, 'core', 'utils', 'errors', 'HyperfyError.js');
        const code = await fs.readFile(coreHyperfyErrorPath, 'utf-8');
        const transformed = await transformCode(code, coreHyperfyErrorPath);
        return reply.type('application/javascript').send(transformed);
      } catch (err) {
        return reply.code(500).send('Error loading HyperfyError');
      }
    }
    if (path_str.includes('errors/index')) {
      return reply.type('application/javascript').send('export { HyperfyError } from "/src/server/utils/errors/HyperfyError.js"; export default {};')
    }
    return reply.type('application/javascript').send('export const SecurityConfig = {}; export default {};')
  })

  // Serve /assets/* static files
  await fastify.register(statics, {
    root: assetsDir,
    prefix: '/assets/',
    decorateReply: false,
    setHeaders: res => {
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString())
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }
    },
  })

  // Serve public/*.* static files (CSS, JS, images, etc) but only specific extensions
  await fastify.register(statics, {
    root: publicDir,
    prefix: '/public/',
    decorateReply: false,
    setHeaders: res => {
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }
    },
  })
}

export function registerEnvEndpoint(fastify) {
  fastify.get('/env.js', async (req, reply) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws'
    const httpProtocol = protocol === 'https' ? 'https' : 'http'
    const wsUrl = `${wsProtocol}://${host}/ws`
    const assetsUrl = `${httpProtocol}://${host}/assets`
    const apiUrl = `${httpProtocol}://${host}/api`

    const publicEnvs = {}
    for (const key in process.env) {
      if (key.startsWith('PUBLIC_')) {
        publicEnvs[key] = process.env[key]
      }
    }
    publicEnvs.PUBLIC_WS_URL = wsUrl
    publicEnvs.PUBLIC_API_URL = apiUrl
    publicEnvs.PUBLIC_ASSETS_URL = assetsUrl

    const envsCode = `window.env = ${JSON.stringify(publicEnvs)};`
    return reply.type('application/javascript').send(envsCode)
  })
}
