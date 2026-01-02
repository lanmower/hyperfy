import {
  StructuredLogger,
  three_exports
} from "./chunk-XO74L2WM.js";
import {
  __commonJS,
  __publicField,
  __toESM
} from "./chunk-CZ2APHNW.js";

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// node_modules/events/events.js
var require_events = __commonJS({
  "node_modules/events/events.js"(exports, module) {
    "use strict";
    var R = typeof Reflect === "object" ? Reflect : null;
    var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
      return Function.prototype.apply.call(target, receiver, args);
    };
    var ReflectOwnKeys;
    if (R && typeof R.ownKeys === "function") {
      ReflectOwnKeys = R.ownKeys;
    } else if (Object.getOwnPropertySymbols) {
      ReflectOwnKeys = function ReflectOwnKeys2(target) {
        return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
      };
    } else {
      ReflectOwnKeys = function ReflectOwnKeys2(target) {
        return Object.getOwnPropertyNames(target);
      };
    }
    function ProcessEmitWarning(warning) {
      if (console && console.warn) console.warn(warning);
    }
    var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
      return value !== value;
    };
    function EventEmitter2() {
      EventEmitter2.init.call(this);
    }
    module.exports = EventEmitter2;
    module.exports.once = once;
    EventEmitter2.EventEmitter = EventEmitter2;
    EventEmitter2.prototype._events = void 0;
    EventEmitter2.prototype._eventsCount = 0;
    EventEmitter2.prototype._maxListeners = void 0;
    var defaultMaxListeners = 10;
    function checkListener(listener) {
      if (typeof listener !== "function") {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
    }
    Object.defineProperty(EventEmitter2, "defaultMaxListeners", {
      enumerable: true,
      get: function() {
        return defaultMaxListeners;
      },
      set: function(arg) {
        if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
          throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
        }
        defaultMaxListeners = arg;
      }
    });
    EventEmitter2.init = function() {
      if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
        this._events = /* @__PURE__ */ Object.create(null);
        this._eventsCount = 0;
      }
      this._maxListeners = this._maxListeners || void 0;
    };
    EventEmitter2.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
      }
      this._maxListeners = n;
      return this;
    };
    function _getMaxListeners(that) {
      if (that._maxListeners === void 0)
        return EventEmitter2.defaultMaxListeners;
      return that._maxListeners;
    }
    EventEmitter2.prototype.getMaxListeners = function getMaxListeners() {
      return _getMaxListeners(this);
    };
    EventEmitter2.prototype.emit = function emit(type) {
      var args = [];
      for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
      var doError = type === "error";
      var events = this._events;
      if (events !== void 0)
        doError = doError && events.error === void 0;
      else if (!doError)
        return false;
      if (doError) {
        var er;
        if (args.length > 0)
          er = args[0];
        if (er instanceof Error) {
          throw er;
        }
        var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
        err.context = er;
        throw err;
      }
      var handler = events[type];
      if (handler === void 0)
        return false;
      if (typeof handler === "function") {
        ReflectApply(handler, this, args);
      } else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          ReflectApply(listeners[i], this, args);
      }
      return true;
    };
    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;
      checkListener(listener);
      events = target._events;
      if (events === void 0) {
        events = target._events = /* @__PURE__ */ Object.create(null);
        target._eventsCount = 0;
      } else {
        if (events.newListener !== void 0) {
          target.emit(
            "newListener",
            type,
            listener.listener ? listener.listener : listener
          );
          events = target._events;
        }
        existing = events[type];
      }
      if (existing === void 0) {
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === "function") {
          existing = events[type] = prepend ? [listener, existing] : [existing, listener];
        } else if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
        m = _getMaxListeners(target);
        if (m > 0 && existing.length > m && !existing.warned) {
          existing.warned = true;
          var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
          w.name = "MaxListenersExceededWarning";
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          ProcessEmitWarning(w);
        }
      }
      return target;
    }
    EventEmitter2.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };
    EventEmitter2.prototype.on = EventEmitter2.prototype.addListener;
    EventEmitter2.prototype.prependListener = function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };
    function onceWrapper() {
      if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        if (arguments.length === 0)
          return this.listener.call(this.target);
        return this.listener.apply(this.target, arguments);
      }
    }
    function _onceWrap(target, type, listener) {
      var state = { fired: false, wrapFn: void 0, target, type, listener };
      var wrapped = onceWrapper.bind(state);
      wrapped.listener = listener;
      state.wrapFn = wrapped;
      return wrapped;
    }
    EventEmitter2.prototype.once = function once2(type, listener) {
      checkListener(listener);
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };
    EventEmitter2.prototype.prependOnceListener = function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };
    EventEmitter2.prototype.removeListener = function removeListener(type, listener) {
      var list, events, position, i, originalListener;
      checkListener(listener);
      events = this._events;
      if (events === void 0)
        return this;
      list = events[type];
      if (list === void 0)
        return this;
      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = /* @__PURE__ */ Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit("removeListener", type, list.listener || listener);
        }
      } else if (typeof list !== "function") {
        position = -1;
        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }
        if (position < 0)
          return this;
        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }
        if (list.length === 1)
          events[type] = list[0];
        if (events.removeListener !== void 0)
          this.emit("removeListener", type, originalListener || listener);
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(type) {
      var listeners, events, i;
      events = this._events;
      if (events === void 0)
        return this;
      if (events.removeListener === void 0) {
        if (arguments.length === 0) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== void 0) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else
            delete events[type];
        }
        return this;
      }
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === "removeListener") continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners("removeListener");
        this._events = /* @__PURE__ */ Object.create(null);
        this._eventsCount = 0;
        return this;
      }
      listeners = events[type];
      if (typeof listeners === "function") {
        this.removeListener(type, listeners);
      } else if (listeners !== void 0) {
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }
      return this;
    };
    function _listeners(target, type, unwrap) {
      var events = target._events;
      if (events === void 0)
        return [];
      var evlistener = events[type];
      if (evlistener === void 0)
        return [];
      if (typeof evlistener === "function")
        return unwrap ? [evlistener.listener || evlistener] : [evlistener];
      return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
    }
    EventEmitter2.prototype.listeners = function listeners(type) {
      return _listeners(this, type, true);
    };
    EventEmitter2.prototype.rawListeners = function rawListeners(type) {
      return _listeners(this, type, false);
    };
    EventEmitter2.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === "function") {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };
    EventEmitter2.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;
      if (events !== void 0) {
        var evlistener = events[type];
        if (typeof evlistener === "function") {
          return 1;
        } else if (evlistener !== void 0) {
          return evlistener.length;
        }
      }
      return 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
    };
    function arrayClone(arr, n) {
      var copy = new Array(n);
      for (var i = 0; i < n; ++i)
        copy[i] = arr[i];
      return copy;
    }
    function spliceOne(list, index) {
      for (; index + 1 < list.length; index++)
        list[index] = list[index + 1];
      list.pop();
    }
    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }
    function once(emitter, name) {
      return new Promise(function(resolve, reject) {
        function errorListener(err) {
          emitter.removeListener(name, resolver);
          reject(err);
        }
        function resolver() {
          if (typeof emitter.removeListener === "function") {
            emitter.removeListener("error", errorListener);
          }
          resolve([].slice.call(arguments));
        }
        ;
        eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
        if (name !== "error") {
          addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
        }
      });
    }
    function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
      if (typeof emitter.on === "function") {
        eventTargetAgnosticAddListener(emitter, "error", handler, flags);
      }
    }
    function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
      if (typeof emitter.on === "function") {
        if (flags.once) {
          emitter.once(name, listener);
        } else {
          emitter.on(name, listener);
        }
      } else if (typeof emitter.addEventListener === "function") {
        emitter.addEventListener(name, function wrapListener(arg) {
          if (flags.once) {
            emitter.removeEventListener(name, wrapListener);
          }
          listener(arg);
        });
      } else {
        throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
      }
    }
  }
});

// node_modules/generic-pool/lib/factoryValidator.js
var require_factoryValidator = __commonJS({
  "node_modules/generic-pool/lib/factoryValidator.js"(exports, module) {
    module.exports = function(factory) {
      if (typeof factory.create !== "function") {
        throw new TypeError("factory.create must be a function");
      }
      if (typeof factory.destroy !== "function") {
        throw new TypeError("factory.destroy must be a function");
      }
      if (typeof factory.validate !== "undefined" && typeof factory.validate !== "function") {
        throw new TypeError("factory.validate must be a function");
      }
    };
  }
});

// node_modules/generic-pool/lib/PoolDefaults.js
var require_PoolDefaults = __commonJS({
  "node_modules/generic-pool/lib/PoolDefaults.js"(exports, module) {
    "use strict";
    var PoolDefaults = class {
      constructor() {
        this.fifo = true;
        this.priorityRange = 1;
        this.testOnBorrow = false;
        this.testOnReturn = false;
        this.autostart = true;
        this.evictionRunIntervalMillis = 0;
        this.numTestsPerEvictionRun = 3;
        this.softIdleTimeoutMillis = -1;
        this.idleTimeoutMillis = 3e4;
        this.acquireTimeoutMillis = null;
        this.destroyTimeoutMillis = null;
        this.maxWaitingClients = null;
        this.min = null;
        this.max = null;
        this.Promise = Promise;
      }
    };
    module.exports = PoolDefaults;
  }
});

