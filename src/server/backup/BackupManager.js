import fs from 'fs-extra'
import path from 'path'
import { spawn } from 'child_process'
import zlib from 'zlib'
import crypto from 'crypto'

export class BackupManager {
  constructor(logger, { worldDir, backupDir = null, maxBackups = 30, retentionDays = 90 }) {
    this.logger = logger
    this.worldDir = worldDir
    this.backupDir = backupDir || path.join(worldDir, 'backups')
    this.maxBackups = maxBackups
    this.retentionDays = retentionDays
    this.isBackingUp = false
    this.lastBackup = null
    this.backupSchedule = null
  }

  async init() {
    await fs.ensureDir(this.backupDir)
    this.logger.info('[Backup] Manager initialized', { backupDir: this.backupDir })
  }

  async createBackup(label = '') {
    if (this.isBackingUp) {
      this.logger.warn('[Backup] Backup already in progress')
      return { success: false, error: 'Backup already in progress' }
    }

    this.isBackingUp = true
    const startTime = Date.now()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const backupId = `${timestamp}-${Date.now()}`
    const backupName = label ? `${backupId}_${label}` : backupId

    try {
      this.logger.info('[Backup] Starting backup', { backupId: backupName })

      const backupPath = path.join(this.backupDir, backupName)
      await fs.ensureDir(backupPath)

      const srcDb = path.join(this.worldDir, 'db.sqlite')
      const srcStorage = path.join(this.worldDir, 'storage.json')
      const srcCollections = path.join(this.worldDir, 'collections')
      const srcAssets = path.join(this.worldDir, 'assets')

      const backupStats = { files: 0, totalSize: 0 }

      if (await fs.pathExists(srcDb)) {
        const destDb = path.join(backupPath, 'db.sqlite')
        await fs.copy(srcDb, destDb)
        const stat = await fs.stat(destDb)
        backupStats.files++
        backupStats.totalSize += stat.size
      }

      if (await fs.pathExists(srcStorage)) {
        const destStorage = path.join(backupPath, 'storage.json')
        await fs.copy(srcStorage, destStorage)
        const stat = await fs.stat(destStorage)
        backupStats.files++
        backupStats.totalSize += stat.size
      }

      if (await fs.pathExists(srcCollections)) {
        const destCollections = path.join(backupPath, 'collections')
        await fs.copy(srcCollections, destCollections)
        const stat = await fs.stat(destCollections)
        backupStats.files++
        backupStats.totalSize += stat.size
      }

      if (await fs.pathExists(srcAssets)) {
        const destAssets = path.join(backupPath, 'assets')
        await fs.copy(srcAssets, destAssets)
        const stat = await fs.stat(destAssets)
        backupStats.files++
        backupStats.totalSize += stat.size
      }

      const manifest = {
        id: backupName,
        label,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        stats: backupStats,
        hash: await this.calculateBackupHash(backupPath),
      }

      await fs.writeJSON(path.join(backupPath, 'manifest.json'), manifest, { spaces: 2 })

      this.lastBackup = manifest
      await this.pruneOldBackups()

      this.logger.info('[Backup] Backup completed successfully', {
        backupId: backupName,
        duration: manifest.duration,
        files: backupStats.files,
        size: this.formatBytes(backupStats.totalSize),
      })

      return { success: true, backup: manifest }
    } catch (err) {
      this.logger.error('[Backup] Backup failed', { backupId: backupName, error: err.message })
      return { success: false, error: err.message }
    } finally {
      this.isBackingUp = false
    }
  }

