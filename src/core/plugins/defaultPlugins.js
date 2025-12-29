import { AIClientPlugin } from './examples/AIClientPlugin.js'
import { InputHandlerPlugin } from './examples/InputHandlerPlugin.js'
import { AssetLoaderPlugin } from './examples/AssetLoaderPlugin.js'
import { NetworkTransportPlugin } from './examples/NetworkTransportPlugin.js'
import { NetworkPlugin } from './NetworkPlugin.js'
import { InputPlugin } from './InputPlugin.js'
import { AssetPlugin } from './AssetPlugin.js'
import { RenderPlugin } from './RenderPlugin.js'

export const DEFAULT_PLUGINS = [
  {
    name: 'ai',
    plugin: AIClientPlugin,
    options: {
      provider: process.env.AI_PROVIDER || 'openai',
      model: process.env.AI_MODEL || 'gpt-4',
      effort: 'normal'
    }
  },
  {
    name: 'input',
    plugin: InputHandlerPlugin,
    options: {}
  },
  {
    name: 'assets',
    plugin: AssetLoaderPlugin,
    options: {}
  },
  {
    name: 'network',
    plugin: NetworkTransportPlugin,
    options: {
      protocol: 'websocket',
      reconnectAttempts: 5,
      reconnectDelay: 1000
    }
  },
  {
    name: 'core-network',
    plugin: NetworkPlugin,
    options: {}
  },
  {
    name: 'core-input',
    plugin: InputPlugin,
    options: {}
  },
  {
    name: 'core-asset',
    plugin: AssetPlugin,
    options: {}
  },
  {
    name: 'core-render',
    plugin: RenderPlugin,
    options: {}
  }
]

export function createDefaultPlugins(world) {
  const plugins = []
  for (const { name, plugin: PluginClass, options } of DEFAULT_PLUGINS) {
    const instance = new PluginClass(world, options)
    plugins.push({ name, plugin: instance })
  }
  return plugins
}

export function getPluginConfig(name) {
  return DEFAULT_PLUGINS.find(p => p.name === name)
}

export function getAllPluginNames() {
  return DEFAULT_PLUGINS.map(p => p.name)
}