// node_modules/generic-pool/lib/PoolOptions.js
var require_PoolOptions = __commonJS({
  "node_modules/generic-pool/lib/PoolOptions.js"(exports, module) {
    "use strict";
    var PoolDefaults = require_PoolDefaults();
    var PoolOptions = class {
      /**
       * @param {Object} opts
       *   configuration for the pool
       * @param {Number} [opts.max=null]
       *   Maximum number of items that can exist at the same time.  Default: 1.
       *   Any further acquire requests will be pushed to the waiting list.
       * @param {Number} [opts.min=null]
       *   Minimum number of items in pool (including in-use). Default: 0.
       *   When the pool is created, or a resource destroyed, this minimum will
       *   be checked. If the pool resource count is below the minimum, a new
       *   resource will be created and added to the pool.
       * @param {Number} [opts.maxWaitingClients=null]
       *   maximum number of queued requests allowed after which acquire calls will be rejected
       * @param {Boolean} [opts.testOnBorrow=false]
       *   should the pool validate resources before giving them to clients. Requires that
       *   `factory.validate` is specified.
       * @param {Boolean} [opts.testOnReturn=false]
       *   should the pool validate resources before returning them to the pool.
       * @param {Number} [opts.acquireTimeoutMillis=null]
       *   Delay in milliseconds after which the an `acquire` call will fail. optional.
       *   Default: undefined. Should be positive and non-zero
       * @param {Number} [opts.destroyTimeoutMillis=null]
       *   Delay in milliseconds after which the an `destroy` call will fail, causing it to emit a factoryDestroyError event. optional.
       *   Default: undefined. Should be positive and non-zero
       * @param {Number} [opts.priorityRange=1]
       *   The range from 1 to be treated as a valid priority
       * @param {Boolean} [opts.fifo=true]
       *   Sets whether the pool has LIFO (last in, first out) behaviour with respect to idle objects.
       *   if false then pool has FIFO behaviour
       * @param {Boolean} [opts.autostart=true]
       *   Should the pool start creating resources etc once the constructor is called
       * @param {Number} [opts.evictionRunIntervalMillis=0]
       *   How often to run eviction checks.  Default: 0 (does not run).
       * @param {Number} [opts.numTestsPerEvictionRun=3]
       *   Number of resources to check each eviction run.  Default: 3.
       * @param {Number} [opts.softIdleTimeoutMillis=-1]
       *   amount of time an object may sit idle in the pool before it is eligible
       *   for eviction by the idle object evictor (if any), with the extra condition
       *   that at least "min idle" object instances remain in the pool. Default -1 (nothing can get evicted)
       * @param {Number} [opts.idleTimeoutMillis=30000]
       *   the minimum amount of time that an object may sit idle in the pool before it is eligible for eviction
       *   due to idle time. Supercedes "softIdleTimeoutMillis" Default: 30000
       * @param {typeof Promise} [opts.Promise=Promise]
       *   What promise implementation should the pool use, defaults to native promises.
       */
      constructor(opts) {
        const poolDefaults = new PoolDefaults();
        opts = opts || {};
        this.fifo = typeof opts.fifo === "boolean" ? opts.fifo : poolDefaults.fifo;
        this.priorityRange = opts.priorityRange || poolDefaults.priorityRange;
        this.testOnBorrow = typeof opts.testOnBorrow === "boolean" ? opts.testOnBorrow : poolDefaults.testOnBorrow;
        this.testOnReturn = typeof opts.testOnReturn === "boolean" ? opts.testOnReturn : poolDefaults.testOnReturn;
        this.autostart = typeof opts.autostart === "boolean" ? opts.autostart : poolDefaults.autostart;
        if (opts.acquireTimeoutMillis) {
          this.acquireTimeoutMillis = parseInt(opts.acquireTimeoutMillis, 10);
        }
        if (opts.destroyTimeoutMillis) {
          this.destroyTimeoutMillis = parseInt(opts.destroyTimeoutMillis, 10);
        }
        if (opts.maxWaitingClients !== void 0) {
          this.maxWaitingClients = parseInt(opts.maxWaitingClients, 10);
        }
        this.max = parseInt(opts.max, 10);
        this.min = parseInt(opts.min, 10);
        this.max = Math.max(isNaN(this.max) ? 1 : this.max, 1);
        this.min = Math.min(isNaN(this.min) ? 0 : this.min, this.max);
        this.evictionRunIntervalMillis = opts.evictionRunIntervalMillis || poolDefaults.evictionRunIntervalMillis;
        this.numTestsPerEvictionRun = opts.numTestsPerEvictionRun || poolDefaults.numTestsPerEvictionRun;
        this.softIdleTimeoutMillis = opts.softIdleTimeoutMillis || poolDefaults.softIdleTimeoutMillis;
        this.idleTimeoutMillis = opts.idleTimeoutMillis || poolDefaults.idleTimeoutMillis;
        this.Promise = opts.Promise != null ? opts.Promise : poolDefaults.Promise;
      }
    };
    module.exports = PoolOptions;
  }
});

// node_modules/generic-pool/lib/Deferred.js
var require_Deferred = __commonJS({
  "node_modules/generic-pool/lib/Deferred.js"(exports, module) {
    "use strict";
    var Deferred = class _Deferred {
      constructor(Promise2) {
        this._state = _Deferred.PENDING;
        this._resolve = void 0;
        this._reject = void 0;
        this._promise = new Promise2((resolve, reject) => {
          this._resolve = resolve;
          this._reject = reject;
        });
      }
      get state() {
        return this._state;
      }
      get promise() {
        return this._promise;
      }
      reject(reason) {
        if (this._state !== _Deferred.PENDING) {
          return;
        }
        this._state = _Deferred.REJECTED;
        this._reject(reason);
      }
      resolve(value) {
        if (this._state !== _Deferred.PENDING) {
          return;
        }
        this._state = _Deferred.FULFILLED;
        this._resolve(value);
      }
    };
    Deferred.PENDING = "PENDING";
    Deferred.FULFILLED = "FULFILLED";
    Deferred.REJECTED = "REJECTED";
    module.exports = Deferred;
  }
});

// node_modules/generic-pool/lib/errors.js
var require_errors = __commonJS({
  "node_modules/generic-pool/lib/errors.js"(exports, module) {
    "use strict";
    var ExtendableError = class extends Error {
      constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        if (typeof Error.captureStackTrace === "function") {
          Error.captureStackTrace(this, this.constructor);
        } else {
          this.stack = new Error(message).stack;
        }
      }
    };
    var TimeoutError = class extends ExtendableError {
      constructor(m) {
        super(m);
      }
    };
    module.exports = {
      TimeoutError
    };
  }
});

// node_modules/generic-pool/lib/ResourceRequest.js
var require_ResourceRequest = __commonJS({
  "node_modules/generic-pool/lib/ResourceRequest.js"(exports, module) {
    "use strict";
    var Deferred = require_Deferred();
    var errors = require_errors();
    function fbind(fn, ctx) {
      return function bound() {
        return fn.apply(ctx, arguments);
      };
    }
    var ResourceRequest = class _ResourceRequest extends Deferred {
      /**
       * [constructor description]
       * @param  {Number} ttl     timeout
       */
      constructor(ttl, Promise2) {
        super(Promise2);
        this._creationTimestamp = Date.now();
        this._timeout = null;
        if (ttl !== void 0) {
          this.setTimeout(ttl);
        }
      }
      setTimeout(delay) {
        if (this._state !== _ResourceRequest.PENDING) {
          return;
        }
        const ttl = parseInt(delay, 10);
        if (isNaN(ttl) || ttl <= 0) {
          throw new Error("delay must be a positive int");
        }
        const age = Date.now() - this._creationTimestamp;
        if (this._timeout) {
          this.removeTimeout();
        }
        this._timeout = setTimeout(
          fbind(this._fireTimeout, this),
          Math.max(ttl - age, 0)
        );
      }
      removeTimeout() {
        if (this._timeout) {
          clearTimeout(this._timeout);
        }
        this._timeout = null;
      }
      _fireTimeout() {
        this.reject(new errors.TimeoutError("ResourceRequest timed out"));
      }
      reject(reason) {
        this.removeTimeout();
        super.reject(reason);
      }
      resolve(value) {
        this.removeTimeout();
        super.resolve(value);
      }
    };
    module.exports = ResourceRequest;
  }
});

// node_modules/generic-pool/lib/ResourceLoan.js
var require_ResourceLoan = __commonJS({
  "node_modules/generic-pool/lib/ResourceLoan.js"(exports, module) {
    "use strict";
    var Deferred = require_Deferred();
    var ResourceLoan = class extends Deferred {
      /**
       *
       * @param  {any} pooledResource the PooledResource this loan belongs to
       * @return {any}                [description]
       */
      constructor(pooledResource, Promise2) {
        super(Promise2);
        this._creationTimestamp = Date.now();
        this.pooledResource = pooledResource;
      }
      reject() {
      }
    };
    module.exports = ResourceLoan;
  }
});

// node_modules/generic-pool/lib/PooledResourceStateEnum.js
var require_PooledResourceStateEnum = __commonJS({
  "node_modules/generic-pool/lib/PooledResourceStateEnum.js"(exports, module) {
    "use strict";
    var PooledResourceStateEnum = {
      ALLOCATED: "ALLOCATED",
      // In use
      IDLE: "IDLE",
      // In the queue, not in use.
      INVALID: "INVALID",
      // Failed validation
      RETURNING: "RETURNING",
      // Resource is in process of returning
      VALIDATION: "VALIDATION"
      // Currently being tested
    };
    module.exports = PooledResourceStateEnum;
  }
});

// node_modules/generic-pool/lib/PooledResource.js
var require_PooledResource = __commonJS({
  "node_modules/generic-pool/lib/PooledResource.js"(exports, module) {
    "use strict";
    var PooledResourceStateEnum = require_PooledResourceStateEnum();
    var PooledResource = class {
      constructor(resource) {
        this.creationTime = Date.now();
        this.lastReturnTime = null;
        this.lastBorrowTime = null;
        this.lastIdleTime = null;
        this.obj = resource;
        this.state = PooledResourceStateEnum.IDLE;
      }
      // mark the resource as "allocated"
      allocate() {
        this.lastBorrowTime = Date.now();
        this.state = PooledResourceStateEnum.ALLOCATED;
      }
      // mark the resource as "deallocated"
      deallocate() {
        this.lastReturnTime = Date.now();
        this.state = PooledResourceStateEnum.IDLE;
      }
      invalidate() {
        this.state = PooledResourceStateEnum.INVALID;
      }
      test() {
        this.state = PooledResourceStateEnum.VALIDATION;
      }
      idle() {
        this.lastIdleTime = Date.now();
        this.state = PooledResourceStateEnum.IDLE;
      }
      returning() {
        this.state = PooledResourceStateEnum.RETURNING;
      }
    };
    module.exports = PooledResource;
  }
});

// node_modules/generic-pool/lib/DefaultEvictor.js
var require_DefaultEvictor = __commonJS({
  "node_modules/generic-pool/lib/DefaultEvictor.js"(exports, module) {
    "use strict";
    var DefaultEvictor = class {
      evict(config, pooledResource, availableObjectsCount) {
        const idleTime = Date.now() - pooledResource.lastIdleTime;
        if (config.softIdleTimeoutMillis > 0 && config.softIdleTimeoutMillis < idleTime && config.min < availableObjectsCount) {
          return true;
        }
        if (config.idleTimeoutMillis < idleTime) {
          return true;
        }
        return false;
      }
    };
    module.exports = DefaultEvictor;
  }
});

// node_modules/generic-pool/lib/DoublyLinkedList.js
var require_DoublyLinkedList = __commonJS({
  "node_modules/generic-pool/lib/DoublyLinkedList.js"(exports, module) {
    "use strict";
    var DoublyLinkedList = class {
      constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      insertBeginning(node) {
        if (this.head === null) {
          this.head = node;
          this.tail = node;
          node.prev = null;
          node.next = null;
          this.length++;
        } else {
          this.insertBefore(this.head, node);
        }
      }
      insertEnd(node) {
        if (this.tail === null) {
          this.insertBeginning(node);
        } else {
          this.insertAfter(this.tail, node);
        }
      }
      insertAfter(node, newNode) {
        newNode.prev = node;
        newNode.next = node.next;
        if (node.next === null) {
          this.tail = newNode;
        } else {
          node.next.prev = newNode;
        }
        node.next = newNode;
        this.length++;
      }
      insertBefore(node, newNode) {
        newNode.prev = node.prev;
        newNode.next = node;
        if (node.prev === null) {
          this.head = newNode;
        } else {
          node.prev.next = newNode;
        }
        node.prev = newNode;
        this.length++;
      }
      remove(node) {
        if (node.prev === null) {
          this.head = node.next;
        } else {
          node.prev.next = node.next;
        }
        if (node.next === null) {
          this.tail = node.prev;
        } else {
          node.next.prev = node.prev;
        }
        node.prev = null;
        node.next = null;
        this.length--;
      }
      // FIXME: this should not live here and has become a dumping ground...
      static createNode(data) {
        return {
          prev: null,
          next: null,
          data
        };
      }
    };
    module.exports = DoublyLinkedList;
  }
});

