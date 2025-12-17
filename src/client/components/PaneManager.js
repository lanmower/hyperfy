
export class PaneManager {
  constructor(world) {
    this.world = world
    this.config = {
      main: { panes: ['prefs'] },
      world: { panes: ['world', 'docs', 'apps', 'add'], show: (ctx) => ctx.isBuilder },
      app: { panes: ['app', 'script', 'nodes', 'meta'], show: (ctx) => !!ctx.app },
      players: { panes: ['players'] },
    }
    this.labels = {
      prefs: 'Preferences', world: 'World Settings', docs: 'Documentation', apps: 'Apps',
      add: 'Add Item', app: 'App Properties', script: 'Script Editor',
      nodes: 'Node Hierarchy', meta: 'Metadata', players: 'Players',
    }
    this.mainSectionPanes = this.config.main.panes
    this.worldSectionPanes = this.config.world.panes
    this.appSectionPanes = this.config.app.panes
    this.allPanes = Object.values(this.config).flatMap(c => c.panes)
  }

  getActivePaneDisplayName(pane) {
    return this.labels[pane] || pane
  }

  getPaneIcon(pane) {
    return pane
  }

  shouldShowSection(section, context = {}) {
    const cfg = this.config[section]
    return cfg?.show ? cfg.show(context) : true
  }

  shouldShowMainSection() {
    return this.shouldShowSection('main')
  }

  shouldShowWorldSection(isBuilder) {
    return this.shouldShowSection('world', { isBuilder })
  }

  shouldShowAppSection(app) {
    return this.shouldShowSection('app', { app })
  }

  getPaneSection(pane) {
    for (const [section, cfg] of Object.entries(this.config)) {
      if (cfg.panes.includes(pane)) return section
    }
    return null
  }

  isMainPane(pane) {
    return this.getPaneSection(pane) === 'main'
  }

  isWorldPane(pane) {
    return this.getPaneSection(pane) === 'world'
  }

  isAppPane(pane) {
    return this.getPaneSection(pane) === 'app'
  }

  getPaneForSection(section) {
    return this.config[section]?.panes || []
  }

  isValidPane(pane) {
    return this.allPanes.includes(pane)
  }
}
