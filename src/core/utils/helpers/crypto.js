
import { StructuredLogger } from '../logging/StructuredLogger.js'

const logger = new StructuredLogger('crypto')

export async function hashFileClient(file) {
  const buf = await file.arrayBuffer()
  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  const hash = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hash
}

export async function hashFileServer(file) {
  const cryptoName = 'crypto'
  const cryptoMod = await import(cryptoName)
  const hash = cryptoMod.createHash('sha256')
  hash.update(file)
  return hash.digest('hex')
}

export const hashFile = typeof window !== 'undefined' ? hashFileClient : hashFileServer

let jwt = null

async function getJWT() {
  if (!jwt) {
    const jwtName = 'jsonwebtoken'
    jwt = await import(jwtName)
  }
  return jwt.default
}

const jwtSecret = typeof process !== 'undefined' && process.env.JWT_SECRET
  ? process.env.JWT_SECRET
  : 'default-secret-key-INSECURE-change-in-production'

if (!jwtSecret || jwtSecret === 'default-secret-key-INSECURE-change-in-production') {
  logger.warn('JWT_SECRET not configured - using insecure default key')
}

export async function createJWT(data) {
  const jwtLib = await getJWT()
  if (!jwtSecret) throw new Error('JWT_SECRET not configured')
  return new Promise((resolve, reject) => {
    jwtLib.sign(data, jwtSecret, (err, token) => {
      if (err) return reject(err)
      resolve(token)
    })
  })
}

export async function readJWT(token) {
  const jwtLib = await getJWT()
  if (!jwtSecret) throw new Error('JWT_SECRET not configured')
  return new Promise((resolve, reject) => {
    jwtLib.verify(token, jwtSecret, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}