// node_modules/generic-pool/lib/DoublyLinkedListIterator.js
var require_DoublyLinkedListIterator = __commonJS({
  "node_modules/generic-pool/lib/DoublyLinkedListIterator.js"(exports, module) {
    "use strict";
    var DoublyLinkedListIterator = class {
      /**
       * @param  {Object} doublyLinkedList     a node that is part of a doublyLinkedList
       * @param  {Boolean} [reverse=false]     is this a reverse iterator? default: false
       */
      constructor(doublyLinkedList, reverse) {
        this._list = doublyLinkedList;
        this._direction = reverse === true ? "prev" : "next";
        this._startPosition = reverse === true ? "tail" : "head";
        this._started = false;
        this._cursor = null;
        this._done = false;
      }
      _start() {
        this._cursor = this._list[this._startPosition];
        this._started = true;
      }
      _advanceCursor() {
        if (this._started === false) {
          this._started = true;
          this._cursor = this._list[this._startPosition];
          return;
        }
        this._cursor = this._cursor[this._direction];
      }
      reset() {
        this._done = false;
        this._started = false;
        this._cursor = null;
      }
      remove() {
        if (this._started === false || this._done === true || this._isCursorDetached()) {
          return false;
        }
        this._list.remove(this._cursor);
      }
      next() {
        if (this._done === true) {
          return { done: true };
        }
        this._advanceCursor();
        if (this._cursor === null || this._isCursorDetached()) {
          this._done = true;
          return { done: true };
        }
        return {
          value: this._cursor,
          done: false
        };
      }
      /**
       * Is the node detached from a list?
       * NOTE: you can trick/bypass/confuse this check by removing a node from one DoublyLinkedList
       * and adding it to another.
       * TODO: We can make this smarter by checking the direction of travel and only checking
       * the required next/prev/head/tail rather than all of them
       * @return {Boolean}      [description]
       */
      _isCursorDetached() {
        return this._cursor.prev === null && this._cursor.next === null && this._list.tail !== this._cursor && this._list.head !== this._cursor;
      }
    };
    module.exports = DoublyLinkedListIterator;
  }
});

// node_modules/generic-pool/lib/DequeIterator.js
var require_DequeIterator = __commonJS({
  "node_modules/generic-pool/lib/DequeIterator.js"(exports, module) {
    "use strict";
    var DoublyLinkedListIterator = require_DoublyLinkedListIterator();
    var DequeIterator = class extends DoublyLinkedListIterator {
      next() {
        const result = super.next();
        if (result.value) {
          result.value = result.value.data;
        }
        return result;
      }
    };
    module.exports = DequeIterator;
  }
});

// node_modules/generic-pool/lib/Deque.js
var require_Deque = __commonJS({
  "node_modules/generic-pool/lib/Deque.js"(exports, module) {
    "use strict";
    var DoublyLinkedList = require_DoublyLinkedList();
    var DequeIterator = require_DequeIterator();
    var Deque = class {
      constructor() {
        this._list = new DoublyLinkedList();
      }
      /**
       * removes and returns the first element from the queue
       * @return {any} [description]
       */
      shift() {
        if (this.length === 0) {
          return void 0;
        }
        const node = this._list.head;
        this._list.remove(node);
        return node.data;
      }
      /**
       * adds one elemts to the beginning of the queue
       * @param  {any} element [description]
       * @return {any}         [description]
       */
      unshift(element) {
        const node = DoublyLinkedList.createNode(element);
        this._list.insertBeginning(node);
      }
      /**
       * adds one to the end of the queue
       * @param  {any} element [description]
       * @return {any}         [description]
       */
      push(element) {
        const node = DoublyLinkedList.createNode(element);
        this._list.insertEnd(node);
      }
      /**
       * removes and returns the last element from the queue
       */
      pop() {
        if (this.length === 0) {
          return void 0;
        }
        const node = this._list.tail;
        this._list.remove(node);
        return node.data;
      }
      [Symbol.iterator]() {
        return new DequeIterator(this._list);
      }
      iterator() {
        return new DequeIterator(this._list);
      }
      reverseIterator() {
        return new DequeIterator(this._list, true);
      }
      /**
       * get a reference to the item at the head of the queue
       * @return {any} [description]
       */
      get head() {
        if (this.length === 0) {
          return void 0;
        }
        const node = this._list.head;
        return node.data;
      }
      /**
       * get a reference to the item at the tail of the queue
       * @return {any} [description]
       */
      get tail() {
        if (this.length === 0) {
          return void 0;
        }
        const node = this._list.tail;
        return node.data;
      }
      get length() {
        return this._list.length;
      }
    };
    module.exports = Deque;
  }
});

// node_modules/generic-pool/lib/Queue.js
var require_Queue = __commonJS({
  "node_modules/generic-pool/lib/Queue.js"(exports, module) {
    "use strict";
    var DoublyLinkedList = require_DoublyLinkedList();
    var Deque = require_Deque();
    var Queue = class extends Deque {
      /**
       * Adds the obj to the end of the list for this slot
       * we completely override the parent method because we need access to the
       * node for our rejection handler
       * @param {any} resourceRequest [description]
       */
      push(resourceRequest) {
        const node = DoublyLinkedList.createNode(resourceRequest);
        resourceRequest.promise.catch(this._createTimeoutRejectionHandler(node));
        this._list.insertEnd(node);
      }
      _createTimeoutRejectionHandler(node) {
        return (reason) => {
          if (reason.name === "TimeoutError") {
            this._list.remove(node);
          }
        };
      }
    };
    module.exports = Queue;
  }
});

// node_modules/generic-pool/lib/PriorityQueue.js
var require_PriorityQueue = __commonJS({
  "node_modules/generic-pool/lib/PriorityQueue.js"(exports, module) {
    "use strict";
    var Queue = require_Queue();
    var PriorityQueue = class {
      constructor(size) {
        this._size = Math.max(+size | 0, 1);
        this._slots = [];
        for (let i = 0; i < this._size; i++) {
          this._slots.push(new Queue());
        }
      }
      get length() {
        let _length = 0;
        for (let i = 0, slots = this._slots.length; i < slots; i++) {
          _length += this._slots[i].length;
        }
        return _length;
      }
      enqueue(obj, priority) {
        priority = priority && +priority | 0 || 0;
        if (priority) {
          if (priority < 0 || priority >= this._size) {
            priority = this._size - 1;
          }
        }
        this._slots[priority].push(obj);
      }
      dequeue() {
        for (let i = 0, sl = this._slots.length; i < sl; i += 1) {
          if (this._slots[i].length) {
            return this._slots[i].shift();
          }
        }
        return;
      }
      get head() {
        for (let i = 0, sl = this._slots.length; i < sl; i += 1) {
          if (this._slots[i].length > 0) {
            return this._slots[i].head;
          }
        }
        return;
      }
      get tail() {
        for (let i = this._slots.length - 1; i >= 0; i--) {
          if (this._slots[i].length > 0) {
            return this._slots[i].tail;
          }
        }
        return;
      }
    };
    module.exports = PriorityQueue;
  }
});

// node_modules/generic-pool/lib/utils.js
var require_utils = __commonJS({
  "node_modules/generic-pool/lib/utils.js"(exports) {
    "use strict";
    function noop() {
    }
    exports.reflector = function(promise) {
      return promise.then(noop, noop);
    };
  }
});

