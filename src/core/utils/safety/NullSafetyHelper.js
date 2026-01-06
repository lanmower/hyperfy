export class NullSafetyHelper {
  static getBlueprint(entity) {
    return entity?.blueprint || null
  }

  static getBlueprintName(entity) {
    return entity?.blueprint?.name || null
  }

  static getBlueprintScript(entity) {
    return entity?.blueprint?.script || null
  }

  static getBlueprintModel(entity) {
    return entity?.blueprint?.model || null
  }

  static getBlueprintProps(entity) {
    return entity?.blueprint?.props || {}
  }

  static getBlueprintProp(entity, key, defaultValue) {
    return entity?.blueprint?.props?.[key] ?? defaultValue
  }

  static getBlueprintVersion(entity) {
    return entity?.blueprint?.version || '1.0.0'
  }

  static hasBlueprintScript(entity) {
    return !!entity?.blueprint?.script
  }

  static hasBlueprintModel(entity) {
    return !!entity?.blueprint?.model
  }

  static isBlueprintReady(entity) {
    return !!entity?.blueprint
  }

  static getEntityData(entity) {
    return entity?.data || {}
  }

  static getEntityId(entity) {
    return entity?.data?.id || null
  }

  static getEntityType(entity) {
    return entity?.data?.type || null
  }

  static getEntityPosition(entity) {
    return entity?.data?.position || [0, 0, 0]
  }

  static getEntityQuaternion(entity) {
    return entity?.data?.quaternion || [0, 0, 0, 1]
  }

  static getNodeProps(node) {
    return node?.props || {}
  }

  static getNodeName(node) {
    return node?.name || 'unknown'
  }

  static getNodeType(node) {
    return node?.type || null
  }

  static getNodeChildren(node) {
    return node?.children || []
  }

  static getSystemFromWorld(world, systemName) {
    return world?.systems?.get(systemName) || null
  }

  static validateBlueprint(blueprint) {
    if (!blueprint) return { valid: false, errors: ['Blueprint is null or undefined'] }

    const errors = []
    if (!blueprint.id) errors.push('Blueprint missing id')
    if (!blueprint.name) errors.push('Blueprint missing name')

    return {
      valid: !errors.length,
      errors,
    }
  }

  static validateEntity(entity) {
    if (!entity) return { valid: false, errors: ['Entity is null or undefined'] }

    const errors = []
    if (!entity.data?.id) errors.push('Entity missing data.id')
    if (!entity.data?.type) errors.push('Entity missing data.type')

    return {
      valid: !errors.length,
      errors,
    }
  }
}
