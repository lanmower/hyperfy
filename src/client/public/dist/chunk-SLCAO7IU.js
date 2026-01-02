import {
  MessageHandler,
  StructuredLogger,
  isNumber_default,
  three_exports
} from "./chunk-XO74L2WM.js";

// src/core/plugins/Plugin.js
var logger = new StructuredLogger("Plugin");
var Plugin = class {
  constructor(world, options = {}) {
    this.world = world;
    this.options = options;
    this.enabled = true;
    this.name = this.constructor.name;
    this.version = "1.0.0";
  }
  async init() {
  }
  async destroy() {
  }
  enable() {
    this.enabled = true;
    logger.info(`Plugin enabled: ${this.name}`);
  }
  disable() {
    this.enabled = false;
    logger.info(`Plugin disabled: ${this.name}`);
  }
  getAPI() {
    return {};
  }
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      enabled: this.enabled,
      options: this.options
    };
  }
};

// src/core/plugins/NetworkPlugin.js
var logger2 = new StructuredLogger("NetworkPlugin");
var NetworkPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "Network";
    this.version = "1.0.0";
    this.system = null;
    this.messageHandler = MessageHandler;
  }
  async init() {
    this.system = this.world.network;
    if (!this.system) {
      logger2.warn("Network system not available");
      return;
    }
    logger2.info("Network plugin initialized");
  }
  async destroy() {
    this.system = null;
    logger2.info("Network plugin destroyed");
  }
  getAPI() {
    return {
      send: (name, data) => {
        if (!this.enabled || !this.system) return false;
        return this.system.send?.(name, data) || false;
      },
      on: (event, callback) => {
        if (!this.enabled || !this.system) return null;
        return this.system.on?.(event, callback) || null;
      },
      off: (event, callback) => {
        if (!this.enabled || !this.system) return false;
        return this.system.off?.(event, callback) || false;
      },
      connect: (options) => {
        if (!this.enabled || !this.system) return false;
        return this.system.connect?.(options) || false;
      },
      disconnect: () => {
        if (!this.enabled || !this.system) return false;
        return this.system.disconnect?.() || false;
      },
      isConnected: () => {
        if (!this.enabled || !this.system) return false;
        return this.system.connected || false;
      },
      upload: async (file) => {
        if (!this.enabled || !this.system) return false;
        return this.system.upload?.(file) || false;
      },
      encodeMessage: (name, data) => {
        if (!this.enabled) return null;
        try {
          return this.messageHandler.encode(name, data);
        } catch (err) {
          logger2.error("Message encode error", { name, error: err.message });
          return null;
        }
      },
      decodeMessage: (packet) => {
        if (!this.enabled) return [null, null];
        return this.messageHandler.decode(packet);
      },
      compressData: (data) => {
        if (!this.enabled || !this.system) return null;
        return this.system.compressor?.compress?.(data) || null;
      },
      decompressData: (payload) => {
        if (!this.enabled || !this.system) return null;
        return this.system.compressor?.decompress?.(payload) || null;
      },
      getStatus: () => {
        if (!this.enabled || !this.system) return null;
        return {
          connected: this.system.connected || false,
          id: this.system.id || null,
          offlineMode: this.system.offlineMode || false,
          isClient: this.system.isClient || false,
          isServer: this.system.isServer || false,
          compressionRatio: this.system.compressor?.getStats?.()?.ratio || "0%"
        };
      }
    };
  }
};