// node_modules/generic-pool/lib/Pool.js
var require_Pool = __commonJS({
  "node_modules/generic-pool/lib/Pool.js"(exports, module) {
    "use strict";
    var EventEmitter2 = require_events().EventEmitter;
    var factoryValidator = require_factoryValidator();
    var PoolOptions = require_PoolOptions();
    var ResourceRequest = require_ResourceRequest();
    var ResourceLoan = require_ResourceLoan();
    var PooledResource = require_PooledResource();
    var DefaultEvictor = require_DefaultEvictor();
    var Deque = require_Deque();
    var Deferred = require_Deferred();
    var PriorityQueue = require_PriorityQueue();
    var DequeIterator = require_DequeIterator();
    var reflector = require_utils().reflector;
    var FACTORY_CREATE_ERROR = "factoryCreateError";
    var FACTORY_DESTROY_ERROR = "factoryDestroyError";
    var Pool = class extends EventEmitter2 {
      /**
       * Generate an Object pool with a specified `factory` and `config`.
       *
       * @param {typeof DefaultEvictor} Evictor
       * @param {typeof Deque} Deque
       * @param {typeof PriorityQueue} PriorityQueue
       * @param {Object} factory
       *   Factory to be used for generating and destroying the items.
       * @param {Function} factory.create
       *   Should create the item to be acquired,
       *   and call it's first callback argument with the generated item as it's argument.
       * @param {Function} factory.destroy
       *   Should gently close any resources that the item is using.
       *   Called before the items is destroyed.
       * @param {Function} factory.validate
       *   Test if a resource is still valid .Should return a promise that resolves to a boolean, true if resource is still valid and false
       *   If it should be removed from pool.
       * @param {Object} options
       */
      constructor(Evictor, Deque2, PriorityQueue2, factory, options) {
        super();
        factoryValidator(factory);
        this._config = new PoolOptions(options);
        this._Promise = this._config.Promise;
        this._factory = factory;
        this._draining = false;
        this._started = false;
        this._waitingClientsQueue = new PriorityQueue2(this._config.priorityRange);
        this._factoryCreateOperations = /* @__PURE__ */ new Set();
        this._factoryDestroyOperations = /* @__PURE__ */ new Set();
        this._availableObjects = new Deque2();
        this._testOnBorrowResources = /* @__PURE__ */ new Set();
        this._testOnReturnResources = /* @__PURE__ */ new Set();
        this._validationOperations = /* @__PURE__ */ new Set();
        this._allObjects = /* @__PURE__ */ new Set();
        this._resourceLoans = /* @__PURE__ */ new Map();
        this._evictionIterator = this._availableObjects.iterator();
        this._evictor = new Evictor();
        this._scheduledEviction = null;
        if (this._config.autostart === true) {
          this.start();
        }
      }
      _destroy(pooledResource) {
        pooledResource.invalidate();
        this._allObjects.delete(pooledResource);
        const destroyPromise = this._factory.destroy(pooledResource.obj);
        const wrappedDestroyPromise = this._config.destroyTimeoutMillis ? this._Promise.resolve(this._applyDestroyTimeout(destroyPromise)) : this._Promise.resolve(destroyPromise);
        this._trackOperation(
          wrappedDestroyPromise,
          this._factoryDestroyOperations
        ).catch((reason) => {
          this.emit(FACTORY_DESTROY_ERROR, reason);
        });
        this._ensureMinimum();
      }
      _applyDestroyTimeout(promise) {
        const timeoutPromise = new this._Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error("destroy timed out"));
          }, this._config.destroyTimeoutMillis).unref();
        });
        return this._Promise.race([timeoutPromise, promise]);
      }
      /**
       * Attempt to move an available resource into test and then onto a waiting client
       * @return {Boolean} could we move an available resource into test
       */
      _testOnBorrow() {
        if (this._availableObjects.length < 1) {
          return false;
        }
        const pooledResource = this._availableObjects.shift();
        pooledResource.test();
        this._testOnBorrowResources.add(pooledResource);
        const validationPromise = this._factory.validate(pooledResource.obj);
        const wrappedValidationPromise = this._Promise.resolve(validationPromise);
        this._trackOperation(
          wrappedValidationPromise,
          this._validationOperations
        ).then((isValid) => {
          this._testOnBorrowResources.delete(pooledResource);
          if (isValid === false) {
            pooledResource.invalidate();
            this._destroy(pooledResource);
            this._dispense();
            return;
          }
          this._dispatchPooledResourceToNextWaitingClient(pooledResource);
        });
        return true;
      }
      /**
       * Attempt to move an available resource to a waiting client
       * @return {Boolean} [description]
       */
      _dispatchResource() {
        if (this._availableObjects.length < 1) {
          return false;
        }
        const pooledResource = this._availableObjects.shift();
        this._dispatchPooledResourceToNextWaitingClient(pooledResource);
        return false;
      }
      /**
       * Attempt to resolve an outstanding resource request using an available resource from
       * the pool, or creating new ones
       *
       * @private
       */
      _dispense() {
        const numWaitingClients = this._waitingClientsQueue.length;
        if (numWaitingClients < 1) {
          return;
        }
        const resourceShortfall = numWaitingClients - this._potentiallyAllocableResourceCount;
        const actualNumberOfResourcesToCreate = Math.min(
          this.spareResourceCapacity,
          resourceShortfall
        );
        for (let i = 0; actualNumberOfResourcesToCreate > i; i++) {
          this._createResource();
        }
        if (this._config.testOnBorrow === true) {
          const desiredNumberOfResourcesToMoveIntoTest = numWaitingClients - this._testOnBorrowResources.size;
          const actualNumberOfResourcesToMoveIntoTest = Math.min(
            this._availableObjects.length,
            desiredNumberOfResourcesToMoveIntoTest
          );
          for (let i = 0; actualNumberOfResourcesToMoveIntoTest > i; i++) {
            this._testOnBorrow();
          }
        }
        if (this._config.testOnBorrow === false) {
          const actualNumberOfResourcesToDispatch = Math.min(
            this._availableObjects.length,
            numWaitingClients
          );
          for (let i = 0; actualNumberOfResourcesToDispatch > i; i++) {
            this._dispatchResource();
          }
        }
      }
      /**
       * Dispatches a pooledResource to the next waiting client (if any) else
       * puts the PooledResource back on the available list
       * @param  {PooledResource} pooledResource [description]
       * @return {Boolean}                [description]
       */
      _dispatchPooledResourceToNextWaitingClient(pooledResource) {
        const clientResourceRequest = this._waitingClientsQueue.dequeue();
        if (clientResourceRequest === void 0 || clientResourceRequest.state !== Deferred.PENDING) {
          this._addPooledResourceToAvailableObjects(pooledResource);
          return false;
        }
        const loan = new ResourceLoan(pooledResource, this._Promise);
        this._resourceLoans.set(pooledResource.obj, loan);
        pooledResource.allocate();
        clientResourceRequest.resolve(pooledResource.obj);
        return true;
      }
      /**
       * tracks on operation using given set
       * handles adding/removing from the set and resolve/rejects the value/reason
       * @param  {Promise} operation
       * @param  {Set} set       Set holding operations
       * @return {Promise}       Promise that resolves once operation has been removed from set
       */
      _trackOperation(operation, set) {
        set.add(operation);
        return operation.then(
          (v) => {
            set.delete(operation);
            return this._Promise.resolve(v);
          },
          (e) => {
            set.delete(operation);
            return this._Promise.reject(e);
          }
        );
      }
      /**
       * @private
       */
      _createResource() {
        const factoryPromise = this._factory.create();
        const wrappedFactoryPromise = this._Promise.resolve(factoryPromise).then((resource) => {
          const pooledResource = new PooledResource(resource);
          this._allObjects.add(pooledResource);
          this._addPooledResourceToAvailableObjects(pooledResource);
        });
        this._trackOperation(wrappedFactoryPromise, this._factoryCreateOperations).then(() => {
          this._dispense();
          return null;
        }).catch((reason) => {
          this.emit(FACTORY_CREATE_ERROR, reason);
          this._dispense();
        });
      }
      /**
       * @private
       */
      _ensureMinimum() {
        if (this._draining === true) {
          return;
        }
        const minShortfall = this._config.min - this._count;
        for (let i = 0; i < minShortfall; i++) {
          this._createResource();
        }
      }
      _evict() {
        const testsToRun = Math.min(
          this._config.numTestsPerEvictionRun,
          this._availableObjects.length
        );
        const evictionConfig = {
          softIdleTimeoutMillis: this._config.softIdleTimeoutMillis,
          idleTimeoutMillis: this._config.idleTimeoutMillis,
          min: this._config.min
        };
        for (let testsHaveRun = 0; testsHaveRun < testsToRun; ) {
          const iterationResult = this._evictionIterator.next();
          if (iterationResult.done === true && this._availableObjects.length < 1) {
            this._evictionIterator.reset();
            return;
          }
          if (iterationResult.done === true && this._availableObjects.length > 0) {
            this._evictionIterator.reset();
            continue;
          }
          const resource = iterationResult.value;
          const shouldEvict = this._evictor.evict(
            evictionConfig,
            resource,
            this._availableObjects.length
          );
          testsHaveRun++;
          if (shouldEvict === true) {
            this._evictionIterator.remove();
            this._destroy(resource);
          }
        }
      }
      _scheduleEvictorRun() {
        if (this._config.evictionRunIntervalMillis > 0) {
          this._scheduledEviction = setTimeout(() => {
            this._evict();
            this._scheduleEvictorRun();
          }, this._config.evictionRunIntervalMillis).unref();
        }
      }
      _descheduleEvictorRun() {
        if (this._scheduledEviction) {
          clearTimeout(this._scheduledEviction);
        }
        this._scheduledEviction = null;
      }
      start() {
        if (this._draining === true) {
          return;
        }
        if (this._started === true) {
          return;
        }
        this._started = true;
        this._scheduleEvictorRun();
        this._ensureMinimum();
      }
      /**
       * Request a new resource. The callback will be called,
       * when a new resource is available, passing the resource to the callback.
       * TODO: should we add a seperate "acquireWithPriority" function
       *
       * @param {Number} [priority=0]
       *   Optional.  Integer between 0 and (priorityRange - 1).  Specifies the priority
       *   of the caller if there are no available resources.  Lower numbers mean higher
       *   priority.
       *
       * @returns {Promise}
       */
      acquire(priority) {
        if (this._started === false && this._config.autostart === false) {
          this.start();
        }
        if (this._draining) {
          return this._Promise.reject(
            new Error("pool is draining and cannot accept work")
          );
        }
        if (this.spareResourceCapacity < 1 && this._availableObjects.length < 1 && this._config.maxWaitingClients !== void 0 && this._waitingClientsQueue.length >= this._config.maxWaitingClients) {
          return this._Promise.reject(
            new Error("max waitingClients count exceeded")
          );
        }
        const resourceRequest = new ResourceRequest(
          this._config.acquireTimeoutMillis,
          this._Promise
        );
        this._waitingClientsQueue.enqueue(resourceRequest, priority);
        this._dispense();
        return resourceRequest.promise;
      }
      /**
       * [use method, aquires a resource, passes the resource to a user supplied function and releases it]
       * @param  {Function} fn [a function that accepts a resource and returns a promise that resolves/rejects once it has finished using the resource]
       * @return {Promise}      [resolves once the resource is released to the pool]
       */
      use(fn, priority) {
        return this.acquire(priority).then((resource) => {
          return fn(resource).then(
            (result) => {
              this.release(resource);
              return result;
            },
            (err) => {
              this.destroy(resource);
              throw err;
            }
          );
        });
      }
      /**
       * Check if resource is currently on loan from the pool
       *
       * @param {Function} resource
       *    Resource for checking.
       *
       * @returns {Boolean}
       *  True if resource belongs to this pool and false otherwise
       */
      isBorrowedResource(resource) {
        return this._resourceLoans.has(resource);
      }
      /**
       * Return the resource to the pool when it is no longer required.
       *
       * @param {Object} resource
       *   The acquired object to be put back to the pool.
       */
      release(resource) {
        const loan = this._resourceLoans.get(resource);
        if (loan === void 0) {
          return this._Promise.reject(
            new Error("Resource not currently part of this pool")
          );
        }
        this._resourceLoans.delete(resource);
        loan.resolve();
        const pooledResource = loan.pooledResource;
        pooledResource.deallocate();
        this._addPooledResourceToAvailableObjects(pooledResource);
        this._dispense();
        return this._Promise.resolve();
      }
      /**
       * Request the resource to be destroyed. The factory's destroy handler
       * will also be called.
       *
       * This should be called within an acquire() block as an alternative to release().
       *
       * @param {Object} resource
       *   The acquired resource to be destoyed.
       */
      destroy(resource) {
        const loan = this._resourceLoans.get(resource);
        if (loan === void 0) {
          return this._Promise.reject(
            new Error("Resource not currently part of this pool")
          );
        }
        this._resourceLoans.delete(resource);
        loan.resolve();
        const pooledResource = loan.pooledResource;
        pooledResource.deallocate();
        this._destroy(pooledResource);
        this._dispense();
        return this._Promise.resolve();
      }
      _addPooledResourceToAvailableObjects(pooledResource) {
        pooledResource.idle();
        if (this._config.fifo === true) {
          this._availableObjects.push(pooledResource);
        } else {
          this._availableObjects.unshift(pooledResource);
        }
      }
      /**
       * Disallow any new acquire calls and let the request backlog dissapate.
       * The Pool will no longer attempt to maintain a "min" number of resources
       * and will only make new resources on demand.
       * Resolves once all resource requests are fulfilled and all resources are returned to pool and available...
       * Should probably be called "drain work"
       * @returns {Promise}
       */
      drain() {
        this._draining = true;
        return this.__allResourceRequestsSettled().then(() => {
          return this.__allResourcesReturned();
        }).then(() => {
          this._descheduleEvictorRun();
        });
      }
      __allResourceRequestsSettled() {
        if (this._waitingClientsQueue.length > 0) {
          return reflector(this._waitingClientsQueue.tail.promise);
        }
        return this._Promise.resolve();
      }
      // FIXME: this is a horrific mess
      __allResourcesReturned() {
        const ps = Array.from(this._resourceLoans.values()).map((loan) => loan.promise).map(reflector);
        return this._Promise.all(ps);
      }
      /**
       * Forcibly destroys all available resources regardless of timeout.  Intended to be
       * invoked as part of a drain.  Does not prevent the creation of new
       * resources as a result of subsequent calls to acquire.
       *
       * Note that if factory.min > 0 and the pool isn't "draining", the pool will destroy all idle resources
       * in the pool, but replace them with newly created resources up to the
       * specified factory.min value.  If this is not desired, set factory.min
       * to zero before calling clear()
       *
       */
      clear() {
        const reflectedCreatePromises = Array.from(
          this._factoryCreateOperations
        ).map(reflector);
        return this._Promise.all(reflectedCreatePromises).then(() => {
          for (const resource of this._availableObjects) {
            this._destroy(resource);
          }
          const reflectedDestroyPromises = Array.from(
            this._factoryDestroyOperations
          ).map(reflector);
          return reflector(this._Promise.all(reflectedDestroyPromises));
        });
      }
      /**
       * Waits until the pool is ready.
       * We define ready by checking if the current resource number is at least
       * the minimum number defined.
       * @returns {Promise} that resolves when the minimum number is ready.
       */
      ready() {
        return new this._Promise((resolve) => {
          const isReady = () => {
            if (this.available >= this.min) {
              resolve();
            } else {
              setTimeout(isReady, 100);
            }
          };
          isReady();
        });
      }
      /**
       * How many resources are available to allocated
       * (includes resources that have not been tested and may faul validation)
       * NOTE: internal for now as the name is awful and might not be useful to anyone
       * @return {Number} number of resources the pool has to allocate
       */
      get _potentiallyAllocableResourceCount() {
        return this._availableObjects.length + this._testOnBorrowResources.size + this._testOnReturnResources.size + this._factoryCreateOperations.size;
      }
      /**
       * The combined count of the currently created objects and those in the
       * process of being created
       * Does NOT include resources in the process of being destroyed
       * sort of legacy...
       * @return {Number}
       */
      get _count() {
        return this._allObjects.size + this._factoryCreateOperations.size;
      }
      /**
       * How many more resources does the pool have room for
       * @return {Number} number of resources the pool could create before hitting any limits
       */
      get spareResourceCapacity() {
        return this._config.max - (this._allObjects.size + this._factoryCreateOperations.size);
      }
      /**
       * see _count above
       * @return {Number} [description]
       */
      get size() {
        return this._count;
      }
      /**
       * number of available resources
       * @return {Number} [description]
       */
      get available() {
        return this._availableObjects.length;
      }
      /**
       * number of resources that are currently acquired
       * @return {Number} [description]
       */
      get borrowed() {
        return this._resourceLoans.size;
      }
      /**
       * number of waiting acquire calls
       * @return {Number} [description]
       */
      get pending() {
        return this._waitingClientsQueue.length;
      }
      /**
       * maximum size of the pool
       * @return {Number} [description]
       */
      get max() {
        return this._config.max;
      }
      /**
       * minimum size of the pool
       * @return {Number} [description]
       */
      get min() {
        return this._config.min;
      }
    };
    module.exports = Pool;
  }
});

