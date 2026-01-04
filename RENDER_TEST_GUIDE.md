# 3D Rendering Diagnostic Guide

## Quick Test Instructions

### Option 1: Automatic Diagnostic (Recommended)

1. Open http://localhost:3000/public/render-test.html in your browser
2. Wait 3 seconds for the diagnostic to run
3. Read the output for render status

### Option 2: Browser Console

1. Open http://localhost:3000
2. Wait for the page to load (3-5 seconds)
3. Open browser DevTools (F12 or Ctrl+Shift+I)
4. Go to Console tab
5. Paste and run this:

```javascript
const app = window.pc?.app;
console.log('=== RENDERING STATUS ===');
console.log('App running:', app?.isRunning);
console.log('App root children:', app?.root?.children?.length);
console.log('Active camera:', app?.scene?.activeCameraEntity?.name);

const meshes = app?.scene?.getMeshInstances?.() || [];
console.log('Mesh instances:', meshes.length);

if (meshes.length === 0) {
  console.warn('NO MESHES FOUND - Check if nodes are being mounted');
} else {
  console.log('SUCCESS: Scene is rendering', meshes.length, 'meshes');
  meshes.slice(0, 5).forEach((m, i) => {
    console.log(`  [${i}] ${m.node?.name || 'mesh'}`);
  });
}
```

### Option 3: Manual Check via JavaScript

```javascript
// Check if PlayCanvas is loaded
window.pc ? console.log('✓ PlayCanvas loaded') : console.log('✗ PlayCanvas not found');

// Check if app exists
const app = window.pc?.app;
app ? console.log('✓ App created') : console.log('✗ App not found');

// Check if app is running
app?.isRunning ? console.log('✓ App running') : console.log('✗ App not running');

// Check scene structure
console.log('Root children:', app?.root?.children?.length || 0);

// Check camera
const camera = app?.scene?.activeCameraEntity;
camera ? console.log('✓ Camera active:', camera.name) : console.log('✗ Camera not active');

// Check meshes
const meshes = app?.scene?.getMeshInstances?.() || [];
console.log('Mesh instances:', meshes.length);

// Final verdict
if (meshes.length > 0 && camera && app?.isRunning) {
  console.log('✓✓✓ RENDERING WORKING');
} else {
  console.log('✗✗✗ RENDERING ISSUE');
}
```

## Expected Output

### If rendering is working:
```
App running: true
Active camera: camera
Mesh instances: > 0
SUCCESS: Scene is rendering
```

### If rendering is NOT working:
```
App running: true
Active camera: camera
Mesh instances: 0
WARNING: No visible meshes
```

## Diagnostic Points

| Component | Status | What It Means |
|-----------|--------|---------------|
| `app.isRunning` | true | PlayCanvas engine is active |
| `app.root.children.length` | > 0 | Scene has entities |
| `activeCameraEntity` | set | Camera is positioned |
| `getMeshInstances().length` | > 0 | Meshes are mounted to scene |

## Common Issues

### App not running
- Check dev server logs
- Look for JavaScript errors in browser console
- Verify ClientGraphics system initialized

### Camera not active
- Check if camera entity was created (line 52-63 in ClientGraphics.js)
- Verify camera is added to app.root (line 61)

### No mesh instances
- Blueprint not loading (check network tab for failed requests)
- Nodes not being mounted (check if activate() is called)
- All meshes are hidden (check node.visible property)

## Rendering Pipeline

```
App Entity Created
    ↓
AppBuilder.build()
    ↓
App.root.activate() [recursively activates children]
    ↓
Each Mesh Node.mount()
    ↓
stage.insert() creates PlayCanvas Entity
    ↓
Entity added to stage.scene (app.root)
    ↓
PlayCanvas renders meshes
```

## Files to Check

If rendering still doesn't work, check these files in order:

1. **C:\dev\hyperfy\src\core\systems\ClientGraphics.js** - Line 65: `this.app.start()`
2. **C:\dev\hyperfy\src\core\entities\App.js** - Line 76: `root.activate()`
3. **C:\dev\hyperfy\src\core\nodes\base\LifecycleManager.js** - Line 17: `node.mount()`
4. **C:\dev\hyperfy\src\core\nodes\Mesh.js** - Line 48: `stage.insert()`
5. **C:\dev\hyperfy\src\core\systems\stage\MeshInserter.js** - Line 49: `stage.scene.addChild()`

## Test the Rendering System

Once you confirm rendering works, you should see:

1. Black canvas becomes filled with 3D content
2. A 3D scene with terrain/meadow visible
3. Lighting and shadows applied
4. Multiple mesh instances rendered

If you see nothing, it's likely a node mounting issue or blueprint loading problem.
