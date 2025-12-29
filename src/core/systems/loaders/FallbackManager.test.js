import { FallbackManager } from './FallbackManager.js'

const manager = new FallbackManager()

console.log('Testing FallbackManager...')

const modelFallback = manager.getFallback('model', 'missing-model.glb', new Error('File not found'))
console.log('Model fallback:', modelFallback.getStats())

const textureFallback = manager.getFallback('texture', 'missing-texture.png', new Error('404'))
console.log('Texture fallback:', textureFallback.name)

const audioFallback = manager.getFallback('audio', 'missing-audio.mp3', new Error('Decode failed'))
console.log('Audio fallback:', audioFallback.duration)

const scriptFallback = manager.getFallback('script', 'broken-script.js', new Error('Syntax error'))
console.log('Script fallback:', scriptFallback.isFallback)

const log = manager.getUsageLog()
console.log('Usage log:', log)

console.log('All tests passed!')