// node_modules/generic-pool/index.js
var require_generic_pool = __commonJS({
  "node_modules/generic-pool/index.js"(exports, module) {
    var Pool = require_Pool();
    var Deque = require_Deque();
    var PriorityQueue = require_PriorityQueue();
    var DefaultEvictor = require_DefaultEvictor();
    module.exports = {
      Pool,
      Deque,
      PriorityQueue,
      DefaultEvictor,
      createPool: function(factory, config) {
        return new Pool(DefaultEvictor, Deque, PriorityQueue, factory, config);
      }
    };
  }
});

// node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);
var eventemitter3_default = import_index.default;

// src/core/systems/System.js
var System = class extends eventemitter3_default {
  constructor(world) {
    super();
    this.world = world;
    if (this.constructor.DEPS) {
      for (const [key, service] of Object.entries(this.constructor.DEPS)) {
        Object.defineProperty(this, key, {
          get: () => this.world[service],
          configurable: true
        });
      }
    }
  }
  async init() {
  }
  start() {
    if (this.constructor.EVENTS && this.events) {
      for (const [event, method] of Object.entries(this.constructor.EVENTS)) {
        if (typeof this[method] === "function") {
          this.events.on(event, this[method].bind ? this[method].bind(this) : this[method]);
        }
      }
    }
  }
  preTick() {
  }
  preFixedUpdate(willFixedStep) {
  }
  fixedUpdate(delta) {
  }
  postFixedUpdate() {
  }
  preUpdate(alpha) {
  }
  update(delta) {
  }
  postUpdate() {
  }
  lateUpdate(delta) {
  }
  postLateUpdate() {
  }
  commit() {
  }
  postTick() {
  }
  destroy() {
  }
};

// src/core/storage.js
var LocalStorage = class {
  get(key, defaultValue = null) {
    const data = localStorage.getItem(key);
    if (data === void 0) return defaultValue;
    let value;
    try {
      value = JSON.parse(data);
    } catch (err) {
      value = null;
    }
    if (value === void 0) return defaultValue;
    return value || defaultValue;
  }
  set(key, value) {
    if (value === void 0 || value === null) {
      localStorage.removeItem(key);
    } else {
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
    }
  }
  remove(key) {
    localStorage.removeItem(key);
  }
};
var storage = new LocalStorage();

// src/client/utils.js
function cls(...args) {
  let str = "";
  for (const arg of args) {
    if (typeof arg === "string") {
      str += " " + arg;
    } else if (typeof arg === "object") {
      for (const key in arg) {
        const value = arg[key];
        if (value) str += " " + key;
      }
    }
  }
  return str;
}
var isClient = typeof window !== "undefined";
var coarse = isClient ? window.matchMedia("(pointer: coarse)").matches : false;
var noHover = isClient ? window.matchMedia("(hover: none)").matches : false;
var hasTouch = isClient ? navigator.maxTouchPoints > 0 : false;
var isTouch = coarse && hasTouch || noHover && hasTouch;

// src/core/extras/ButtonDefinitions.js
var buttons = /* @__PURE__ */ new Set([
  "keyA",
  "keyB",
  "keyC",
  "keyD",
  "keyE",
  "keyF",
  "keyG",
  "keyH",
  "keyI",
  "keyJ",
  "keyK",
  "keyL",
  "keyM",
  "keyN",
  "keyO",
  "keyP",
  "keyQ",
  "keyR",
  "keyS",
  "keyT",
  "keyU",
  "keyV",
  "keyW",
  "keyX",
  "keyY",
  "keyZ",
  "digit0",
  "digit1",
  "digit2",
  "digit3",
  "digit4",
  "digit5",
  "digit6",
  "digit7",
  "digit8",
  "digit9",
  "minus",
  "equal",
  "bracketLeft",
  "bracketRight",
  "backslash",
  "semicolon",
  "quote",
  "backquote",
  "comma",
  "period",
  "slash",
  "arrowUp",
  "arrowDown",
  "arrowLeft",
  "arrowRight",
  "home",
  "end",
  "pageUp",
  "pageDown",
  "tab",
  "capsLock",
  "shiftLeft",
  "shiftRight",
  "controlLeft",
  "controlRight",
  "altLeft",
  "altRight",
  "enter",
  "space",
  "backspace",
  "delete",
  "escape",
  "mouseLeft",
  "mouseRight",
  "metaLeft"
]);

// src/core/extras/ButtonMappings.js
var baseCodeToProp = {
  KeyA: "keyA",
  KeyB: "keyB",
  KeyC: "keyC",
  KeyD: "keyD",
  KeyE: "keyE",
  KeyF: "keyF",
  KeyG: "keyG",
  KeyH: "keyH",
  KeyI: "keyI",
  KeyJ: "keyJ",
  KeyK: "keyK",
  KeyL: "keyL",
  KeyM: "keyM",
  KeyN: "keyN",
  KeyO: "keyO",
  KeyP: "keyP",
  KeyQ: "keyQ",
  KeyR: "keyR",
  KeyS: "keyS",
  KeyT: "keyT",
  KeyU: "keyU",
  KeyV: "keyV",
  KeyW: "keyW",
  KeyX: "keyX",
  KeyY: "keyY",
  KeyZ: "keyZ",
  Digit0: "digit0",
  Digit1: "digit1",
  Digit2: "digit2",
  Digit3: "digit3",
  Digit4: "digit4",
  Digit5: "digit5",
  Digit6: "digit6",
  Digit7: "digit7",
  Digit8: "digit8",
  Digit9: "digit9",
  Minus: "minus",
  Equal: "equal",
  BracketLeft: "bracketLeft",
  BracketRight: "bracketRight",
  Backslash: "backslash",
  Semicolon: "semicolon",
  Quote: "quote",
  Backquote: "backquote",
  Comma: "comma",
  Period: "period",
  Slash: "slash",
  ArrowUp: "arrowUp",
  ArrowDown: "arrowDown",
  ArrowLeft: "arrowLeft",
  ArrowRight: "arrowRight",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
  Tab: "tab",
  CapsLock: "capsLock",
  ShiftLeft: "shiftLeft",
  ShiftRight: "shiftRight",
  ControlLeft: "controlLeft",
  ControlRight: "controlRight",
  AltLeft: "altLeft",
  AltRight: "altRight",
  Enter: "enter",
  Space: "space",
  Backspace: "backspace",
  Delete: "delete",
  Escape: "escape",
  MouseLeft: "mouseLeft",
  MouseRight: "mouseRight",
  MetaLeft: "metaLeft"
};
var basePropToLabel = {
  keyA: "A",
  keyB: "B",
  keyC: "C",
  keyD: "D",
  keyE: "E",
  keyF: "F",
  keyG: "G",
  keyH: "H",
  keyI: "I",
  keyJ: "J",
  keyK: "K",
  keyL: "L",
  keyM: "M",
  keyN: "N",
  keyO: "O",
  keyP: "P",
  keyQ: "Q",
  keyR: "R",
  keyS: "S",
  keyT: "T",
  keyU: "U",
  keyV: "V",
  keyW: "W",
  keyX: "X",
  keyY: "Y",
  keyZ: "Z",
  digit0: "0",
  digit1: "1",
  digit2: "2",
  digit3: "3",
  digit4: "4",
  digit5: "5",
  digit6: "6",
  digit7: "7",
  digit8: "8",
  digit9: "9",
  minus: "-",
  equal: "=",
  bracketLeft: "[",
  bracketRight: "]",
  backslash: "\\",
  semicolon: ";",
  quote: '"',
  backquote: "`",
  comma: ",",
  period: ".",
  slash: "/",
  arrowUp: "Up",
  arrowDown: "Down",
  arrowLeft: "Left",
  arrowRight: "Right",
  home: "Home",
  end: "End",
  pageUp: "PageUp",
  pageDown: "PageDown",
  tab: "Tab",
  capsLock: "CapsLock",
  shiftLeft: "Shift",
  shiftRight: "Shift",
  controlLeft: "Ctrl",
  controlRight: "Ctrl",
  altLeft: "Alt",
  altRight: "Alt",
  enter: "Enter",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  escape: "Esc",
  mouseLeft: "LMB",
  mouseRight: "RMB",
  metaLeft: "Cmd"
};
function generateInverse(mapping) {
  const inverse = {};
  for (const [key, value] of Object.entries(mapping)) {
    inverse[value] = key;
  }
  return inverse;
}
var codeToProp = baseCodeToProp;
var propToCode = generateInverse(baseCodeToProp);
var propToLabel = basePropToLabel;

// src/core/patterns/UnifiedEventEmitter.js
var UnifiedEventEmitter = class _UnifiedEventEmitter extends eventemitter3_default {
  constructor(name = "UnifiedEventEmitter") {
    super();
    this.name = name;
    this.logger = new StructuredLogger(name);
    this._priorityHandlers = /* @__PURE__ */ new Map();
  }
  on(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== "function") {
      throw new Error("Invalid event name or handler");
    }
    if (options.priority !== void 0 && options.priority !== 0) {
      if (!this._priorityHandlers.has(eventName)) {
        this._priorityHandlers.set(eventName, []);
      }
      const handlers = this._priorityHandlers.get(eventName);
      handlers.push({ handler, priority: options.priority });
      handlers.sort((a, b) => a.priority - b.priority);
      const wrapped = (...args) => handler(...args);
      super.on(eventName, wrapped);
      wrapped._original = handler;
      return () => this.off(eventName, handler);
    }
    super.on(eventName, handler);
    return () => this.off(eventName, handler);
  }
  once(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== "function") {
      throw new Error("Invalid event name or handler");
    }
    super.once(eventName, handler);
    return () => this.off(eventName, handler);
  }
  off(eventName, handler) {
    return super.off(eventName, handler) || false;
  }
  emit(eventName, ...args) {
    try {
      return super.emit(eventName, ...args);
    } catch (err) {
      this.logger.error(`Handler error for event '${eventName}'`, {
        error: err.message,
        stack: err.stack
      });
      return false;
    }
  }
  clear(eventName) {
    if (eventName) {
      this.removeAllListeners(eventName);
      this._priorityHandlers.delete(eventName);
    } else {
      this.removeAllListeners();
      this._priorityHandlers.clear();
    }
  }
  getListeners(eventName) {
    return this.listeners(eventName);
  }
  listenerCount(eventName) {
    return this.listenerCount(eventName);
  }
  eventNames() {
    return this.eventNames();
  }
  [/* @__PURE__ */ Symbol.for("dispose")]() {
    this.clear();
  }
  static create() {
    return new _UnifiedEventEmitter();
  }
  static createWith(defaultHandlers = {}) {
    const emitter = new _UnifiedEventEmitter();
    for (const [event, handler] of Object.entries(defaultHandlers)) {
      if (typeof handler === "function") {
        emitter.on(event, handler);
      }
    }
    return emitter;
  }
};

