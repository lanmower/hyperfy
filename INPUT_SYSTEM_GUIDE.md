# Input System Guide

Unified input handling architecture with priority-based control binding and multiple input handler support.

## Architecture Overview

```
InputSystem (core input aggregation)
├── PointerInputHandler (mouse/pointer events)
├── KeyboardInputHandler (keyboard events)
├── TouchInputHandler (touch events)
├── XRInputHandler (XR controller input)
└── InputManager (facade for cleaner API)

ClientControls (alias for InputSystem)
ClientActions (uses input for interaction)
PlayerControlBinder (binds player-specific controls)
PlayerInputProcessor (processes camera/movement input)
```

## Core Concepts

### InputSystem

The central input aggregation point that:
- Manages multiple simultaneous input handlers
- Maintains control state (buttons, pointer, scroll, XR input)
- Supports priority-based control binding
- Delegates platform-specific input to handlers

**Location**: `src/core/systems/input/InputSystem.js`

**Key Responsibilities**:
- Button state tracking across all input types
- Pointer lock management (pointer.locked, pointer.shouldLock)
- Control binding with priority-based routing
- Camera and screen state management
- Action list building from bound controls

### InputManager

Facade layer providing:
- Cleaner control binding API
- Handler registration/unregistration
- Bound control lifecycle management
- State query methods (pointer, screen, scroll)

**Location**: `src/core/systems/input/InputManager.js`

**Usage**:
```javascript
const manager = new InputManager(inputSystem)
const control = manager.bind({ priority: ControlPriorities.PLAYER })
control.release()  // Properly cleanup
```

### Handler Types

**PointerInputHandler** - Mouse/pointer events
- Pointer lock/unlock
- Pointer position and delta tracking
- Button tracking (left, right, middle)

**KeyboardInputHandler** - Keyboard events
- Key press/release tracking
- Integration with button state system

**TouchInputHandler** - Touch events
- Multi-touch support
- Touch position and delta tracking
- Touch stick/pan gestures

**XRInputHandler** - XR controller input
- Left/right stick tracking
- Button and trigger tracking
- XR session management

## Control Binding

### Basic Binding

```javascript
const input = world.getService('controls')  // or world.controls

const control = input.bind({
  priority: ControlPriorities.PLAYER,
  onRelease: () => console.log('Control released')
})

// Access control inputs via proxy
console.log(control.mouseLeft.down)        // Button state
console.log(control.pointer.coords)        // Pointer coordinates
console.log(control.xrLeftStick.value)     // XR analog stick
console.log(control.camera.position)       // Camera transform
console.log(control.screen.width)          // Screen dimensions

// Button callbacks
control.keyW.onPress = () => console.log('W pressed')
control.keyW.onRelease = () => console.log('W released')

// Capture input (prevent lower priority controls from seeing it)
control.keyW.capture = true

// Set reticle visibility
control.hideReticle(true)

// Set action handlers
control.setActions([
  { type: 'jump', key: 'Space' },
  { type: 'interact', key: 'E' }
])

// Release when done
control.release()
```

### Priority System

```javascript
// Lower numbers = higher priority
ControlPriorities = {
  UI: 0,           // UI overlays
  MENU: 10,        // Menu interactions
  BUILDER: 20,     // Builder mode
  ACTION: 30,      // Interaction actions
  PLAYER: 40,      // Player movement
  CAMERA: 50,      // Camera control
  DEFAULT: 100     // Fallback
}
```

Controls are processed in priority order. First control to capture input blocks others.

## Input Types

### Buttons
```javascript
$button: {
  down: boolean,           // Currently pressed
  pressed: boolean,        // Pressed this frame
  released: boolean,       // Released this frame
  capture: boolean,        // Block input from lower priority
  onPress: () => void,     // Press callback
  onRelease: () => void    // Release callback
}
```

**Supported buttons**: All keyboard keys (keyA, keyB, ...), mouseLeft, mouseRight, touchA, touchB, xrLeftTrigger, xrRightTrigger, xrLeftBtn1, xrLeftBtn2, xrRightBtn1, xrRightBtn2

### Vectors
```javascript
$vector: {
  value: Vector3,          // Current value
  capture: boolean         // Block input from lower priority
}
```

**Supported vectors**: touchStick, xrLeftStick, xrRightStick

### Pointer
```javascript
pointer: {
  coords: Vector3,         // Screen coordinates
  position: Vector3,       // World position
  delta: Vector3,          // Frame delta
  locked: boolean,         // Pointer lock state
  lock(): void,            // Request pointer lock
  unlock(): void           // Exit pointer lock
}
```

