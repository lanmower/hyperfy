import { readJWT } from '../../core/utils/helpers/crypto.js'

export async function authMiddleware(req, reply) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return reply.code(401).send({ error: 'Authorization required' })
  }

  try {
    const decoded = await readJWT(token)
    req.user = decoded
    req.userId = decoded.userId
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

export async function adminOnlyMiddleware(req, reply) {
  const adminCode = req.headers['x-admin-code']
  const envAdminCode = process.env.ADMIN_CODE

  if (!envAdminCode || !adminCode || adminCode !== envAdminCode) {
    return reply.code(403).send({ error: 'Admin access required' })
  }
}