// node_modules/nanoid/index.browser.js
var random = (bytes) => crypto.getRandomValues(new Uint8Array(bytes));
var customRandom = (alphabet, defaultSize, getRandom) => {
  let mask = (2 << Math.log2(alphabet.length - 1)) - 1;
  let step = -~(1.6 * mask * defaultSize / alphabet.length);
  return (size = defaultSize) => {
    let id = "";
    while (true) {
      let bytes = getRandom(step);
      let j = step | 0;
      while (j--) {
        id += alphabet[bytes[j] & mask] || "";
        if (id.length >= size) return id;
      }
    }
  };
};
var customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size | 0, random);

// src/core/utils/helpers/misc.js
var ALPHABET = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var uuid = customAlphabet(ALPHABET, 10);
function clamp(n, low, high) {
  return Math.max(Math.min(n, high), low);
}

// src/core/Props.js
var properties = {
  position: { type: "vector3", default: [0, 0, 0] },
  quaternion: { type: "quaternion", default: [0, 0, 0, 1] },
  scale: { type: "vector3", default: [1, 1, 1] },
  rotation: { type: "euler", default: [0, 0, 0] },
  visible: { type: "boolean", default: true },
  active: { type: "boolean", default: true },
  type: { type: "string", default: "box" },
  width: { type: "number", default: 1 },
  height: { type: "number", default: 1 },
  depth: { type: "number", default: 1 },
  radius: { type: "number", default: 0.5 },
  widthSegments: { type: "number", default: 1 },
  heightSegments: { type: "number", default: 1 },
  linked: { type: "string", default: null },
  castShadow: { type: "boolean", default: true },
  receiveShadow: { type: "boolean", default: true },
  color: { type: "color", default: "#ffffff" },
  metalness: { type: "number", default: 0 },
  roughness: { type: "number", default: 1 },
  emissive: { type: "color", default: "#000000" },
  opacity: { type: "number", default: 1 },
  transparent: { type: "boolean", default: false },
  src: { type: "string", default: null },
  fit: { type: "string", default: "cover" },
  pivot: { type: "string", default: "center" },
  screenId: { type: "string", default: null },
  aspect: { type: "number", default: null },
  volume: { type: "number", default: 1 },
  loop: { type: "boolean", default: false },
  group: { type: "string", default: "default" },
  spatial: { type: "boolean", default: false },
  distanceModel: { type: "string", default: "inverse" },
  refDistance: { type: "number", default: 1 },
  maxDistance: { type: "number", default: 1e4 },
  rolloffFactor: { type: "number", default: 1 },
  coneInnerAngle: { type: "number", default: 360 },
  coneOuterAngle: { type: "number", default: 0 },
  coneOuterGain: { type: "number", default: 0 },
  mass: { type: "number", default: 1 },
  damping: { type: "number", default: 0.04 },
  angularDamping: { type: "number", default: 0.04 },
  friction: { type: "number", default: 0.3 },
  restitution: { type: "number", default: 0.3 },
  tag: { type: "string", default: null },
  trigger: { type: "boolean", default: false },
  convex: { type: "boolean", default: true },
  limits: { type: "vector3", default: [0, 0, 0] },
  stiffness: { type: "number", default: 1 },
  joint_damping: { type: "number", default: 0.01 },
  collide: { type: "boolean", default: false },
  breakForce: { type: "number", default: Infinity },
  breakTorque: { type: "number", default: Infinity },
  display: { type: "string", default: "flex" },
  flexDirection: { type: "string", default: "row" },
  justifyContent: { type: "string", default: "flex-start" },
  alignItems: { type: "string", default: "stretch" },
  gap: { type: "number", default: 0 },
  flexBasis: { type: "string", default: "auto" },
  flexGrow: { type: "number", default: 0 },
  flexShrink: { type: "number", default: 1 },
  absolute: { type: "boolean", default: false },
  top: { type: "string", default: "auto" },
  right: { type: "string", default: "auto" },
  bottom: { type: "string", default: "auto" },
  left: { type: "string", default: "auto" },
  margin: { type: "string", default: "0" },
  padding: { type: "string", default: "0" },
  backgroundColor: { type: "color", default: "transparent" },
  borderWidth: { type: "number", default: 0 },
  borderColor: { type: "color", default: "#000000" },
  borderRadius: { type: "number", default: 0 },
  value: { type: "string", default: "" },
  fontSize: { type: "number", default: 16 },
  lineHeight: { type: "number", default: 1.2 },
  textAlign: { type: "string", default: "left" },
  fontFamily: { type: "string", default: "system-ui" },
  fontWeight: { type: "string", default: "400" },
  textColor: { type: "color", default: "#000000" },
  life: { type: "number", default: 1 },
  speed: { type: "number", default: 1 },
  rotate: { type: "boolean", default: false },
  blending: { type: "string", default: "normal" },
  emitting: { type: "boolean", default: true },
  shape: { type: "string", default: "sphere" },
  direction: { type: "vector3", default: [0, 1, 0] },
  rate: { type: "number", default: 100 },
  bursts: { type: "array", default: [] },
  duration: { type: "number", default: 1 },
  max: { type: "number", default: 100 },
  velocityLinear: { type: "vector3", default: [0, 0, 0] },
  velocityOrbital: { type: "vector3", default: [0, 0, 0] },
  colorOverLife: { type: "string", default: null },
  alphaOverLife: { type: "string", default: null },
  health: { type: "number", default: 100 },
  scaleAware: { type: "boolean", default: false },
  bg: { type: "string", default: null },
  hdr: { type: "string", default: null },
  rotationY: { type: "number", default: 0 },
  sunDirection: { type: "vector3", default: [1, 1, 1] },
  sunIntensity: { type: "number", default: 1 },
  fogNear: { type: "number", default: 0 },
  fogFar: { type: "number", default: 1e3 },
  fogColor: { type: "color", default: "#cccccc" },
  url: { type: "string", default: null },
  text: { type: "string", default: null },
  model: { type: "string", default: null },
  name: { type: "string", default: "" },
  description: { type: "string", default: "" },
  layer: { type: "number", default: 0 },
  renderLayer: { type: "string", default: "default" }
};
function buildSchema(keys) {
  const schema2 = {};
  for (const key of keys) {
    if (properties[key]) schema2[key] = properties[key];
  }
  return schema2;
}
function propSchema(keys) {
  return buildSchema(keys);
}

// src/core/utils/helpers/defineProperty.js
function defineProps(target, schema2, defaults = {}, data = {}) {
  for (const [key, config] of Object.entries(schema2)) {
    const privateKey = `_${key}`;
    const initialValue = data[key] !== void 0 ? data[key] : defaults[key] ?? config.default ?? null;
    Object.defineProperty(target, key, {
      get() {
        return this[privateKey];
      },
      set(value) {
        if (value === void 0) {
          value = defaults[key] ?? config.default;
        }
        if (config.validate) {
          const error = config.validate(value);
          if (error) throw new Error(error);
        }
        this[privateKey] = value;
        if (config.onSet) {
          config.onSet.call(this, value);
        }
      },
      configurable: true,
      enumerable: false
    });
    if (!target.hasOwnProperty(privateKey)) {
      target[privateKey] = initialValue;
    }
  }
}
function onSetRebuild() {
  return function() {
    this.needsRebuild = true;
    this.setDirty();
  };
}
function onSetRebuildIf(condition) {
  return function() {
    if (condition.call(this)) {
      this.needsRebuild = true;
      this.setDirty();
    }
  };
}
function createPropertyProxy(instance, propertySchema, superProxy, customMethods = {}, customProperties = {}) {
  const self = instance;
  const proxy = {};
  for (const key in propertySchema) {
    const propKey = `_${key}` in self ? `_${key}` : key;
    Object.defineProperty(proxy, key, {
      get() {
        return self[propKey];
      },
      set(value) {
        self[propKey] = value;
      },
      enumerable: true,
      configurable: true
    });
  }
  for (const [name, prop2] of Object.entries(customProperties)) {
    if (typeof prop2 === "function") {
      Object.defineProperty(proxy, name, {
        get: prop2.bind(self),
        enumerable: true,
        configurable: true
      });
    } else {
      Object.defineProperty(proxy, name, {
        get: prop2.get ? prop2.get.bind(self) : void 0,
        set: prop2.set ? prop2.set.bind(self) : void 0,
        enumerable: true,
        configurable: true
      });
    }
  }
  for (const [name, method] of Object.entries(customMethods)) {
    proxy[name] = method.bind(self);
  }
  Object.defineProperty(proxy, "ref", {
    get() {
      return self;
    },
    enumerable: false,
    configurable: true
  });
  return Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(superProxy));
}

// src/core/utils/validation/createNodeSchema.js
var SchemaBuilder = class {
  constructor(propKeys = []) {
    this.props = propSchema(propKeys);
    this.overrides = {};
  }
  override(key, { default: def, validate, onSet }) {
    this.overrides[key] = {};
    if (def !== void 0) this.overrides[key].default = def;
    if (validate) this.overrides[key].validate = validate;
    if (onSet) this.overrides[key].onSet = onSet;
    return this;
  }
  overrideAll(overridesMap) {
    for (const [key, config] of Object.entries(overridesMap)) {
      this.override(key, config);
    }
    return this;
  }
  add(key, { default: def, validate, onSet }) {
    if (!this.props[key]) {
      this.props[key] = {};
    }
    if (def !== void 0) this.props[key].default = def;
    if (validate) this.props[key].validate = validate;
    if (onSet) this.props[key].onSet = onSet;
    return this;
  }
  withRebuild() {
    for (const key of Object.keys(this.props)) {
      if (!this.overrides[key]?.onSet) {
        this.override(key, { onSet: onSetRebuild() });
      }
    }
    return this;
  }
  build() {
    const schema2 = {};
    for (const [key, base] of Object.entries(this.props)) {
      schema2[key] = { ...base, ...this.overrides[key] };
    }
    return schema2;
  }
};
function schema(...propKeys) {
  return new SchemaBuilder(propKeys);
}

// src/core/utils/helpers/crypto.js
var jwtSecret = typeof process !== "undefined" ? process.env.JWT_SECRET : null;