### Camera
```javascript
camera: {
  position: Vector3,
  quaternion: Quaternion,
  rotation: Euler,
  zoom: number,
  write: boolean           // Allow this control to write camera state
}
```

### Scalar Values
```javascript
scrollDelta: {
  value: number            // Mouse wheel delta
}
```

### Screen & Misc
```javascript
screen: {
  width: number,
  height: number
}
```

## Integration Patterns

### Player Movement Integration

```javascript
// In PlayerLocal or player system
const controlBinder = new PlayerControlBinder(player)
controlBinder.initControl()

// In PlayerInputProcessor
processCamera(delta) {
  const control = player.control
  if (control?.pointer?.locked) {
    cam.rotation.x += -control.pointer.delta.y * LOOK_SPEED * delta
    cam.rotation.y += -control.pointer.delta.x * LOOK_SPEED * delta
  }
}

processMovement(delta) {
  if (control?.keyW?.down) moveForward(delta)
  if (control?.keyA?.down) moveLeft(delta)
  if (control?.keyS?.down) moveBackward(delta)
  if (control?.keyD?.down) moveRight(delta)
}
```

### Action Binding

```javascript
// In ClientActions system
this.control = this.controls.bind({
  priority: ControlPriorities.ACTION
})

// Check for interactions
update(delta) {
  const btnDown = this.control.keyE.down ||
                  this.control.touchB.down ||
                  this.control.xrLeftTrigger.down

  if (btnDown && this.current.node) {
    this.performAction()
  }
}
```

### Reticle Management

```javascript
// Hide reticle when interacting
control.hideReticle(true)

// Show reticle when done
control.hideReticle(false)
```

### Custom Action Lists

```javascript
control.setActions([
  {
    id: 1,
    type: 'grab',
    key: 'E',
    label: 'Grab',
    active: true
  },
  {
    id: 2,
    type: 'drop',
    key: 'Q',
    label: 'Drop',
    active: false
  }
])

// Listen for action changes
world.events.on('actions', (actions) => {
  updateUI(actions)
})
```

## Handler Management

### Registering Custom Handlers

```javascript
const manager = new InputManager(inputSystem)

// Register handler
manager.registerHandler('custom-handler', {
  init() { /* setup */ },
  update() { /* process input */ },
  destroy() { /* cleanup */ }
})

// Get handler
const handler = manager.getHandler('custom-handler')

// Unregister
manager.unregisterHandler('custom-handler')
```

### Built-in Handlers

All handlers manage lifecycle via EventListenerManager for proper cleanup:

**PointerInputHandler**
- Handles mouse move, lock change, button events
- Manages pointer.locked, pointer.coords, pointer.position, pointer.delta

**KeyboardInputHandler**
- Handles keydown, keyup events
- Updates button states for all key inputs
- Filters focus-state inputs

**TouchInputHandler**
- Handles touchstart, touchmove, touchend events
- Manages touchStick vector deltas
- Emits custom touch events (onTouch, onTouchEnd)

**XRInputHandler**
- Processes XR input sources
- Updates XR stick and button states
- Integrates with XR session lifecycle

## State Queries

### From Control

```javascript
const control = input.bind(...)

// Button states
control.keyW.down         // Is key down?
control.keyW.pressed      // Pressed this frame?
control.keyW.released     // Released this frame?

// Pointer info
control.pointer.locked    // Pointer lock active?
control.pointer.coords    // Screen coordinates {x, y}
control.pointer.position  // World position
control.pointer.delta     // Frame delta

// Screen info
control.screen.width      // Viewport width
control.screen.height     // Viewport height

// Scroll
control.scrollDelta.value // Wheel delta

// Camera
control.camera.position   // Camera position
control.camera.rotation   // Camera rotation
control.camera.zoom       // Camera zoom
```

### From InputManager

```javascript
const manager = new InputManager(input)

// Query state
const state = manager.getPointerState()  // {locked, coords, position, delta}
const dims = manager.getScreenDimensions()  // {width, height}
const scroll = manager.getScrollDelta()  // number
const count = manager.getActiveControlCount()  // number

// Check focus
manager.isInputFocused()  // Is typing in input/textarea?
```

### From InputSystem

```javascript
const input = world.getService('controls')

// Raw state access
input.pointer.locked      // Pointer lock state
input.screen.width        // Screen width
input.scroll.delta        // Scroll delta this frame
input.xrSession           // Active XR session
input.buttonsDown         // Set of currently down buttons

// Query all controls
input.controls            // Array of active controls
input.actions             // Built actions from controls
```

## Cleanup & Lifecycle

