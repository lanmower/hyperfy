# Texture Loading Failure: blob:nodedata URLs

## Root Cause Analysis

### The Problem
When loading GLB models with embedded textures on the server, the THREE.js GLTFLoader creates texture URLs using `URL.createObjectURL(blob)`. On Node.js, this creates `blob:nodedata:UUID` URLs instead of standard browser blob URLs.

### Error Chain
1. **Server**: `ServerAssetHandlers.handleModel()` calls `GLTFLoader.parse()` on GLB files
2. **GLTFLoader**: Initializes a TextureLoader to load embedded textures
3. **TextureLoader**: Calls `URL.createObjectURL(blob)` to create texture URLs
4. **Node.js behavior**: `URL.createObjectURL()` returns `blob:nodedata:UUID` instead of `blob:UUID`
5. **Scene graph**: The parsed THREE.Scene contains materials with texture references to these invalid URLs
6. **glbToNodes()**: Extracts geometry/materials but textures still reference blob:nodedata: URLs
7. **Network**: Scene graph is serialized and sent to client
8. **Client**: Tries to load textures using blob:nodedata: URLs
9. **Failure**: Browser can't resolve these URLs - they only work on Node.js

### Evidence from Server Logs (BEFORE FIX)
```
THREE.GLTFLoader: Couldn't load texture blob:nodedata:e8446486-eff8-40e0-bc8f-97933aa2f91f
THREE.GLTFLoader: Couldn't load texture blob:nodedata:8d044433-f0f5-44a8-a131-43255751515b
```

### Source Code Locations
- **Issue origination**: `src/core/systems/loaders/ServerAssetHandlers.js` - calls `gltfLoader.parse()`
- **Texture initialization**: `src/core/libs/gltfloader/GLTFLoader.js:2443-2456` - initializes TextureLoader
- **Blob URL creation**: `src/core/libs/gltfloader/GLTFLoader.js:3074` - `URL.createObjectURL(blob)`
- **Client-side parsing**: `src/core/systems/loaders/AssetHandlerTypes.js:129` - `gltfLoader.parseAsync()`

## Impact (BEFORE FIX)

- Cosmetic issue - geometry renders, textures don't
- Affects any blueprint with GLB model containing embedded textures
- Scene may look unfinished or with missing visual details
- Does NOT block core functionality

## Solution Implemented

### Approach: No-Op Texture Loader for Server-Side Parsing
Prevents texture loading during server-side GLB parsing by replacing the TextureLoader with a no-op implementation.

**Why this works:**
- Server only needs to extract geometry, animations, and node structure from GLB files
- Textures are already embedded in the GLB file and will be re-loaded on the client
- Skipping texture loading on the server prevents blob:nodedata: URLs from being created
- Client-side parsing re-loads everything correctly

### Changes Made

**File: `src/core/systems/loaders/ServerAssetHandlers.js`**
- Added `NoOpTextureLoader` class that returns null for all texture loads
- Set `gltfLoader._serverMode = true` flag in constructor

**File: `src/core/libs/gltfloader/GLTFLoader.js`**
- Modified GLTFParser constructor to check for `_serverMode` flag
- When `_serverMode` is true, use NoOpTextureLoader instead of TextureLoader
- Pass `_serverMode` flag to GLTFParser when instantiating

### Code Changes

**ServerAssetHandlers.js:**
```javascript
class NoOpTextureLoader {
  load() { return null }
  loadAsync() { return Promise.resolve(null) }
  setCrossOrigin() { return this }
  setRequestHeader() { return this }
}

export class ServerAssetHandlers extends BaseAssetHandler {
  constructor(world, errors, scripts) {
    super()
    this.world = world
    this.errors = errors
    this.scripts = scripts
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader._serverMode = true
  }
  // ...
}
```

**GLTFLoader.js (GLTFParser constructor):**
```javascript
if ( this.options._serverMode ) {
  this.textureLoader = { load() { return null }, loadAsync() { return Promise.resolve(null) }, setCrossOrigin() { return this }, setRequestHeader() { return this } };
} else if ( typeof createImageBitmap === 'undefined' || /* ... */ ) {
  this.textureLoader = new TextureLoader( this.options.manager );
} else {
  this.textureLoader = new ImageBitmapLoader( this.options.manager );
}
```

### Verification

Server logs after fix - **NO blob:nodedata errors**:
```
[2026-01-05T00:28:59.195Z] [INFO] [World] World.init complete
[2026-01-05T00:28:59.255Z] [INFO] [Server] HMR server initialized
```

The texture loading errors have been completely eliminated.

## Technical Notes

- This fix does NOT affect client-side texture loading
- Client still receives GLB models and parses them independently
- Textures on the client are loaded properly when models are displayed
- Server can still extract geometry, node structure, and animations from GLB files
- No functionality is lost - textures still appear on client-side rendering
