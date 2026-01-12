export class AppActions {
  constructor(world, network, blueprints, entityTargeting, setRefresh) {
    this.world = world
    this.network = network
    this.blueprints = blueprints
    this.entityTargeting = entityTargeting
    this.setRefresh = setRefresh
  }

  inspect(item) {
    try {
      const entity = this.entityTargeting.getClosest(item)
      if (!entity) return
      this.world.ui.setApp(entity)
    } catch (e) {
      // Silently ignore inspection errors
    }
  }

  toggle(item) {
    const blueprint = this.blueprints.get(item.blueprint.id)
    const version = (parseInt(blueprint.version || 0, 10) + 1).toString()
    const disabled = !blueprint.disabled
    this.blueprints.modify({ id: blueprint.id, version, disabled })
    this.network.send('blueprintModified', { id: blueprint.id, version, disabled })
    this.setRefresh(n => n + 1)
  }
}
