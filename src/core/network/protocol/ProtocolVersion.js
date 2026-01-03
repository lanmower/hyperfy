import { StructuredLogger } from '../../utils/logging/index.js'
import { ProtocolVersionMigrations } from './ProtocolVersionMigrations.js'

const logger = new StructuredLogger('ProtocolVersion')

export class ProtocolVersion {
  static VERSION = ProtocolVersionMigrations.VERSION
  static VERSIONS = ProtocolVersionMigrations.VERSIONS
  static MIGRATION_RULES = ProtocolVersionMigrations.MIGRATION_RULES

  static isSupported(version) {
    return version in this.VERSIONS
  }

  static getVersion(version) {
    return this.VERSIONS[version] || null
  }

  static getCurrent() {
    return this.VERSIONS[this.VERSION]
  }

  static canMigrate(fromVersion, toVersion) {
    return ProtocolVersionMigrations.canMigrate(fromVersion, toVersion)
  }

  static migrate(data, fromVersion, toVersion) {
    return ProtocolVersionMigrations.migrate(data, fromVersion, toVersion)
  }

  static validateBlueprintVersion(blueprint, requiredVersion = this.VERSION) {
    const version = blueprint.__version || 1
    if (!this.isSupported(version)) {
      logger.error('Unsupported blueprint version', { version, blueprint: blueprint.id })
      return { valid: false, error: `Unsupported blueprint version: ${version}` }
    }

    if (version > requiredVersion) {
      logger.warn('Blueprint version newer than protocol', {
        blueprintVersion: version,
        protocolVersion: requiredVersion,
      })
      return { valid: true, warning: 'Blueprint version newer than protocol' }
    }

    if (version < requiredVersion && !this.canMigrate(version, requiredVersion)) {
      return { valid: false, error: `Cannot migrate blueprint from v${version} to v${requiredVersion}` }
    }

    return { valid: true }
  }

  static validatePacketVersion(packet, requiredVersion = this.VERSION) {
    const version = packet.version || 1
    if (!this.isSupported(version)) {
      return { valid: false, error: `Unsupported packet version: ${version}` }
    }

    if (version > requiredVersion) {
      logger.warn('Packet version newer than protocol', { packetVersion: version, protocolVersion: requiredVersion })
      return { valid: true, warning: 'Packet version newer than protocol' }
    }

    return { valid: true }
  }

  static validateEntityVersion(entity, requiredVersion = this.VERSION) {
    const version = entity.__version || 1
    if (!this.isSupported(version)) {
      return { valid: false, error: `Unsupported entity version: ${version}` }
    }

    return { valid: true }
  }

  static validateSnapshotVersion(snapshot, requiredVersion = this.VERSION) {
    const version = snapshot.__version || 1
    if (!this.isSupported(version)) {
      return { valid: false, error: `Unsupported snapshot version: ${version}` }
    }

    return { valid: true }
  }

  static addVersionToBlueprint(blueprint) {
    return {
      ...blueprint,
      __version: this.VERSION,
      __created: new Date().toISOString(),
    }
  }

  static addVersionToEntity(entity) {
    return {
      ...entity,
      __version: this.VERSION,
    }
  }

  static addVersionToSnapshot(snapshot) {
    return {
      ...snapshot,
      __version: this.VERSION,
      __created: new Date().toISOString(),
    }
  }

  static getCompatibleVersions() {
    return Object.keys(this.VERSIONS).map(v => parseInt(v, 10))
  }

  static getVersionInfo(version) {
    return ProtocolVersionMigrations.getVersionInfo(version)
  }

  static getAllVersionInfo() {
    return ProtocolVersionMigrations.getAllVersionInfo()
  }
}

export class VersionedData {
  static createBlueprint(data) {
    return ProtocolVersion.addVersionToBlueprint(data)
  }

  static createEntity(data) {
    return ProtocolVersion.addVersionToEntity(data)
  }

  static createSnapshot(data) {
    return ProtocolVersion.addVersionToSnapshot(data)
  }

  static ensureVersion(data, requiredVersion = ProtocolVersion.VERSION) {
    if (data.__version === requiredVersion) {
      return data
    }

    if (!data.__version) {
      return { ...data, __version: requiredVersion }
    }

    if (ProtocolVersion.canMigrate(data.__version, requiredVersion)) {
      return ProtocolVersion.migrate(data, data.__version, requiredVersion)
    }

    throw new Error(`Cannot ensure version ${requiredVersion} for data with version ${data.__version}`)
  }
}