### Proper Control Release

```javascript
// CORRECT - calls control.api.release()
control.release()

// control.api.release() does:
// - Removes from InputSystem.controls array
// - Calls onRelease callback
// - Clears reticle suppressor if any
```

### System Lifecycle

```javascript
// In InputSystem.destroy()
this.keyboardHandler.destroy()  // Cleans up all listeners
this.pointerHandler.destroy()   // Cleans up all listeners
```

Handlers use EventListenerManager for automatic listener cleanup.

### InputManager Cleanup

```javascript
const manager = new InputManager(input)
const control = manager.bind(...)

// Later...
manager.destroy()  // Releases all controls and clears handlers
```

## Best Practices

1. **Use Priority System Correctly**
   ```javascript
   // Good - UI input blocked by everything
   control.bind({ priority: ControlPriorities.UI })

   // Bad - game input blocking UI
   control.bind({ priority: ControlPriorities.PLAYER })  // Should be higher priority
   ```

2. **Always Release Controls**
   ```javascript
   // GOOD
   const control = input.bind(...)
   try {
     // use control
   } finally {
     control.release()
   }

   // BAD - control never released, leaks references
   const control = input.bind(...)
   // ...forgot to release()
   ```

3. **Capture Input Appropriately**
   ```javascript
   // GOOD - only capture when needed
   control.keyE.capture = true  // Only when action menu open

   // BAD - always capturing blocks all input below
   control.keyW.capture = true
   ```

4. **Use Callbacks for Events**
   ```javascript
   // GOOD - callbacks fire immediately
   control.keySpace.onPress = () => jump()

   // BAD - polling every frame
   if (control.keySpace.pressed) jump()
   ```

5. **Check Focus State**
   ```javascript
   // GOOD - don't process input while typing
   if (!input.isInputFocused()) {
     processGameInput()
   }

   // BAD - game input while user typing
   processGameInput()
   ```

6. **Use DI Instead of Direct Access**
   ```javascript
   // GOOD - uses service locator
   const controls = world.getService('controls')

   // BAD - tight coupling to world property
   const controls = world.controls
   ```

## Files

- `src/core/systems/input/InputSystem.js` - Core input aggregation
- `src/core/systems/input/InputManager.js` - Facade and lifecycle management
- `src/core/systems/input/PointerInputHandler.js` - Mouse/pointer handling
- `src/core/systems/input/KeyboardInputHandler.js` - Keyboard handling
- `src/core/systems/input/TouchInputHandler.js` - Touch handling
- `src/core/systems/input/XRInputHandler.js` - XR controller handling
- `src/core/systems/ClientControls.js` - InputSystem alias
- `src/core/systems/ClientActions.js` - Interaction actions using input
- `src/core/entities/player/PlayerControlBinder.js` - Player input binding
- `src/core/entities/player/PlayerInputProcessor.js` - Camera/movement processing
- `src/core/extras/ControlPriorities.js` - Priority definitions
- `src/core/entities/player/input/InputStrategy.js` - Player input strategies
- `src/core/entities/player/input/PointerLockInputStrategy.js`
- `src/core/entities/player/input/TouchPanInputStrategy.js`
- `src/core/entities/player/input/XRInputStrategy.js`

## Migration from Old Pattern

### Before (Scattered Input)

```javascript
// Old: Direct button checking
if (keys.includes('w')) moveForward()

// Old: No priority system
keyboardHandler.on('keydown', () => { ... })

// Old: Direct world access
player.world.controls.bind()
```

### After (Unified Input System)

```javascript
// New: Control binding with priority
const control = input.bind({ priority: ControlPriorities.PLAYER })

// New: Button state via control object
if (control.keyW.down) moveForward()

// New: Proper callbacks
control.keyW.onPress = () => moveForward()

// New: DI for service access
const controls = world.getService('controls')
```

## Next Steps

1. Migrate all remaining console input to structured logging
2. Add input metrics collection (button press frequencies, pointer lock events)
3. Add distributed tracing for input pipeline
4. Create input animation/gesture recognition system
5. Add input remapping UI with persistence
6. Implement accessibility features (remappable controls, visual feedback)

## Benefits

- ✅ Single source of truth for all input
- ✅ Priority-based input routing prevents conflicts
- ✅ Multiple simultaneous input methods (keyboard, mouse, touch, XR)
- ✅ Proper control lifecycle with release()
- ✅ Handler abstraction for extensibility
- ✅ Event callback system for responsive input
- ✅ Integrated with DI container
- ✅ Auto cleanup via EventListenerManager
- ✅ Structured logging for debugging
