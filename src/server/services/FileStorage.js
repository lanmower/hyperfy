// Abstract storage layer for file uploads with filesystem implementation

import fs from 'fs-extra'
import path from 'path'

export class FileStorage {
  constructor(storageDir, db) {
    this.storageDir = storageDir
    this.db = db
    fs.ensureDirSync(storageDir)
  }

  async store(hash, filename, buffer, metadata = {}) {
    const ext = path.extname(filename)
    const storedFilename = `${hash}${ext}`
    const filePath = path.join(this.storageDir, storedFilename)

    const exists = await fs.pathExists(filePath)
    if (!exists) {
      await fs.writeFile(filePath, buffer)
    }

    const record = {
      hash,
      filename,
      storedFilename,
      size: buffer.length,
      mimeType: metadata.mimeType || 'application/octet-stream',
      uploader: metadata.uploader || null,
      timestamp: Date.now(),
      stored: true,
      url: `/assets/${storedFilename}`
    }

    await this.saveRecord(record)
    return record
  }

  async retrieve(hash) {
    const record = await this.getRecord(hash)
    if (!record) return null

    const filePath = path.join(this.storageDir, record.storedFilename)
    const exists = await fs.pathExists(filePath)
    if (!exists) return null

    const buffer = await fs.readFile(filePath)
    return { buffer, record }
  }

  async exists(hash) {
    const record = await this.getRecord(hash)
    if (!record) return false

    const filePath = path.join(this.storageDir, record.storedFilename)
    return await fs.pathExists(filePath)
  }

  async delete(hash) {
    const record = await this.getRecord(hash)
    if (!record) return false

    const filePath = path.join(this.storageDir, record.storedFilename)
    await fs.remove(filePath)
    await this.deleteRecord(hash)
    return true
  }

  async getSize(hash) {
    const record = await this.getRecord(hash)
    if (!record) return 0
    return record.size
  }

  async listAll(options = {}) {
    const { limit = 100, offset = 0, uploader = null } = options
    return await this.listRecords({ limit, offset, uploader })
  }

  async saveRecord(record) {
    const exists = await this.db('files').where('hash', record.hash).first()
    if (exists) {
      await this.db('files').where('hash', record.hash).update({
        filename: record.filename,
        storedFilename: record.storedFilename,
        size: record.size,
        mimeType: record.mimeType,
        timestamp: record.timestamp,
        stored: record.stored ? 1 : 0,
        url: record.url
      })
    } else {
      await this.db('files').insert({
        hash: record.hash,
        filename: record.filename,
        storedFilename: record.storedFilename,
        size: record.size,
        mimeType: record.mimeType,
        uploader: record.uploader,
        timestamp: record.timestamp,
        stored: record.stored ? 1 : 0,
        url: record.url
      })
    }
  }

  async getRecord(hash) {
    const row = await this.db('files').where('hash', hash).first()
    if (!row) return null
    return {
      hash: row.hash,
      filename: row.filename,
      storedFilename: row.storedFilename,
      size: row.size,
      mimeType: row.mimeType,
      uploader: row.uploader,
      timestamp: row.timestamp,
      stored: row.stored === 1,
      url: row.url
    }
  }

  async deleteRecord(hash) {
    await this.db('files').where('hash', hash).delete()
  }

  async listRecords(options = {}) {
    const { limit = 100, offset = 0, uploader = null } = options
    let query = this.db('files')

    if (uploader) {
      query = query.where('uploader', uploader)
    }

    const rows = await query
    return rows.map(row => ({
      hash: row.hash,
      filename: row.filename,
      storedFilename: row.storedFilename,
      size: row.size,
      mimeType: row.mimeType,
      uploader: row.uploader,
      timestamp: row.timestamp,
      stored: row.stored === 1,
      url: row.url
    }))
  }

  getStats() {
    return this.listAll({ limit: 10000 }).then(files => {
      const totalSize = files.reduce((sum, f) => sum + f.size, 0)
      const uploaders = new Set(files.map(f => f.uploader).filter(Boolean))

      return {
        totalFiles: files.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        uniqueUploaders: uploaders.size,
        averageSize: files.length > 0 ? Math.round(totalSize / files.length) : 0
      }
    })
  }
}
