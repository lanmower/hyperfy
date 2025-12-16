// Cryptographic utilities

// ==================== Client (Browser) ====================
export async function hashFileClient(file) {
  const buf = await file.arrayBuffer()
  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  const hash = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hash
}

// ==================== Server (Node.js) ====================
export async function hashFileServer(file) {
  const nodeCrypto = await import('crypto')
  const hash = nodeCrypto.createHash('sha256')
  hash.update(file)
  return hash.digest('hex')
}

// Platform-agnostic wrapper
export const hashFile = typeof window !== 'undefined' ? hashFileClient : hashFileServer

// ==================== JWT (Server-only) ====================
let jwt = null

async function getJWT() {
  if (!jwt) {
    jwt = await import('jsonwebtoken')
  }
  return jwt.default
}

const jwtSecret = process.env.JWT_SECRET

export async function createJWT(data) {
  const jwtLib = await getJWT()
  return new Promise((resolve, reject) => {
    jwtLib.sign(data, jwtSecret, (err, token) => {
      if (err) return reject(err)
      resolve(token)
    })
  })
}

export async function readJWT(token) {
  const jwtLib = await getJWT()
  return new Promise((resolve) => {
    jwtLib.verify(token, jwtSecret, (err, data) => {
      resolve(err ? null : data)
    })
  })
}
