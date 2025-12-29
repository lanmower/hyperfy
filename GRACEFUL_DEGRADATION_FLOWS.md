# Graceful Degradation - Flow Diagrams

## 1. Asset Loading Flow (with Fallback)

```
┌─────────────────────────────────────────────────────────────┐
│                   Asset Load Request                         │
│              loader.load('model', 'scene.glb')              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   Load File           │
          │   fileManager.load()  │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ SUCCESS                   ▼ ERROR
┌───────────────┐          ┌────────────────────┐
│ Parse Asset   │          │  File Load Failed  │
│ handler(file) │          │  (404, timeout)    │
└───────┬───────┘          └────────┬───────────┘
        │                           │
        ▼                           ▼
┌───────────────┐          ┌────────────────────┐
│ Create Result │          │  Get Fallback      │
│ model.toNodes()│         │  fallbackManager   │
└───────┬───────┘          │  .getFallback()    │
        │                  └────────┬───────────┘
        │                           │
        │                           ▼
        │                  ┌────────────────────┐
        │                  │  Log Fallback      │
        │                  │  [FALLBACK] msg    │
        │                  └────────┬───────────┘
        │                           │
        │                           ▼
        │                  ┌────────────────────┐
        │                  │  Return Fallback   │
        │                  │  (gray box)        │
        │                  └────────┬───────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   Store in Cache      │
          │   results.set(key)    │
          └───────────┬───────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   Return to App       │
          │   ✓ Never null        │
          │   ✓ Always usable     │
          └───────────────────────┘
```

---

## 2. Feature Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Application Startup                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  FeatureDetector      │
          │  detector.detect()    │
          └───────────┬───────────┘
                      │
    ┌─────────────────┴─────────────────┐
    │                                   │
    ▼                                   ▼
┌──────────────────┐          ┌──────────────────┐
│  Sync Features   │          │  Async Features  │
│  - WebGL         │          │  - Microphone    │
│  - WebSocket     │          │  - Camera        │
│  - LocalStorage  │          │  - WebXR         │
│  - Gamepad       │          │  - AudioContext  │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         └─────────────┬───────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Compute Capabilities │
           │  canUseAudio          │
           │  canUseVoiceChat      │
           │  canUseWebSocket      │
           │  canRender3D          │
           └───────────┬───────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Store on World       │
           │  world.features       │
           │  world.capabilities   │
           └───────────┬───────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐          ┌──────────────────┐
│  Check WebGL  │          │  Pass to Systems │
│  Required     │          │  config.caps     │
└───────┬───────┘          └──────────────────┘
        │
        ▼
┌───────────────┐
│  Continue or  │
│  Exit Early   │
└───────────────┘
```

---

## 3. System Degradation Flow (ClientAudio)

```
┌─────────────────────────────────────────────────────────────┐
│               ClientAudio Constructor                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  Check Capabilities   │
          │  world.capabilities   │
          │  .canUseAudio         │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ FALSE                     ▼ TRUE
┌───────────────────┐      ┌────────────────────┐
│  Set Degraded     │      │  Try Init Audio    │
│  degraded = true  │      │  new AudioContext()│
│  ctx = null       │      └────────┬───────────┘
└───────┬───────────┘               │
        │              ┌────────────┴────────────┐
        │              │                         │
        │              ▼ SUCCESS                 ▼ ERROR
        │      ┌────────────────┐      ┌────────────────┐
        │      │  Normal Setup  │      │  Catch Error   │
        │      │  masterGain    │      │  degraded=true │
        │      │  groupGains    │      └────────┬───────┘
        │      │  listener      │               │
        │      └────────┬───────┘               │
        │               │                       │
        └───────────────┴───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  System Ready         │
            │  - degraded flag set  │
            │  - Methods check flag │
            └───────────┬───────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼ degraded=true                 ▼ degraded=false
┌───────────────────┐          ┌────────────────────┐
│  Methods Return   │          │  Normal Operation  │
│  Early (no-op)    │          │  Audio plays       │
│  No crashes       │          │  Spatial audio     │
└───────────────────┘          └────────────────────┘
```

---

## 4. Network Offline Mode Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Network System Init                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  Check WebSocket      │
          │  capabilities         │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ UNAVAILABLE               ▼ AVAILABLE
┌───────────────────┐      ┌────────────────────┐
│  Enter Offline    │      │  Connect WebSocket │
│  offlineMode=true │      │  wsManager.init()  │
│  Notify User      │      └────────┬───────────┘
└───────┬───────────┘               │
        │                           │
        │              ┌────────────┴────────────┐
        │              │                         │
        │              ▼ CONNECTED               ▼ DISCONNECTED
        │      ┌────────────────┐      ┌────────────────────┐
        │      │  Online Mode   │      │  Enter Offline     │
        │      │  Send/Receive  │      │  offlineMode=true  │
        │      │  Sync State    │      │  Cache State       │
        │      └────────┬───────┘      └────────┬───────────┘
        │               │                       │
        │               │    RECONNECT          │
        │               │  ◄────────────────────┘
        │               │
        │               ▼
        │      ┌────────────────────┐
        │      │  Exit Offline      │
        │      │  offlineMode=false │
        │      │  Clear Stale       │
        │      │  Request Snapshot  │
        │      └────────┬───────────┘
        │               │
        └───────────────┴───────────────────────┐
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  User Notifications   │
                                    │  Chat messages        │
                                    │  - "Connection lost"  │
                                    │  - "Reconnected"      │
                                    └───────────────────────┘
```

