// Consolidated: Re-export rate limit configuration from MasterConfig
import { MasterConfig } from './MasterConfig.js'

const whitelistedIPs = new Set([
  '127.0.0.1',
  '::1',
  'localhost',
])

const blacklistedIPs = new Set()

// Use MasterConfig.rateLimits as source of truth
export const RATE_LIMIT_PRESETS = MasterConfig.rateLimits

export function isWhitelisted(ip) {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }
  return whitelistedIPs.has(ip)
}

export function isBlacklisted(ip) {
  return blacklistedIPs.has(ip)
}

export function addToWhitelist(ip) {
  whitelistedIPs.add(ip)
  return true
}

export function removeFromWhitelist(ip) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return false
  }
  return whitelistedIPs.delete(ip)
}

export function addToBlacklist(ip) {
  blacklistedIPs.add(ip)
  return true
}

export function removeFromBlacklist(ip) {
  return blacklistedIPs.delete(ip)
}

export function getWhitelist() {
  return Array.from(whitelistedIPs)
}

export function getBlacklist() {
  return Array.from(blacklistedIPs)
}

export function getRateLimitConfig(endpoint) {
  return RATE_LIMIT_PRESETS[endpoint] || RATE_LIMIT_PRESETS.api
}
