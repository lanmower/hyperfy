import {
  AssetPlugin,
  InputPlugin,
  NetworkPlugin,
  Plugin,
  RenderPlugin
} from "./chunk-SLCAO7IU.js";
import {
  StructuredLogger
} from "./chunk-XO74L2WM.js";
import "./chunk-CZ2APHNW.js";

// src/core/plugins/examples/AIClientPlugin.js
var logger = new StructuredLogger("AIClientPlugin");
var AIClientPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "AIClient";
    this.version = "1.0.0";
    this.aiSystem = null;
    this.config = {
      provider: options.provider || "openai",
      model: options.model || "gpt-4",
      effort: options.effort || "normal"
    };
  }
  async init() {
    this.aiSystem = this.world.ai;
    if (!this.aiSystem) {
      logger.warn("AI system not available");
      return;
    }
    logger.info("AI client plugin initialized", { config: this.config });
  }
  async destroy() {
    this.aiSystem = null;
    logger.info("AI client plugin destroyed");
  }
  getAPI() {
    return {
      configure: (config) => {
        if (!this.enabled) return false;
        this.config = { ...this.config, ...config };
        if (this.aiSystem?.deserialize) {
          this.aiSystem.deserialize(this.config);
        }
        return true;
      },
      createEntity: async (prompt) => {
        if (!this.enabled || !this.aiSystem) return null;
        return this.aiSystem.create?.({ value: prompt }) || null;
      },
      editEntity: async (prompt) => {
        if (!this.enabled || !this.aiSystem) return null;
        return this.aiSystem.edit?.({ value: prompt }) || null;
      },
      fixEntity: async () => {
        if (!this.enabled || !this.aiSystem) return null;
        return this.aiSystem.fix?.() || null;
      },
      isEnabled: () => {
        return this.enabled && this.aiSystem?.enabled;
      },
      getConfig: () => {
        return { ...this.config };
      },
      getStatus: () => {
        return {
          enabled: this.enabled,
          aiEnabled: this.aiSystem?.enabled || false,
          provider: this.config.provider,
          model: this.config.model,
          effort: this.config.effort
        };
      }
    };
  }
};

// src/core/plugins/examples/InputHandlerPlugin.js
var logger2 = new StructuredLogger("InputHandlerPlugin");
var InputHandlerPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "InputHandler";
    this.version = "1.0.0";
    this.inputSystem = null;
  }
  async init() {
    this.inputSystem = this.world.controls || this.world.input;
    if (!this.inputSystem) {
      logger2.warn("Input system not available");
      return;
    }
    logger2.info("Input handler plugin initialized");
  }
  async destroy() {
    this.inputSystem = null;
    logger2.info("Input handler plugin destroyed");
  }
  getAPI() {
    return {
      registerKeyHandler: (key, handler) => {
        if (!this.enabled || !this.inputSystem) return false;
        return this.inputSystem.registerKeyHandler?.(key, handler) || false;
      },
      registerPointerHandler: (handler) => {
        if (!this.enabled || !this.inputSystem) return false;
        return this.inputSystem.registerPointerHandler?.(handler) || false;
      },
      registerTouchHandler: (handler) => {
        if (!this.enabled || !this.inputSystem) return false;
        return this.inputSystem.registerTouchHandler?.(handler) || false;
      },
      getInputState: () => {
        if (!this.enabled || !this.inputSystem) return {};
        return {
          keys: this.inputSystem.keys || {},
          pointer: this.inputSystem.pointer || {},
          touch: this.inputSystem.touch || {}
        };
      }
    };
  }
};

// src/core/plugins/examples/AssetLoaderPlugin.js
var logger3 = new StructuredLogger("AssetLoaderPlugin");
var AssetLoaderPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "AssetLoader";
    this.version = "1.0.0";
    this.loader = null;
    this.handlers = /* @__PURE__ */ new Map();
  }
  async init() {
    this.loader = this.world.loader;
    if (!this.loader) {
      logger3.warn("Loader system not available");
      return;
    }
    logger3.info("Asset loader plugin initialized");
  }
  async destroy() {
    this.handlers.clear();
    this.loader = null;
    logger3.info("Asset loader plugin destroyed");
  }
  registerAssetHandler(type, handler) {
    if (!this.enabled || !this.loader) return false;
    this.handlers.set(type, handler);
    return true;
  }
  getAPI() {
    return {
      load: async (type, url) => {
        if (!this.enabled || !this.loader) return null;
        return this.loader.load(type, url);
      },
      loadGLTF: async (url) => {
        if (!this.enabled || !this.loader) return null;
        return this.loader.load("glb", url);
      },
      loadTexture: async (url) => {
        if (!this.enabled || !this.loader) return null;
        return this.loader.load("texture", url);
      },
      loadAudio: async (url) => {
        if (!this.enabled || !this.loader) return null;
        return this.loader.load("audio", url);
      },
      preload: (items) => {
        if (!this.enabled || !this.loader) return false;
        return this.loader.preload?.(items) || false;
      },
      getLoadingStatus: () => {
        if (!this.enabled || !this.loader) return { loaded: 0, total: 0 };
        return {
          loaded: this.loader.loaded || 0,
          total: this.loader.total || 0,
          progress: this.loader.progress || 0
        };
      },
      registerHandler: (type, handler) => {
        return this.registerAssetHandler(type, handler);
      }
    };
  }
};