---

## 5. Complete Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Action                             │
│              (Load asset, play audio, etc.)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  System Check         │
          │  - Feature available? │
          │  - degraded flag?     │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ DEGRADED                  ▼ AVAILABLE
┌───────────────────┐      ┌────────────────────┐
│  Return Early     │      │  Execute Action    │
│  No Error         │      │  (try/catch)       │
│  Silent Fail      │      └────────┬───────────┘
└───────┬───────────┘               │
        │              ┌────────────┴────────────┐
        │              │                         │
        │              ▼ SUCCESS                 ▼ ERROR
        │      ┌────────────────┐      ┌────────────────────┐
        │      │  Return Result │      │  Get Fallback      │
        │      │  ✓ Asset       │      │  Log Error         │
        │      │  ✓ Audio       │      │  Return Fallback   │
        │      │  ✓ Network     │      └────────┬───────────┘
        │      └────────┬───────┘               │
        │               │                       │
        └───────────────┴───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  User Experience      │
            │  ✓ No crashes         │
            │  ✓ Clear messages     │
            │  ✓ Continued function │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Debug Info           │
            │  window.__DEBUG__     │
            │  - getDegradation()   │
            │  - getFallbackLog()   │
            └───────────────────────┘
```

---

## 6. Fallback Type Resolution

```
┌─────────────────────────────────────────────────────────────┐
│                  Asset Load Error                            │
│              fallbackManager.getFallback(type, url, error)  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  Identify Type        │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────────────────┐
        │                                       │
┌───────▼──────┐                    ┌───────────▼──────┐
│ Model        │                    │ Texture          │
│ Gray Box     │                    │ White 64x64      │
│ 1x1x1 cube   │                    │ Canvas texture   │
└───────┬──────┘                    └───────────┬──────┘
        │                                       │
┌───────▼──────┐                    ┌───────────▼──────┐
│ Audio        │                    │ Script           │
│ Silent buffer│                    │ No-op function   │
│ 0.1s         │                    │ { exec: ()=>{} } │
└───────┬──────┘                    └───────────┬──────┘
        │                                       │
┌───────▼──────┐                    ┌───────────▼──────┐
│ HDR          │                    │ Avatar           │
│ Gray 16x16   │                    │ Gray capsule     │
│ DataTexture  │                    │ Simple mesh      │
└───────┬──────┘                    └───────────┬──────┘
        │                                       │
┌───────▼──────┐                    ┌───────────▼──────┐
│ Video        │                    │ Emote            │
│ Black texture│                    │ Empty clip       │
│ 64x64        │                    │ toClip: null     │
└───────┬──────┘                    └───────────┬──────┘
        │                                       │
        └───────────────┬───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Log Usage            │
            │  {                    │
            │    type, url, error,  │
            │    timestamp          │
            │  }                    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Return Fallback      │
            │  ✓ Always valid       │
            │  ✓ Never null         │
            │  ✓ Ready to use       │
            └───────────────────────┘
```

---

## 7. Debug Access Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Developer Console                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  window.__DEBUG__     │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────────────────┐
        │                                       │
┌───────▼──────────┐              ┌─────────────▼──────────┐
│ Feature Status   │              │ Degradation Status     │
│ getFeatures()    │              │ getDegradationStatus() │
│ getCapabilities()│              │ {                      │
│                  │              │   audio: false,        │
│ Returns:         │              │   livekit: false,      │
│ {                │              │   network: false       │
│   webgl: true,   │              │ }                      │
│   audio: true,   │              │                        │
│   ...            │              │                        │
│ }                │              │                        │
└───────┬──────────┘              └─────────────┬──────────┘
        │                                       │
┌───────▼──────────┐              ┌─────────────▼──────────┐
│ Fallback Log     │              │ System Status          │
│ getFallbackLog() │              │ world.audio.degraded   │
│                  │              │ world.livekit.degraded │
│ Returns:         │              │ world.network.offline  │
│ [                │              │                        │
│   {              │              │ Returns:               │
│     type: "model"│              │ true/false             │
│     url: "..."   │              │                        │
│     error: "..." │              │                        │
│     time: "..."  │              │                        │
│   }              │              │                        │
│ ]                │              │                        │
└───────┬──────────┘              └─────────────┬──────────┘
        │                                       │
        └───────────────┬───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Complete Picture     │
            │  - What's available   │
            │  - What's degraded    │
            │  - What's using       │
            │    fallbacks          │
            │  - Why it failed      │
            └───────────────────────┘
```

---

## Summary

These flows demonstrate how the graceful degradation system handles:

1. **Asset failures** → Fallbacks used transparently
2. **Feature detection** → Systems adapt automatically
3. **System degradation** → Components disable gracefully
4. **Network issues** → Offline mode with recovery
5. **Error handling** → Clear messages, no crashes
6. **Fallback resolution** → Type-specific placeholders
7. **Debug access** → Complete visibility into system state

All flows ensure the application continues functioning regardless of errors or missing capabilities.