  async restoreBackup(backupId) {
    if (this.isBackingUp) {
      this.logger.warn('[Backup] Restore blocked: backup in progress')
      return { success: false, error: 'Backup operation in progress' }
    }

    const startTime = Date.now()
    try {
      const backupPath = path.join(this.backupDir, backupId)

      if (!await fs.pathExists(backupPath)) {
        return { success: false, error: `Backup not found: ${backupId}` }
      }

      const manifestPath = path.join(backupPath, 'manifest.json')
      const manifest = await fs.readJSON(manifestPath)

      this.logger.info('[Backup] Starting restore', { backupId, timestamp: manifest.timestamp })

      const srcDb = path.join(backupPath, 'db.sqlite')
      const destDb = path.join(this.worldDir, 'db.sqlite')
      if (await fs.pathExists(srcDb)) {
        await fs.copy(srcDb, destDb, { overwrite: true })
      }

      const srcStorage = path.join(backupPath, 'storage.json')
      const destStorage = path.join(this.worldDir, 'storage.json')
      if (await fs.pathExists(srcStorage)) {
        await fs.copy(srcStorage, destStorage, { overwrite: true })
      }

      const srcCollections = path.join(backupPath, 'collections')
      const destCollections = path.join(this.worldDir, 'collections')
      if (await fs.pathExists(srcCollections)) {
        await fs.remove(destCollections)
        await fs.copy(srcCollections, destCollections)
      }

      const srcAssets = path.join(backupPath, 'assets')
      const destAssets = path.join(this.worldDir, 'assets')
      if (await fs.pathExists(srcAssets)) {
        await fs.remove(destAssets)
        await fs.copy(srcAssets, destAssets)
      }

      const duration = Date.now() - startTime
      this.logger.info('[Backup] Restore completed', { backupId, duration })

      return { success: true, backup: manifest, duration }
    } catch (err) {
      this.logger.error('[Backup] Restore failed', { backupId, error: err.message })
      return { success: false, error: err.message }
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir)
      const backups = []

      for (const file of files) {
        const manifestPath = path.join(this.backupDir, file, 'manifest.json')
        if (await fs.pathExists(manifestPath)) {
          const manifest = await fs.readJSON(manifestPath)
          backups.push(manifest)
        }
      }

      return backups.sort((a, b) => b.timestamp - a.timestamp)
    } catch (err) {
      this.logger.error('[Backup] Failed to list backups', { error: err.message })
      return []
    }
  }

  async deleteBackup(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId)
      await fs.remove(backupPath)
      this.logger.info('[Backup] Backup deleted', { backupId })
      return { success: true }
    } catch (err) {
      this.logger.error('[Backup] Failed to delete backup', { backupId, error: err.message })
      return { success: false, error: err.message }
    }
  }

  async pruneOldBackups() {
    try {
      const backups = await this.listBackups()

      const cutoffTime = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000
      const toDelete = backups.filter(b => b.timestamp < cutoffTime || backups.indexOf(b) >= this.maxBackups)

      for (const backup of toDelete) {
        await this.deleteBackup(backup.id)
        this.logger.info('[Backup] Pruned old backup', { backupId: backup.id })
      }
    } catch (err) {
      this.logger.error('[Backup] Prune failed', { error: err.message })
    }
  }

  scheduleBackups(intervalMinutes = 1440) {
    if (this.backupSchedule) clearInterval(this.backupSchedule)

    this.backupSchedule = setInterval(async () => {
      const result = await this.createBackup('scheduled')
      if (!result.success) {
        this.logger.warn('[Backup] Scheduled backup failed', { error: result.error })
      }
    }, intervalMinutes * 60 * 1000)

    this.logger.info('[Backup] Scheduled backups enabled', { intervalMinutes })
  }

  stopScheduling() {
    if (this.backupSchedule) {
      clearInterval(this.backupSchedule)
      this.backupSchedule = null
      this.logger.info('[Backup] Scheduled backups disabled')
    }
  }

  async calculateBackupHash(backupPath) {
    const hash = crypto.createHash('sha256')
    const files = await fs.readdir(backupPath, { recursive: true })

    for (const file of files) {
      const filePath = path.join(backupPath, file)
      const stat = await fs.stat(filePath)
      if (stat.isFile()) {
        const content = await fs.readFile(filePath)
        hash.update(content)
      }
    }

    return hash.digest('hex')
  }

  async verifyBackup(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId)
      const manifestPath = path.join(backupPath, 'manifest.json')

      if (!await fs.pathExists(manifestPath)) {
        return { valid: false, error: 'Manifest not found' }
      }

      const manifest = await fs.readJSON(manifestPath)
      const currentHash = await this.calculateBackupHash(backupPath)

      if (currentHash !== manifest.hash) {
        return { valid: false, error: 'Hash mismatch - backup may be corrupted' }
      }

      return { valid: true, hash: currentHash }
    } catch (err) {
      return { valid: false, error: err.message }
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}