// src/core/plugins/examples/NetworkTransportPlugin.js
var logger4 = new StructuredLogger("NetworkTransportPlugin");
var NetworkTransportPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "NetworkTransport";
    this.version = "1.0.0";
    this.networkSystem = null;
    this.messageHandlers = /* @__PURE__ */ new Map();
    this.config = {
      protocol: options.protocol || "websocket",
      url: options.url || null,
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1e3
    };
  }
  async init() {
    this.networkSystem = this.world.network || this.world.clientNetwork || this.world.serverNetwork;
    if (!this.networkSystem) {
      logger4.warn("Network system not available");
      return;
    }
    logger4.info("Network transport plugin initialized", { config: this.config });
  }
  async destroy() {
    this.messageHandlers.clear();
    this.networkSystem = null;
    logger4.info("Network transport plugin destroyed");
  }
  registerMessageHandler(messageType, handler) {
    if (!this.enabled || !this.networkSystem) return false;
    this.messageHandlers.set(messageType, handler);
    return true;
  }
  getAPI() {
    return {
      send: (message) => {
        if (!this.enabled || !this.networkSystem) return false;
        return this.networkSystem.send?.(message) || false;
      },
      broadcast: (message, exclude) => {
        if (!this.enabled || !this.networkSystem) return false;
        return this.networkSystem.broadcast?.(message, exclude) || false;
      },
      on: (event, callback) => {
        if (!this.enabled || !this.networkSystem) return null;
        return this.networkSystem.on?.(event, callback) || null;
      },
      off: (event, callback) => {
        if (!this.enabled || !this.networkSystem) return false;
        return this.networkSystem.off?.(event, callback) || false;
      },
      registerMessageHandler: (type, handler) => {
        return this.registerMessageHandler(type, handler);
      },
      getMessageHandler: (type) => {
        if (!this.enabled) return null;
        return this.messageHandlers.get(type) || null;
      },
      disconnect: () => {
        if (!this.enabled || !this.networkSystem) return false;
        return this.networkSystem.disconnect?.() || false;
      },
      isConnected: () => {
        if (!this.enabled || !this.networkSystem) return false;
        return this.networkSystem.connected || false;
      },
      getConnectionStats: () => {
        if (!this.enabled || !this.networkSystem) return null;
        return {
          connected: this.networkSystem.connected || false,
          latency: this.networkSystem.latency || 0,
          messagesSent: this.networkSystem.messagesSent || 0,
          messagesReceived: this.networkSystem.messagesReceived || 0,
          protocol: this.config.protocol,
          url: this.config.url
        };
      },
      getConfig: () => {
        return { ...this.config };
      },
      updateConfig: (newConfig) => {
        if (!this.enabled) return false;
        this.config = { ...this.config, ...newConfig };
        return true;
      }
    };
  }
};

// src/core/plugins/defaultPlugins.js
var DEFAULT_PLUGINS = [
  {
    name: "ai",
    plugin: AIClientPlugin,
    options: {
      provider: process.env.AI_PROVIDER || "openai",
      model: process.env.AI_MODEL || "gpt-4",
      effort: "normal"
    }
  },
  {
    name: "input",
    plugin: InputHandlerPlugin,
    options: {}
  },
  {
    name: "assets",
    plugin: AssetLoaderPlugin,
    options: {}
  },
  {
    name: "network",
    plugin: NetworkTransportPlugin,
    options: {
      protocol: "websocket",
      reconnectAttempts: 5,
      reconnectDelay: 1e3
    }
  },
  {
    name: "core-network",
    plugin: NetworkPlugin,
    options: {}
  },
  {
    name: "core-input",
    plugin: InputPlugin,
    options: {}
  },
  {
    name: "core-asset",
    plugin: AssetPlugin,
    options: {}
  },
  {
    name: "core-render",
    plugin: RenderPlugin,
    options: {}
  }
];
function createDefaultPlugins(world) {
  const plugins = [];
  for (const { name, plugin: PluginClass, options } of DEFAULT_PLUGINS) {
    const instance = new PluginClass(world, options);
    plugins.push({ name, plugin: instance });
  }
  return plugins;
}
function getPluginConfig(name) {
  return DEFAULT_PLUGINS.find((p) => p.name === name);
}
function getAllPluginNames() {
  return DEFAULT_PLUGINS.map((p) => p.name);
}
export {
  DEFAULT_PLUGINS,
  createDefaultPlugins,
  getAllPluginNames,
  getPluginConfig
};
