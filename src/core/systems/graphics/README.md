# Graphics System

PostProcessingSetup + PostProcessingController for PlayCanvas bloom, FXAA, SSAO effects.

## PostProcessingSetup.js

Core effect management: bloom (glow), FXAA (anti-alias), SSAO (ambient occlusion).
- `init()` creates all three effects
- `setBloomIntensity/Threshold/BlurAmount()` tune bloom
- `setSSAORadius/Samples/Intensity()` tune occlusion
- `toggleFXAA(enabled)` enable/disable anti-aliasing
- `getSettings/loadSettings/serialize()` persistence API

## PostProcessingController.js

System that initializes and manages post-processing lifecycle.
- Depends on `graphics` system for app/camera
- Logs initialization state and errors
- Public methods expose all effect controls
- Handles resize events from graphics system

## ClientGraphics.js (Updated)

Camera now marked with `priority: 0` and set as active scene camera for post-processing.

## GraphicsConfiguration.js (Updated)

Preference handlers updated for bloom, ssao, fxaa instead of legacy THREE.js effects.
