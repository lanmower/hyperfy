export class ProtocolVersionMigrations {
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
