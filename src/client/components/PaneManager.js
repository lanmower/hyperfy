/**
 * Pane Manager
 * Manages sidebar pane definitions, state, and routing logic
 */

export class PaneManager {
  constructor(world) {
    this.world = world
    this.mainSectionPanes = ['prefs']
    this.worldSectionPanes = ['world', 'docs', 'apps', 'add']
    this.appSectionPanes = ['app', 'script', 'nodes', 'meta']
    this.allPanes = [...this.mainSectionPanes, ...this.worldSectionPanes, ...this.appSectionPanes, 'players']
  }

  getActivePaneDisplayName(pane) {
    const labels = {
      prefs: 'Preferences',
      world: 'World Settings',
      docs: 'Documentation',
      apps: 'Apps',
      add: 'Add Item',
      app: 'App Properties',
      script: 'Script Editor',
      nodes: 'Node Hierarchy',
      meta: 'Metadata',
      players: 'Players',
    }
    return labels[pane] || pane
  }

  getPaneIcon(pane) {
    return pane // Icons are handled by parent component
  }

  shouldShowMainSection() {
    return true
  }

  shouldShowWorldSection(isBuilder) {
    return isBuilder
  }

  shouldShowAppSection(app) {
    return !!app
  }

  isMainPane(pane) {
    return this.mainSectionPanes.includes(pane)
  }

  isWorldPane(pane) {
    return this.worldSectionPanes.includes(pane)
  }

  isAppPane(pane) {
    return this.appSectionPanes.includes(pane)
  }

  getPaneForSection(section) {
    if (section === 'main') return this.mainSectionPanes
    if (section === 'world') return this.worldSectionPanes
    if (section === 'app') return this.appSectionPanes
    return []
  }

  isValidPane(pane) {
    return this.allPanes.includes(pane)
  }
}