// src/core/utils/helpers/Helpers.js
var logger3 = new StructuredLogger("Helpers");
var RenderHelper = class {
  static createMaterial(options = {}) {
    let raw;
    if (options.raw) {
      raw = options.raw.clone();
      if (options.raw.onBeforeCompile) {
        raw.onBeforeCompile = options.raw.onBeforeCompile;
      }
    } else if (options.unlit) {
      raw = new three_exports.MeshBasicMaterial({
        color: options.color || "white"
      });
    } else {
      raw = new three_exports.MeshStandardMaterial({
        color: options.color || "white",
        metalness: isNumber_default(options.metalness) ? options.metalness : 0,
        roughness: isNumber_default(options.roughness) ? options.roughness : 1
      });
    }
    raw.shadowSide = three_exports.BackSide;
    return raw;
  }
  static cloneTextures(material) {
    const textures = [];
    if (material.map) {
      material.map = material.map.clone();
      textures.push(material.map);
    }
    if (material.emissiveMap) {
      material.emissiveMap = material.emissiveMap.clone();
      textures.push(material.emissiveMap);
    }
    if (material.normalMap) {
      material.normalMap = material.normalMap.clone();
      textures.push(material.normalMap);
    }
    if (material.bumpMap) {
      material.bumpMap = material.bumpMap.clone();
      textures.push(material.bumpMap);
    }
    if (material.roughnessMap) {
      material.roughnessMap = material.roughnessMap.clone();
      textures.push(material.roughnessMap);
    }
    if (material.metalnessMap) {
      material.metalnessMap = material.metalnessMap.clone();
      textures.push(material.metalnessMap);
    }
    return textures;
  }
  static setupSceneEnvironment(scene, options = {}) {
    if (options.background) {
      scene.background = options.background;
    }
    if (options.environment) {
      scene.environment = options.environment;
    }
    if (options.fog) {
      scene.fog = options.fog;
    }
    return scene;
  }
  static raycastFromCamera(raycaster, camera, viewport, mousePosition) {
    if (!viewport) {
      logger3.warn("Raycast: no viewport");
      return false;
    }
    const rect = viewport.getBoundingClientRect();
    const x = (mousePosition.x - rect.left) / rect.width * 2 - 1;
    const y = -((mousePosition.y - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new three_exports.Vector2(x, y), camera);
    return true;
  }
  static raycastFromCenter(raycaster, camera) {
    raycaster.setFromCamera(new three_exports.Vector2(0, 0), camera);
    return true;
  }
  static getSceneStats(scene) {
    let geometries = 0;
    let materials = 0;
    let textures = 0;
    let lines = 0;
    let points = 0;
    let triangles = 0;
    scene.traverse((obj) => {
      if (obj.geometry) geometries++;
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          materials += obj.material.length;
        } else {
          materials++;
        }
      }
      if (obj.geometry?.attributes?.position) {
        const count = obj.geometry.attributes.position.count;
        if (obj instanceof three_exports.LineSegments) lines += count;
        else if (obj instanceof three_exports.Points) points += count;
        else triangles += obj.geometry.index ? obj.geometry.index.count / 3 : count / 3;
      }
      if (obj.material?.map) textures++;
      if (obj.material?.normalMap) textures++;
      if (obj.material?.roughnessMap) textures++;
      if (obj.material?.metalnessMap) textures++;
    });
    return { geometries, materials, textures, lines, points, triangles };
  }
  static createGridHelper(size = 10, divisions = 10, color1 = 4473924, color2 = 8947848) {
    return new three_exports.GridHelper(size, divisions, color1, color2);
  }
  static createAxisHelper(size = 1) {
    return new three_exports.AxesHelper(size);
  }
  static addLighting(scene, options = {}) {
    const ambientIntensity = options.ambientIntensity || 0.5;
    const directionalIntensity = options.directionalIntensity || 1;
    const ambient = new three_exports.AmbientLight(16777215, ambientIntensity);
    scene.add(ambient);
    const directional = new three_exports.DirectionalLight(16777215, directionalIntensity);
    directional.position.set(5, 10, 7);
    directional.castShadow = true;
    scene.add(directional);
    return { ambient, directional };
  }
};
var InputHelper = class {
  static registerInput(control, eventType, handler, options = {}) {
    if (!control) {
      logger3.warn("registerInput called with null control");
      return null;
    }
    const listeners = control._listeners = control._listeners || {};
    if (!listeners[eventType]) {
      listeners[eventType] = [];
    }
    const listener = {
      handler,
      once: options.once || false,
      capture: options.capture || false,
      passive: options.passive !== false
    };
    listeners[eventType].push(listener);
    return () => {
      const idx = listeners[eventType].indexOf(listener);
      if (idx !== -1) listeners[eventType].splice(idx, 1);
    };
  }
  static dispatchInput(control, eventType, data) {
    if (!control) return false;
    const listeners = control._listeners?.[eventType] || [];
    let handled = false;
    for (const listener of listeners) {
      try {
        const result = listener.handler(data);
        if (result === true) {
          handled = true;
          if (!listener.passive) break;
        }
      } catch (err) {
        logger3.error("Input handler error", { eventType, error: err.message });
      }
      if (listener.once) {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      }
    }
    return handled;
  }
  static removeAllListeners(control, eventType = null) {
    if (!control._listeners) return;
    if (eventType) {
      delete control._listeners[eventType];
    } else {
      for (const key in control._listeners) {
        delete control._listeners[key];
      }
    }
  }
  static normalizeButtonState(buttonState) {
    return {
      down: buttonState.down || false,
      pressed: buttonState.pressed || false,
      released: buttonState.released || false,
      value: buttonState.value || 0
    };
  }
  static normalizeVectorState(vectorState) {
    return {
      x: vectorState.x || 0,
      y: vectorState.y || 0,
      z: vectorState.z || 0,
      length: Math.sqrt((vectorState.x || 0) ** 2 + (vectorState.y || 0) ** 2 + (vectorState.z || 0) ** 2)
    };
  }
  static mergeInputConfigs(baseConfig, overrideConfig) {
    return {
      ...baseConfig,
      ...overrideConfig,
      buttons: { ...baseConfig.buttons, ...overrideConfig.buttons },
      axes: { ...baseConfig.axes, ...overrideConfig.axes }
    };
  }
};

