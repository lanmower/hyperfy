export { Plugin } from './Plugin.js'
export { PluginManager, pluginManager } from './PluginManager.js'
export { PluginAPI, createPluginAPI } from './PluginAPI.js'
export { NetworkPlugin } from './NetworkPlugin.js'
export { InputPlugin } from './InputPlugin.js'
export { AssetPlugin } from './AssetPlugin.js'
export { RenderPlugin } from './RenderPlugin.js'

import { PluginManager } from './PluginManager.js'
import { PluginHooks, pluginHooks as defaultPluginHooks } from './PluginHooks.js'

export const pluginRegistry = new PluginManager()
export const pluginHooks = defaultPluginHooks
export { PluginRegistry } from './PluginRegistry.js'
export { PluginHooks } from './PluginHooks.js'
