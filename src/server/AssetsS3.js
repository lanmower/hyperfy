import fs from 'fs-extra'
import path from 'path'
import { hashFile } from '../core/utils.js'
import { AssetsS3Upload } from './AssetsS3Upload.js'
import { AssetsS3Download } from './AssetsS3Download.js'

let S3Client

try {
  const s3Module = await import('@aws-sdk/client-s3')
  S3Client = s3Module.S3Client
} catch (error) {
  console.error('[AssetsS3] AWS SDK not available - S3 storage disabled')
}

export class AssetsS3 {
  constructor() {
    if (!S3Client) {
      throw new Error('AWS SDK is not installed. Install @aws-sdk/client-s3 to use S3 storage.')
    }

    const uri = process.env.ASSETS_S3_URI
    if (!uri) {
      throw new Error('ASSETS_S3_URI environment variable is required')
    }

    const config = this.parseURI(uri)
    this.bucketName = config.bucket
    this.prefix = config.prefix || 'assets/'

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    })

    this.uploader = new AssetsS3Upload(this.client, this.prefix)
    this.downloader = new AssetsS3Download(this.client, this.bucketName, this.prefix)
  }

  parseURI(uri) {
    try {
      if (!uri.startsWith('s3://')) {
        throw new Error('S3 URI must start with s3://')
      }

      const withoutProtocol = uri.slice(5)
      const credentialsMatch = withoutProtocol.match(/^([^:]+):([^@]+)@(.+)$/)
      if (!credentialsMatch) {
        throw new Error('Invalid S3 URI format')
      }

      const [, accessKeyId, secretAccessKey, rest] = credentialsMatch
      const parts = rest.split('/')
      const host = parts[0]
      const pathParts = parts.slice(1)

      let config = {
        accessKeyId,
        secretAccessKey,
        forcePathStyle: false,
      }

      if (host.includes('.amazonaws.com')) {
        const hostParts = host.split('.')
        const s3Index = hostParts.indexOf('s3')
        if (s3Index === -1) {
          throw new Error('Invalid S3 host: missing "s3" in hostname')
        }
        config.bucket = hostParts.slice(0, s3Index).join('.')
        config.region = hostParts[s3Index + 1] || 'us-east-1'
        config.prefix = pathParts.join('/')
        if (config.prefix && !config.prefix.endsWith('/')) {
          config.prefix += '/'
        }
      } else if (host.includes('.')) {
        config.endpoint = `https://${host}`
        config.bucket = pathParts[0]
        config.prefix = pathParts.slice(1).join('/') + (pathParts.length > 1 ? '/' : '')
        config.region = 'auto'
        config.forcePathStyle = true
      } else {
        config.bucket = host
        config.prefix = pathParts.join('/') + (pathParts.length > 0 ? '/' : '')
        config.region = 'us-east-1'
      }

      return config
    } catch (error) {
      throw new Error(`Failed to parse S3 URI: ${error.message}`)
    }
  }

  async init({ rootDir }) {
    console.log('[assets] initializing S3 storage')
    await this.downloader.init()

    const builtInDir = path.join(rootDir, 'src/world/assets')
    if (await fs.exists(builtInDir)) {
      await this.uploader.uploadDirectory(fs, path, builtInDir, builtInDir)
    }
  }

  async upload(file) {
    return await this.uploader.upload(file, hashFile)
  }

  async list() {
    return await this.downloader.list()
  }

  async delete(assetList) {
    return await this.downloader.delete(assetList)
  }
}
