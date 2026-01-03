import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ProtocolVersion')

export class ProtocolVersion {
  static VERSION = 1

  static VERSIONS = {
    1: {
      version: 1,
      releaseDate: '2024-01-01',
      blueprintFormat: 1,
      packetFormat: 1,
      entityFormat: 1,
      snapshotFormat: 1,
      changes: [
        'Initial protocol version',
        'MessagePack binary encoding',
        'Gzip compression for payloads',
        'Basic packet validation',
      ],
    },
  }

  static MIGRATION_RULES = {
    1: {
      blueprintFormat: { from: 1, to: 1, migrate: (data) => data },
      packetFormat: { from: 1, to: 1, migrate: (data) => data },
      entityFormat: { from: 1, to: 1, migrate: (data) => data },
      snapshotFormat: { from: 1, to: 1, migrate: (data) => data },
    },
  }

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
    if (fromVersion === toVersion) return true
    if (fromVersion > toVersion) return false

    for (let v = fromVersion; v < toVersion; v++) {
      if (!this.MIGRATION_RULES[v]) {
        return false
      }
    }

    return true
  }

  static migrate(data, fromVersion, toVersion) {
    if (fromVersion === toVersion) {
      return data
    }

    if (fromVersion > toVersion) {
      throw new Error(`Cannot migrate from v${fromVersion} to v${toVersion}`)
    }

    let current = data
    for (let v = fromVersion; v < toVersion; v++) {
      const rules = this.MIGRATION_RULES[v]
      if (!rules) {
        throw new Error(`No migration rules for v${v}`)
      }

      for (const [format, rule] of Object.entries(rules)) {
        if (current[format]) {
          current[format] = rule.migrate(current[format])
        }
      }
    }

    return current
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
    const versionData = this.VERSIONS[version]
    if (!versionData) return null

    return {
      version: versionData.version,
      releaseDate: versionData.releaseDate,
      formats: {
        blueprint: versionData.blueprintFormat,
        packet: versionData.packetFormat,
        entity: versionData.entityFormat,
        snapshot: versionData.snapshotFormat,
      },
      changes: versionData.changes,
      canMigrateTo: Object.keys(this.VERSIONS)
        .map(v => parseInt(v, 10))
        .filter(v => this.canMigrate(version, v)),
    }
  }

  static getAllVersionInfo() {
    return Object.keys(this.VERSIONS).map(v => this.getVersionInfo(parseInt(v, 10)))
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