// src/core/utils-client.js
async function hashFile2(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// src/core/extras/ranks.js
var Ranks = {
  ADMIN: 2,
  BUILDER: 1,
  VISITOR: 0
};
var hasRank = (playerRank, minRank) => {
  return playerRank >= minRank;
};

// src/core/validation/BaseValidator.js
var BaseValidator = class {
  constructor(name) {
    this.name = name;
  }
  validate(data) {
    const errors = this.getErrors(data);
    if (errors.length) {
      const error = new Error(`Validation failed: ${errors[0]}`);
      error.name = "ValidationError";
      error.errors = errors;
      error.validator = this.name;
      throw error;
    }
    return this.clean(data);
  }
  getErrors(data) {
    return [];
  }
  clean(data) {
    return data;
  }
  getSchema() {
    return null;
  }
};

// src/core/schemas/AppBlueprint.schema.js
var BlueprintSchema = {
  id: {
    type: "string",
    required: true,
    description: "Unique identifier for the blueprint"
  },
  name: {
    type: "string",
    required: false,
    default: "",
    description: "Display name for the app"
  },
  model: {
    type: "string",
    required: true,
    description: "URL or asset:// path to GLB/VRM model"
  },
  script: {
    type: "string",
    required: false,
    description: "URL or asset:// path to JS script"
  },
  description: {
    type: "string",
    required: false,
    default: "",
    description: "App description"
  },
  preview: {
    type: "string",
    required: false,
    description: "Preview image URL"
  },
  disabled: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, app will not be instantiated"
  },
  scene: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, marks app as scene (different UI treatment)"
  },
  listable: {
    type: "boolean",
    required: false,
    default: true,
    description: "If true, appears in app browser"
  },
  tags: {
    type: "array",
    required: false,
    default: [],
    description: "Array of tag strings for categorization"
  },
  authors: {
    type: "array",
    required: false,
    default: [],
    description: "Array of author names"
  },
  version: {
    type: "string",
    required: false,
    description: "Blueprint version string"
  },
  icon: {
    type: "string",
    required: false,
    description: "Icon URL for app"
  },
  props: {
    type: "object",
    required: false,
    description: "Custom properties passed to script"
  },
  preload: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, preload assets"
  },
  public: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, app is publicly accessible"
  },
  locked: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, app cannot be modified"
  },
  frozen: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, app state is frozen"
  },
  unique: {
    type: "boolean",
    required: false,
    default: false,
    description: "If true, only one instance allowed"
  }
};
function validateBlueprint(blueprint) {
  if (!blueprint) {
    return { valid: false, error: "Blueprint is null or undefined" };
  }
  if (typeof blueprint !== "object") {
    return { valid: false, error: "Blueprint must be an object" };
  }
  for (const [key, schema2] of Object.entries(BlueprintSchema)) {
    const value = blueprint[key];
    if (schema2.required && (value === void 0 || value === null)) {
      return { valid: false, error: `Blueprint missing required field: ${key}` };
    }
    if (value !== void 0 && value !== null) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== schema2.type) {
        return { valid: false, error: `Blueprint ${key} must be ${schema2.type}, got ${actualType}` };
      }
    }
  }
  return { valid: true };
}
function normalizeBlueprint(data) {
  const normalized = { ...data };
  for (const [key, schema2] of Object.entries(BlueprintSchema)) {
    if (schema2.default !== void 0 && (normalized[key] === void 0 || normalized[key] === null)) {
      normalized[key] = Array.isArray(schema2.default) ? [...schema2.default] : schema2.default;
    }
  }
  if (normalized.version && typeof normalized.version !== "string") {
    normalized.version = String(normalized.version);
  }
  return normalized;
}
function isListableApp(blueprint) {
  if (!blueprint) return false;
  if (!blueprint.model) return false;
  if (blueprint.disabled) return false;
  if (blueprint.scene) return false;
  if (blueprint.listable === false) return false;
  return true;
}

// src/core/validation/AppValidator.js
var logger = new StructuredLogger("AppValidator");
var AppValidator = class extends BaseValidator {
  constructor() {
    super("AppValidator");
  }
  validateBlueprint(blueprint) {
    return validateBlueprint(blueprint);
  }
  normalizeBlueprint(blueprint) {
    return normalizeBlueprint(blueprint);
  }
  validateAppEntity(entity, blueprintMap) {
    if (!entity) {
      return { valid: false, error: "Entity is null or undefined" };
    }
    if (!entity.type || entity.type !== "app") {
      return { valid: false, error: `Entity type must be 'app', got '${entity.type}'` };
    }
    if (!entity.blueprintId && !entity.blueprint) {
      return { valid: false, error: "App entity missing blueprint ID" };
    }
    const blueprintId = entity.blueprintId || entity.blueprint;
    if (typeof blueprintId !== "string") {
      return { valid: false, error: "Blueprint ID must be a string" };
    }
    const blueprint = blueprintMap.get(blueprintId);
    if (!blueprint) {
      return { valid: false, error: `Blueprint '${blueprintId}' does not exist` };
    }
    return this.validateBlueprint(blueprint);
  }
  isAppListable(app, blueprintMap) {
    if (!app || app.type !== "app") {
      return false;
    }
    const blueprintId = app.blueprintId || app.blueprint;
    if (!blueprintId) {
      return false;
    }
    const blueprint = blueprintMap.get(blueprintId);
    if (!blueprint) {
      return false;
    }
    return isListableApp(blueprint);
  }
  filterListableApps(apps, blueprintMap) {
    if (!Array.isArray(apps)) {
      return [];
    }
    return apps.filter((app) => {
      try {
        return this.isAppListable(app, blueprintMap);
      } catch (err) {
        logger.warn("App failed listability check", { appId: app?.id, error: err.message });
        return false;
      }
    });
  }
  getValidationErrors(blueprint) {
    const errors = [];
    if (!blueprint) {
      errors.push("Blueprint is null or undefined");
      return errors;
    }
    const result = this.validateBlueprint(blueprint);
    if (!result.valid) {
      errors.push(result.error);
    }
    return errors;
  }
};

// src/core/config/SystemConfig.js
var env = typeof process !== "undefined" && process.env ? process.env : {};
var getFloat = (key, def) => parseFloat(env[key] ?? def);
var getInt = (key, def) => parseInt(env[key] ?? def);
var PhysicsConfig = {
  CAPSULE_RADIUS: getFloat("PHYSICS_CAPSULE_RADIUS", 0.3),
  CAPSULE_HEIGHT: getFloat("PHYSICS_CAPSULE_HEIGHT", 1.8),
  MASS: getFloat("PHYSICS_MASS", 70),
  GRAVITY: getFloat("PHYSICS_GRAVITY", 9.81),
  GROUND_DRAG: getFloat("PHYSICS_GROUND_DRAG", 0.8),
  AIR_DRAG: getFloat("PHYSICS_AIR_DRAG", 0.1),
  JUMP_HEIGHT: getFloat("PHYSICS_JUMP_HEIGHT", 1.5),
  JUMP_IMPULSE: getFloat("PHYSICS_JUMP_IMPULSE", 7),
  MAX_AIR_JUMPS: getInt("PHYSICS_MAX_AIR_JUMPS", 1),
  WALK_SPEED: getFloat("PHYSICS_WALK_SPEED", 4),
  RUN_SPEED: getFloat("PHYSICS_RUN_SPEED", 7),
  FLY_SPEED: getFloat("PHYSICS_FLY_SPEED", 10),
  FLY_DRAG: getFloat("PHYSICS_FLY_DRAG", 0.95),
  FLY_FORCE_MULTIPLIER: getFloat("PHYSICS_FLY_FORCE", 3),
  GROUND_DETECTION_RADIUS: getFloat("PHYSICS_GROUND_RADIUS", 0.35),
  GROUND_SLOPE_MAX: getFloat("PHYSICS_GROUND_SLOPE", 0.5),
  GROUND_SLOPE_THRESHOLD: getFloat("PHYSICS_GROUND_THRESHOLD", 0.3),
  GROUND_SWEEP_OFFSET: getFloat("PHYSICS_GROUND_SWEEP_OFFSET", 0.12),
  GROUND_SWEEP_DISTANCE: getFloat("PHYSICS_GROUND_SWEEP_DISTANCE", 0.1),
  PLATFORM_RAYCAST_DISTANCE: getFloat("PHYSICS_PLATFORM_RAYCAST", 2),
  PLATFORM_RAYCAST_OFFSET: getFloat("PHYSICS_PLATFORM_OFFSET", 0.2),
  PUSH_FORCE_DECAY: getFloat("PHYSICS_PUSH_DECAY", 0.95),
  PUSH_DRAG: getFloat("PHYSICS_PUSH_DRAG", 20),
  FALL_DAMAGE_THRESHOLD: getFloat("PHYSICS_FALL_THRESHOLD", 1.6),
  FALL_TIMER_THRESHOLD: getFloat("PHYSICS_FALL_TIMER", 0.1),
  FALL_VELOCITY: getFloat("PHYSICS_FALL_VELOCITY", -5),
  GRAVITY_PLATFORM_FACTOR: getFloat("PHYSICS_GRAVITY_PLATFORM", 0.2),
  SLIPPING_GRAVITY: getFloat("PHYSICS_SLIPPING_GRAVITY", 0.5),
  DRAG_COEFFICIENT: getFloat("PHYSICS_DRAG_COEFF", 10)
};
var RenderingConfig = {
  SHADOW_MAP_SIZE: getInt("RENDER_SHADOW_SIZE", 2048),
  SHADOW_BIAS: getFloat("RENDER_SHADOW_BIAS", 1e-4),
  SHADOW_NORMAL_BIAS: getFloat("RENDER_SHADOW_NORMAL_BIAS", 0.02),
  CSM_SPLITS: getInt("RENDER_CSM_SPLITS", 4),
  CSM_LAMBDA: getFloat("RENDER_CSM_LAMBDA", 0.5),
  FOG_START: getFloat("RENDER_FOG_START", 10),
  FOG_END: getFloat("RENDER_FOG_END", 1e3),
  FOG_DISTANCE_OFFSET: getFloat("RENDER_FOG_OFFSET", 5),
  ANTIALIASING: env.RENDER_AA !== "false",
  ANISOTROPIC_FILTERING: getInt("RENDER_ANISO", 8),
  PIXEL_RATIO: getFloat("RENDER_PIXEL_RATIO", 1)
};
var NetworkConfig = {
  SERVER_TICK_RATE: getInt("NET_TICK_RATE", 60),
  PLAYER_UPDATE_RATE: getFloat("NET_UPDATE_RATE", 8),
  SNAPSHOT_INTERVAL: getFloat("NET_SNAPSHOT_INTERVAL", 1),
  PING_TIMEOUT: getInt("NET_PING_TIMEOUT", 5e3),
  CONNECTION_TIMEOUT: getInt("NET_CONN_TIMEOUT", 1e4),
  DISCONNECTION_TIMEOUT: getInt("NET_DISC_TIMEOUT", 3e4),
  SAVE_INTERVAL: getInt("SAVE_INTERVAL", 60),
  MAX_UPLOAD_SIZE: getInt("PUBLIC_MAX_UPLOAD_SIZE", 50 * 1024 * 1024),
  UPLOAD_TIMEOUT: getInt("NET_UPLOAD_TIMEOUT", 6e4),
  ENABLE_COMPRESSION: env.NET_COMPRESSION !== "false",
  MAX_MESSAGE_SIZE: getInt("NET_MAX_MSG_SIZE", 1024 * 100)
};
var InputConfig = {
  POINTER_SENSITIVITY: getFloat("INPUT_POINTER_SENS", 1),
  POINTER_LOOK_SPEED: getFloat("INPUT_POINTER_SPEED", 1e-3),
  POINTER_INVERT_Y: env.INPUT_INVERT_Y === "true",
  PAN_LOOK_SPEED: getFloat("INPUT_PAN_SPEED", 2e-3),
  TOUCH_DEADZONE: getFloat("INPUT_DEADZONE", 0.2),
  TOUCH_FULL_EXTENT: getFloat("INPUT_FULL_EXTENT", 0.8),
  ZOOM_SPEED: getFloat("INPUT_ZOOM_SPEED", 0.02),
  ZOOM_MIN: getFloat("INPUT_ZOOM_MIN", 0.1),
  ZOOM_MAX: getFloat("INPUT_ZOOM_MAX", 3),
  FIRST_PERSON_THRESHOLD: getFloat("INPUT_FP_THRESHOLD", 0.9),
  DEFAULT_ZOOM: getFloat("INPUT_DEFAULT_ZOOM", 1.5),
  STICK_DEAD_ZONE: getFloat("INPUT_STICK_DEADZONE", 0.2),
  KEY_REPEAT_DELAY: getInt("INPUT_REPEAT_DELAY", 500),
  KEY_REPEAT_INTERVAL: getInt("INPUT_REPEAT_INTERVAL", 30)
};
var AvatarConfig = {
  VRM_DEFAULT_SCALE: getFloat("AVATAR_SCALE", 1),
  VRM_BLEND_SHAPE_WEIGHT: getFloat("AVATAR_BLEND_WEIGHT", 1),
  ANIMATION_FADE_DURATION: getFloat("ANIM_FADE", 0.2),
  LOCOMOTION_WALK_SPEED: getFloat("ANIM_WALK", 0.5),
  LOCOMOTION_RUN_SPEED: getFloat("ANIM_RUN", 1),
  EMOTE_DURATION: getFloat("EMOTE_DURATION", 3),
  NAMETAG_OFFSET: getFloat("NAMETAG_OFFSET", 2),
  DEFAULT_HEIGHT: getFloat("AVATAR_DEFAULT_HEIGHT", 1.6),
  HEAD_HEIGHT_OFFSET: getFloat("AVATAR_HEAD_OFFSET", 0.2),
  CAM_HEIGHT_FACTOR: getFloat("AVATAR_CAM_HEIGHT_FACTOR", 0.9)
};
var ChatConfig = {
  MAX_MESSAGES: getInt("CHAT_MAX_MESSAGES", 50),
  MESSAGE_TIMEOUT: getInt("CHAT_TIMEOUT", 3e5),
  BUBBLE_DISPLAY_TIME: getFloat("CHAT_BUBBLE_TIME", 5),
  BUBBLE_OFFSET_Y: getFloat("CHAT_BUBBLE_OFFSET", 2),
  MESSAGE_COOLDOWN: getInt("CHAT_COOLDOWN", 100),
  MAX_MESSAGES_PER_MINUTE: getInt("CHAT_RATE_LIMIT", 60)
};
var AudioConfig = {
  MASTER_VOLUME: getFloat("AUDIO_MASTER", 1),
  EFFECTS_VOLUME: getFloat("AUDIO_EFFECTS", 0.8),
  VOICE_VOLUME: getFloat("AUDIO_VOICE", 1),
  MAX_SPATIAL_DISTANCE: getFloat("AUDIO_MAX_DISTANCE", 100),
  VOICE_CODEC: env.AUDIO_CODEC ?? "opus"
};
var PerformanceConfig = {
  TARGET_FPS: getInt("PERF_TARGET_FPS", 60),
  MIN_FRAME_TIME: 1e3 / getInt("PERF_TARGET_FPS", 60),
  MAX_DELTA_TIME: getFloat("PERF_MAX_DELTA", 1 / 30),
  FIXED_DELTA_TIME: getFloat("PERF_FIXED_DELTA", 1 / 50),
  QUALITY_LEVEL: getInt("PERF_QUALITY", 2),
  MAX_CACHED_ASSETS: getInt("PERF_MAX_CACHE", 100),
  ASSET_CLEANUP_INTERVAL: getInt("PERF_CLEANUP", 6e4)
};
var ErrorConfig = {
  CAPTURE_ERRORS: env.CAPTURE_ERRORS !== "false",
  MAX_ERROR_HISTORY: getInt("ERROR_MAX_HISTORY", 500),
  ERROR_CLEANUP_INTERVAL: getInt("ERROR_CLEANUP", 36e5),
  DEBUG_MODE: env.DEBUG === "true",
  VERBOSE_LOGGING: env.VERBOSE === "true",
  LOG_NETWORK_MESSAGES: env.LOG_NETWORK === "true"
};
var BuilderConfig = {
  SNAP_DEGREES: 5,
  SNAP_DISTANCE: 1,
  PROJECT_MAX: 500,
  TRANSFORM_LIMIT: parseInt(env.BUILDER_TRANSFORM_LIMIT ?? 50)
};
var NametagConfig = {
  RESOLUTION: parseInt(env.NAMETAG_RESOLUTION ?? 2),
  GRID_COLS: parseInt(env.NAMETAG_GRID_COLS ?? 5),
  GRID_ROWS: parseInt(env.NAMETAG_GRID_ROWS ?? 20),
  WIDTH: parseInt(env.NAMETAG_WIDTH ?? 200),
  HEIGHT: parseInt(env.NAMETAG_HEIGHT ?? 35)
};
var RenderConfig = {
  ACTION_BATCH_SIZE: parseInt(env.RENDER_ACTION_BATCH ?? 500),
  LOD_BATCH_SIZE: parseInt(env.RENDER_LOD_BATCH ?? 1e3)
};
var WorldConfig = {
  MAX_DELTA_TIME: parseFloat(env.WORLD_MAX_DELTA ?? 1 / 30),
  FIXED_DELTA_TIME: parseFloat(env.WORLD_FIXED_DELTA ?? 1 / 50)
};