// src/core/plugins/InputPlugin.js
var logger4 = new StructuredLogger("InputPlugin");
var InputPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "Input";
    this.version = "1.0.0";
    this.system = null;
    this.inputHelper = InputHelper;
  }
  async init() {
    this.system = this.world.controls;
    if (!this.system) {
      logger4.warn("Controls system not available");
      return;
    }
    logger4.info("Input plugin initialized");
  }
  async destroy() {
    this.system = null;
    logger4.info("Input plugin destroyed");
  }
  getAPI() {
    return {
      on: (event, callback) => {
        if (!this.enabled || !this.system) return null;
        return this.system.on?.(event, callback) || null;
      },
      off: (event, callback) => {
        if (!this.enabled || !this.system) return false;
        return this.system.off?.(event, callback) || false;
      },
      isActive: () => {
        if (!this.enabled || !this.system) return false;
        return !!this.system;
      },
      lockPointer: () => {
        if (!this.enabled || !this.system) return false;
        return this.system.lockPointer?.() || false;
      },
      unlockPointer: () => {
        if (!this.enabled || !this.system) return false;
        return this.system.unlockPointer?.() || false;
      },
      isPointerLocked: () => {
        if (!this.enabled || !this.system) return false;
        return this.system.pointer?.locked || false;
      },
      getPointer: () => {
        if (!this.enabled || !this.system) return null;
        return this.system.pointer || null;
      },
      getScreen: () => {
        if (!this.enabled || !this.system) return null;
        return this.system.screen || null;
      },
      registerHandler: (eventType, handler, options) => {
        if (!this.enabled || !this.system) return null;
        return this.inputHelper.registerInput(this.system, eventType, handler, options);
      },
      dispatchEvent: (eventType, data) => {
        if (!this.enabled || !this.system) return false;
        return this.inputHelper.dispatchInput(this.system, eventType, data);
      },
      normalizeButton: (buttonState) => {
        return this.inputHelper.normalizeButtonState(buttonState);
      },
      normalizeVector: (vectorState) => {
        return this.inputHelper.normalizeVectorState(vectorState);
      },
      getStatus: () => {
        if (!this.enabled || !this.system) return null;
        return {
          active: true,
          pointerLocked: this.system.pointer?.locked || false,
          screen: {
            width: this.system.screen?.width || 0,
            height: this.system.screen?.height || 0
          },
          controlsCount: this.system.controls?.length || 0,
          actionsCount: this.system.actions?.length || 0
        };
      }
    };
  }
};

