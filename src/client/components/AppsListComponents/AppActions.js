export class AppActions {
  constructor(world, network, blueprints, entityTargeting, setRefresh) {
    this.world = world
    this.network = network
    this.blueprints = blueprints
    this.entityTargeting = entityTargeting
    this.setRefresh = setRefresh
  }

  inspect(item) {
    const entity = this.entityTargeting.getClosest(item)
    this.world.ui.setApp(entity)
  }

  toggle(item) {
    const blueprint = this.blueprints.get(item.blueprint.id)
    const version = blueprint.version + 1
    const disabled = !blueprint.disabled
    this.blueprints.modify({ id: blueprint.id, version, disabled })
    this.network.send('blueprintModified', { id: blueprint.id, version, disabled })
    this.setRefresh(n => n + 1)
  }
}