// src/core/patterns/BaseManager.js
var BaseManager = class {
  constructor(world, name) {
    this.world = world;
    this.name = name;
    this.logger = new StructuredLogger(name);
    this.emitter = new UnifiedEventEmitter(name);
    this.initialized = false;
    this._resources = [];
  }
  async init() {
    try {
      this.logger.info(`Initializing ${this.name}`);
      await this.initInternal();
      this.initialized = true;
      this.logger.info(`${this.name} initialized`);
    } catch (err) {
      this.logger.error(`Failed to initialize`, { error: err.message });
      throw err;
    }
  }
  async initInternal() {
  }
  async destroy() {
    try {
      await this.destroyInternal();
      this.cleanupResources();
      this.initialized = false;
      this.logger.info(`${this.name} destroyed`);
    } catch (err) {
      this.logger.error(`Failed to destroy`, { error: err.message });
    }
  }
  async destroyInternal() {
  }
  registerResource(resource) {
    if (resource && typeof resource.dispose === "function") {
      this._resources.push(resource);
    }
  }
  cleanupResources() {
    for (const resource of this._resources) {
      try {
        resource.dispose?.();
      } catch (err) {
        this.logger.warn(`Failed to dispose resource`, { error: err.message });
      }
    }
    this._resources = [];
  }
  assertInitialized() {
    if (!this.initialized) {
      throw new Error(`${this.name} not initialized`);
    }
  }
  emit(eventName, ...args) {
    return this.emitter.emit(eventName, ...args);
  }
  on(eventName, handler, options = {}) {
    return this.emitter.on(eventName, handler, options);
  }
  once(eventName, handler, options = {}) {
    return this.emitter.once(eventName, handler, options);
  }
  off(eventName, handler) {
    return this.emitter.off(eventName, handler);
  }
  getResources() {
    return this._resources;
  }
};

// src/core/patterns/AsyncInitializer.js
var logger2 = new StructuredLogger("AsyncInitializer");

// src/core/patterns/SystemInitializer.js
var logger3 = new StructuredLogger("SystemInitializer");

// src/core/utils/pool/ObjectPool.js
var import_generic_pool = __toESM(require_generic_pool(), 1);
var logger4 = new StructuredLogger("ObjectPool");
var ObjectPool = class {
  constructor(Factory, initialSize = 10, name = "ObjectPool") {
    this.Factory = Factory;
    this.name = name;
    this.created = 0;
    this.reused = 0;
    this.returned = 0;
    this.pool = import_generic_pool.default.createPool({
      create: async () => {
        this.created++;
        return new Factory();
      },
      destroy: async (item) => {
        if (item.dispose) {
          item.dispose();
        }
      }
    }, { max: initialSize * 2 });
    for (let i = 0; i < initialSize; i++) {
      this.pool.acquire().then((item) => {
        this.reused++;
        this.pool.release(item);
      });
    }
    logger4.debug(`${name} created`, { initialSize, factoryName: Factory.name });
  }
  acquire() {
    return this.pool.acquire().then((item) => {
      this.reused++;
      return item;
    });
  }
  release(item) {
    if (item) {
      this.returned++;
      return this.pool.release(item).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }
  async clear() {
    await this.pool.drain();
    await this.pool.clear();
    logger4.debug(`${this.name} cleared`);
  }
  getStats() {
    return {
      name: this.name,
      available: this.pool.availableObjectsCount(),
      inUse: this.pool.waitingClientsCount(),
      created: this.created,
      reused: this.reused,
      returned: this.returned,
      reuseRate: this.reused / (this.created + this.reused) || 0
    };
  }
  async destroy() {
    await this.clear();
    this.Factory = null;
  }
};

// src/core/patterns/BaseFactory.js
var BaseFactory = class {
  static create(config) {
    throw new Error("Factory.create(config) must be implemented");
  }
  static validate(config) {
    if (!config || typeof config !== "object") {
      throw new Error(`Factory.validate: config must be an object, got ${typeof config}`);
    }
    return true;
  }
  static createBatch(configs = []) {
    if (!Array.isArray(configs)) {
      throw new Error(`Factory.createBatch: configs must be an array`);
    }
    return configs.map((cfg) => this.create(cfg));
  }
  static pool(name = "default", factory = () => ({}), reset = null) {
    const key = `${this.name}_${name}`;
    if (!this.pools.has(key)) {
      this.pools.set(key, new ObjectPool(factory, reset));
    }
    return this.pools.get(key);
  }
  static resetPool(name = "default") {
    const key = `${this.name}_${name}`;
    if (this.pools.has(key)) {
      this.pools.get(key).reset();
    }
  }
};
__publicField(BaseFactory, "pools", /* @__PURE__ */ new Map());
__publicField(BaseFactory, "logger", new StructuredLogger("BaseFactory"));

// src/core/extras/avatar/playerEmotes.js
var Emotes = {
  IDLE: "asset://mp-idle.glb",
  WALK: "asset://mp-walk.glb?s=1.5",
  WALK_LEFT: "asset://mp-walk-left.glb?s=1.5",
  WALK_RIGHT: "asset://mp-walk-right.glb?s=1.5",
  WALK_BACK: "asset://mp-walk-back.glb?s=1.5",
  RUN: "asset://mp-jog.glb?s=1.4",
  RUN_LEFT: "asset://mp-jog-left.glb?s=1.4",
  RUN_RIGHT: "asset://mp-jog-right.glb?s=1.4",
  RUN_BACK: "asset://mp-jog-back.glb?s=1.4",
  JUMP: "asset://emote-jump.glb",
  FALL: "asset://emote-fall.glb",
  FLY: "asset://emote-float.glb",
  FLIP: "asset://emote-flip.glb?s=1.1",
  TALK: "asset://emote-talk.glb"
};
var emoteUrls = [
  Emotes.IDLE,
  Emotes.WALK,
  Emotes.WALK_LEFT,
  Emotes.WALK_RIGHT,
  Emotes.WALK_BACK,
  Emotes.RUN,
  Emotes.RUN_LEFT,
  Emotes.RUN_RIGHT,
  Emotes.RUN_BACK,
  Emotes.JUMP,
  Emotes.FALL,
  Emotes.FLY,
  Emotes.FLIP,
  Emotes.TALK
];

// src/core/extras/ControlPriorities.js
var ControlPriorities = {
  PLAYER: 0,
  ENTITY: 1,
  APP: 2,
  BUILDER: 3,
  ACTION: 4,
  CORE_UI: 5,
  POINTER: 6
};

// src/core/extras/general.js
var DEG2RAD = three_exports.MathUtils.DEG2RAD;
var RAD2DEG = three_exports.MathUtils.RAD2DEG;

export {
  eventemitter3_default,
  System,
  storage,
  cls,
  isTouch,
  buttons,
  codeToProp,
  propToLabel,
  UnifiedEventEmitter,
  defineProps,
  onSetRebuildIf,
  createPropertyProxy,
  schema,
  uuid,
  clamp,
  hashFile2 as hashFile,
  BaseManager,
  BaseFactory,
  Emotes,
  emoteUrls,
  Ranks,
  hasRank,
  DEG2RAD,
  RAD2DEG,
  AppValidator,
  ControlPriorities,
  PhysicsConfig,
  InputConfig,
  AvatarConfig,
  WorldConfig
};
