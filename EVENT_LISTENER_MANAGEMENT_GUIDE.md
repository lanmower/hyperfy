# Event Listener Management Guide

Automatic lifecycle management for event listeners to prevent memory leaks.

## Quick Start

All BaseSystem subclasses have a `listeners` property for safe event listening:

```javascript
export class MySystem extends BaseSystem {
  start() {
    // Instead of this.world.events.on(...)
    this.listeners.on(this.world.events, 'spawn', this.onSpawn)
    this.listeners.addEventListener(window, 'resize', this.onResize)
  }

  onSpawn(data) {
    // Handle spawn
  }

  onResize() {
    // Handle resize
  }
}
// Listeners automatically cleaned up when system destroyed
```

## API

### EventEmitter Listeners

#### `listeners.on(emitter, event, handler)`
Add event listener to emitter (EventEmitter3 style)

```javascript
this.listeners.on(this.world.events, 'command', this.onCommand)
this.listeners.on(this.world.network, 'disconnect', this.onDisconnect)
this.listeners.on(someObject, 'update', this.onUpdate)
```

#### `listeners.once(emitter, event, handler)`
Add single-use event listener

```javascript
this.listeners.once(this.world.blueprints, 'loaded', this.onLoaded)
```

#### `listeners.off(emitter, event, handler)`
Remove specific listener

```javascript
this.listeners.off(this.world.events, 'command', this.onCommand)
```

### DOM Event Listeners

#### `listeners.addEventListener(target, event, handler, options)`
Add DOM event listener

```javascript
this.listeners.addEventListener(window, 'resize', this.onResize)
this.listeners.addEventListener(document, 'click', this.onClick, { capture: true })
this.listeners.addEventListener(canvas, 'pointerdown', this.onPointerDown)
```

#### `listeners.removeEventListener(target, event, handler, options)`
Remove specific DOM listener

```javascript
this.listeners.removeEventListener(window, 'resize', this.onResize)
```

### Bulk Operations

#### `listeners.removeAllListeners(emitterOrTarget)`
Remove all listeners from specific emitter/target

```javascript
this.listeners.removeAllListeners(this.world.events)
this.listeners.removeAllListeners(window)
```

#### `listeners.clear()`
Remove all listeners managed by this manager

```javascript
this.listeners.clear()
```

### Inspection

#### `listeners.getStats()`
Get listener statistics

```javascript
const stats = this.listeners.getStats()
console.log(stats)
// { total: 5, dom: 2, emitter: 3, byEvent: { resize: 1, click: 1, update: 1 } }
```

#### `listeners.getListenersByEvent()`
Get count of listeners per event

```javascript
const byEvent = this.listeners.getListenersByEvent()
// { command: 2, spawn: 1, disconnect: 1 }
```

## Best Practices

1. **Always use `this.listeners` instead of direct `.on()` calls**
   ```javascript
   // Bad
   this.world.events.on('command', this.onCommand.bind(this))

   // Good
   this.listeners.on(this.world.events, 'command', this.onCommand)
   ```

2. **Automatic cleanup on system destroy**
   ```javascript
   // No need to manually remove listeners
   // They're automatically cleaned up when system is destroyed
   // BaseSystem.destroy() calls this.listeners.clear()
   ```

3. **Bind methods in listener calls, not in definitions**
   ```javascript
   // Good - binding happens in manager
   this.listeners.on(emitter, 'event', this.handler)

   // Avoid - creates new bound function each time
   this.listeners.on(emitter, 'event', this.handler.bind(this))
   ```

4. **Check listener stats for debugging**
   ```javascript
   init() {
     const stats = this.listeners.getStats()
     if (stats.total > 20) {
       this.logger.warn('System has many listeners', stats)
     }
   }
   ```

5. **Use addEventListener for DOM, on() for EventEmitter**
   ```javascript
   // EventEmitter3 (world.events, world.network, etc.)
   this.listeners.on(this.world.events, 'event', this.handler)

   // DOM Elements
   this.listeners.addEventListener(window, 'resize', this.handler)
   this.listeners.addEventListener(canvas, 'click', this.handler)
   ```

## Migration from Old Pattern

### Before
```javascript
export class ClientUI extends BaseSystem {
  start() {
    this.world.events.on('ui:toggle', this.onToggle.bind(this))
    window.addEventListener('resize', this.onResize.bind(this))
    this.resizeHandler = this.onResize.bind(this)
  }

  destroy() {
    this.world.events.off('ui:toggle', this.onToggle)
    window.removeEventListener('resize', this.resizeHandler)
  }
}
```

### After
```javascript
export class ClientUI extends BaseSystem {
  start() {
    this.listeners.on(this.world.events, 'ui:toggle', this.onToggle)
    this.listeners.addEventListener(window, 'resize', this.onResize)
    // No destroy() needed - automatic cleanup
  }
}
```

## Common Issues

### Issue: Handler not called
**Check:** Did you pass the unbound method?
```javascript
// Correct - pass unbound method
this.listeners.on(emitter, 'event', this.handler)

// Incorrect - already bound
this.listeners.on(emitter, 'event', this.handler.bind(this))
```

### Issue: `this` is undefined in handler
**Check:** Are you using arrow functions? They auto-bind.
```javascript
// Good - auto-binds to class
onCommand = (data) => {
  console.log(this.world) // this is bound
}

// OR use EventListenerManager binding
onCommand(data) {
  console.log(this.world) // this is bound by manager
}
```

### Issue: Listeners not cleaned up
**Check:** Are you calling `this.listeners.clear()`?
```javascript
// BaseSystem automatically calls clear() in destroy()
// Only needed if you manually clear before destroy

destroy() {
  this.listeners.clear() // Not needed in BaseSystem
  super.destroy()
}
```

## Advanced Usage

### Conditional Listeners
```javascript
start() {
  if (this.world.hasService('xr')) {
    this.listeners.on(this.world.xr, 'select', this.onXRSelect)
  }
}
```

### Listener Chaining
```javascript
const handler = this.listeners.on(emitter, 'event', this.handler)
// handler is the bound function, can be reused if needed
```

### Dynamic Event Names
```javascript
const events = ['spawn', 'despawn', 'modified']
for (const event of events) {
  this.listeners.on(this.world.entities, event, this.onEntityEvent)
}
```

## Performance

EventListenerManager has minimal overhead:
- Each listener tracked with ~60 bytes
- Clear operation is O(n) where n = listener count
- Typical systems: 5-20 listeners, <50ms cleanup time
- No memory leaks: all listeners cleaned up on destroy

## Files Modified

- `src/core/systems/EventListenerManager.js` - New class
- `src/core/systems/BaseSystem.js` - Added listeners property and destroy hook