// src/core/plugins/core/AssetLoader.js
var logger5 = new StructuredLogger("AssetLoader");
var AssetLoader = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    this.promises = /* @__PURE__ */ new Map();
    this.handlers = /* @__PURE__ */ new Map();
  }
  registerHandler(type, handler) {
    if (typeof handler !== "function") {
      logger5.warn("Handler must be function", { type });
      return false;
    }
    this.handlers.set(type, handler);
    return true;
  }
  hasHandler(type) {
    return this.handlers.has(type);
  }
  async load(type, url, options = {}) {
    const key = `${type}/${url}`;
    if (options.skipCache !== true) {
      const cached = this.cache.get(key);
      if (cached) return cached;
    }
    if (this.promises.has(key)) {
      return this.promises.get(key);
    }
    const handler = this.handlers.get(type);
    if (!handler) {
      logger5.warn("No handler for type", { type });
      return null;
    }
    const promise = handler(url, options).then((result) => {
      this.cache.set(key, result);
      return result;
    }).catch((err) => {
      logger5.error("Load error", { type, url, error: err.message });
      this.promises.delete(key);
      throw err;
    });
    this.promises.set(key, promise);
    return promise;
  }
  get(type, url) {
    const key = `${type}/${url}`;
    return this.cache.get(key) || null;
  }
  has(type, url) {
    const key = `${type}/${url}`;
    return this.cache.has(key);
  }
  cache(type, url, data) {
    const key = `${type}/${url}`;
    this.cache.set(key, data);
    return true;
  }
  clear(type = null) {
    if (type) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}/`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.promises.clear();
    }
  }
  getStats() {
    return {
      cached: this.cache.size,
      pending: this.promises.size,
      handlers: this.handlers.size
    };
  }
};

// src/core/plugins/AssetPlugin.js
var logger6 = new StructuredLogger("AssetPlugin");
var AssetPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "Asset";
    this.version = "1.0.0";
    this.system = null;
    this.assetLoader = new AssetLoader();
  }
  async init() {
    this.system = this.world.loader;
    if (!this.system) {
      logger6.warn("Loader system not available");
      return;
    }
    logger6.info("Asset plugin initialized");
  }
  async destroy() {
    this.system = null;
    logger6.info("Asset plugin destroyed");
  }
  getAPI() {
    return {
      load: async (type, url) => {
        if (!this.enabled || !this.system) return null;
        return this.system.load?.(type, url) || null;
      },
      get: (type, url) => {
        if (!this.enabled || !this.system) return null;
        return this.system.get?.(type, url) || null;
      },
      has: (type, url) => {
        if (!this.enabled || !this.system) return false;
        return this.system.has?.(type, url) || false;
      },
      preload: (type, url) => {
        if (!this.enabled || !this.system) return false;
        return this.system.preload?.(type, url) || false;
      },
      cache: (type, url, data) => {
        if (!this.enabled || !this.system) return false;
        if (!this.system.results) return false;
        const key = `${type}/${url}`;
        this.system.results.set(key, data);
        return true;
      },
      getCached: (type, url) => {
        if (!this.enabled || !this.system) return null;
        return this.system.get?.(type, url) || null;
      },
      setFile: (url, file) => {
        if (!this.enabled || !this.system) return false;
        return this.system.setFile?.(url, file) || false;
      },
      hasFile: (url) => {
        if (!this.enabled || !this.system) return false;
        return this.system.hasFile?.(url) || false;
      },
      getFile: (url, name) => {
        if (!this.enabled || !this.system) return null;
        return this.system.getFile?.(url, name) || null;
      },
      registerHandler: (type, handler) => {
        if (!this.enabled) return false;
        return this.assetLoader.registerHandler(type, handler);
      },
      loadAsync: async (type, url, options) => {
        if (!this.enabled || !this.system) return null;
        return this.system.load?.(type, url, options) || null;
      },
      clearCache: (type) => {
        if (!this.enabled) return false;
        this.assetLoader.clear(type);
        return true;
      },
      cacheAsset: (type, url, data) => {
        if (!this.enabled) return false;
        this.assetLoader.cache(type, url, data);
        return true;
      },
      getLoaderStats: () => {
        return this.assetLoader.getStats();
      },
      getStatus: () => {
        if (!this.enabled || !this.system) return null;
        const loaderStats = this.assetLoader.getStats();
        return {
          active: true,
          cached: this.system.results?.size || 0,
          pending: this.system.promises?.size || 0,
          preloading: !!this.system.preloader,
          loaderCache: loaderStats.cached,
          loaderPending: loaderStats.pending,
          loaderHandlers: loaderStats.handlers
        };
      }
    };
  }
};

// src/core/plugins/RenderPlugin.js
var logger7 = new StructuredLogger("RenderPlugin");
var RenderPlugin = class extends Plugin {
  constructor(world, options = {}) {
    super(world, options);
    this.name = "Render";
    this.version = "1.0.0";
    this.system = null;
    this.renderHelper = RenderHelper;
  }
  async init() {
    this.system = this.world.stage;
    if (!this.system) {
      logger7.warn("Stage system not available");
      return;
    }
    logger7.info("Render plugin initialized");
  }
  async destroy() {
    this.system = null;
    logger7.info("Render plugin destroyed");
  }
  getAPI() {
    return {
      add: (object) => {
        if (!this.enabled || !this.system) return false;
        this.system.scene?.add?.(object);
        return true;
      },
      remove: (object) => {
        if (!this.enabled || !this.system) return false;
        this.system.scene?.remove?.(object);
        return true;
      },
      getScene: () => {
        if (!this.enabled || !this.system) return null;
        return this.system.scene || null;
      },
      getCamera: () => {
        if (!this.enabled || !this.system) return null;
        return this.system.camera || null;
      },
      getViewport: () => {
        if (!this.enabled || !this.system) return null;
        return this.system.viewport || null;
      },
      createMaterial: (options) => {
        if (!this.enabled || !this.system) return null;
        return this.system.createMaterial?.(options) || null;
      },
      raycast: (mouse, objects) => {
        if (!this.enabled || !this.system) return null;
        return this.system.raycast?.(mouse, objects) || null;
      },
      getRenderStats: () => {
        if (!this.enabled || !this.system) return null;
        return this.system.renderStats || null;
      },
      cloneTextures: (material) => {
        if (!this.enabled) return [];
        return this.renderHelper.cloneTextures(material);
      },
      setupEnvironment: (options) => {
        if (!this.enabled || !this.system) return false;
        this.renderHelper.setupSceneEnvironment(this.system.scene, options);
        return true;
      },
      raycastFromCamera: (mouse) => {
        if (!this.enabled || !this.system) return false;
        return this.renderHelper.raycastFromCamera(
          this.system.raycaster,
          this.system.camera,
          this.system.viewport,
          mouse
        );
      },
      raycastFromCenter: () => {
        if (!this.enabled || !this.system) return false;
        return this.renderHelper.raycastFromCenter(this.system.raycaster, this.system.camera);
      },
      getSceneStats: () => {
        if (!this.enabled || !this.system) return null;
        return this.renderHelper.getSceneStats(this.system.scene);
      },
      addGridHelper: (size, divisions) => {
        if (!this.enabled || !this.system) return null;
        const grid = this.renderHelper.createGridHelper(size, divisions);
        this.system.scene.add(grid);
        return grid;
      },
      addAxisHelper: (size) => {
        if (!this.enabled || !this.system) return null;
        const axis = this.renderHelper.createAxisHelper(size);
        this.system.scene.add(axis);
        return axis;
      },
      getStatus: () => {
        if (!this.enabled || !this.system) return null;
        const sceneStats = this.renderHelper.getSceneStats(this.system.scene);
        return {
          active: true,
          scene: !!this.system.scene,
          camera: !!this.system.camera,
          viewport: !!this.system.viewport,
          sceneChildren: this.system.scene?.children?.length || 0,
          renderStats: this.system.renderStats || null,
          sceneStats
        };
      }
    };
  }
};

export {
  Plugin,
  NetworkPlugin,
  InputPlugin,
  AssetPlugin,
  RenderPlugin
};
