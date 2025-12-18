# How to Continue the Codebase Reduction

## Current Status: Great Foundation Laid! 🎯

**What We've Accomplished**:
- ✓ Phase 1: 3,893 LOC removed (dead code elimination)
- ✓ ActionConfigs: 45 LOC removed (data-driven approach)
- ✓ AssetHandlerRegistry framework: Created and ready
- ✓ Comprehensive documentation: 3 detailed guides created
- ✓ All commits: Clean history, easy to reference

**Current Codebase**:
- Files: 364 (down from 391)
- LOC: ~73,237 (down from ~77,130)
- Build: ✓ Stable
- Regressions: 0

---

## Template: How to Extract a Module

### Pattern Used Successfully: ActionConfigs

**Step 1: Create Config File**
```javascript
// src/core/systems/builder/ActionConfigs.js
export const ACTION_CONFIGS = {
  disabled: [],
  noSelection: [/* ... */],
  grab: [/* ... */],
  transform: [/* ... */],
}

export const MODE_LABELS = {
  grab: 'Grab',
  // ... etc
}
```

**Step 2: Import in Source File**
```javascript
// In src/core/systems/ClientBuilder.js
import { ACTION_CONFIGS, MODE_LABELS } from './builder/ActionConfigs.js'
```

**Step 3: Replace Usage**
```javascript
// Before
const modeLabels = { grab: 'Grab', ... }
return modeLabels[this.mode]

// After
return MODE_LABELS[this.mode]
```

**Step 4: Verify & Commit**
```bash
npm run build  # Should succeed
git add -A
git commit -m "Extract ActionConfigs from ClientBuilder (45 LOC)"
```

---

## Copy This Workflow for Each Extraction

### Extraction Workflow (Proven Process)

1. **Identify**: Find the code section to extract (grep for function/class names)
2. **Create**: Write new module file with focused responsibility
3. **Import**: Update source file with import statement
4. **Replace**: Substitute old code with calls to new module
5. **Build**: `npm run build` to verify
6. **Test**: Manual feature test (builder mode, particles, etc.)
7. **Commit**: `git commit -m "Extract [Module] from [File] ([LOC] saved)"`

### Template Commit Message
```
Phase [X].[Y]: Extract [ModuleName] from [FileName] ([LOC] saved)
```

---

## Recommended Next Steps (Choose One)

### Quick Win: Complete ClientBuilder Extraction
**Remaining**: 3 modules (ModeManager, GizmoManager, UndoManager)

**File**: `src/core/systems/ClientBuilder.js` (lines 595-705 for mode/gizmo logic)
**Time**: ~30-45 minutes per module
**Modules to Create**: 3 files
**Total Savings**: ~355 LOC

**Start With**:
```bash
# 1. Create ModeManager
# Extract: getMode(), setMode(), getModeLabel(), getSpaceLabel(), toggleSpace()
# Location: src/core/systems/builder/ModeManager.js

# 2. Create GizmoManager
# Extract: attachGizmo(), detachGizmo(), enableRotationSnap(), disableRotationSnap(), isGizmoActive()
# Location: src/core/systems/builder/GizmoManager.js

# 3. Create UndoManager
# Extract: addUndo(), undo() and undo state management
# Location: src/core/systems/builder/UndoManager.js
```

### High Value: Extract Particle Shapes
**Remaining**: 7 shape modules from `createShape()` function

**File**: `src/client/particles.js` (lines 494-804)
**Time**: ~1-2 hours
**Modules to Create**: 8 files (7 shapes + factory)
**Total Savings**: ~305 LOC

**File Structure**:
```
src/client/particles/
├── shapes/
│   ├── PointShape.js
│   ├── SphereShape.js
│   ├── HemisphereShape.js
│   ├── ConeShape.js
│   ├── BoxShape.js
│   ├── CircleShape.js
│   ├── RectangleShape.js
│   └── index.js (factory)
├── CurveInterpolators.js
├── ValueStarters.js
└── SpritesheetManager.js
```

**Pattern for Each Shape**:
```javascript
// src/client/particles/shapes/PointShape.js
export const PointShape = () => (pos, dir) => {
  pos.set(0, 0, 0)
  dir.set(0, 1, 0)
}
```

### Strategic: Build Asset Handler Registry
**Remaining**: Integration of registry into ClientLoader

**File**: `src/core/systems/ClientLoader.js` (consolidate 9 handler methods)
**Time**: ~1-2 hours (complex but high value)
**Modules to Create**: 1 (registry already created)
**Total Savings**: ~150 LOC

**Pattern**:
```javascript
// In ClientLoader.start()
this.registry = new AssetHandlerRegistry()
this.registry.register('video', {
  parse: async (url, file, key, ctx) => this.handleVideo(url),
  insert: async (localUrl, url, file, key, ctx) => this.insertVideo(localUrl)
})
// ... repeat for 8 more types

// Replace load() method to use registry
async load(type, url) {
  const file = await this.loadFile(url)
  return this.registry.load(type, url, file, key, this)
}
```

---

## Reference: Commits Already Made

Use these as templates for your own commits:

```bash
git log --oneline | head -10
# Should show:
# - Phase 2/3: Extract ActionConfigs and simplify ClientBuilder (45 LOC)
# - Add comprehensive Phase 2-3 implementation guide
# - Phase 1.6: Remove unused player subsystems (55 LOC)
# - Phase 1.5: Remove unused config infrastructure (653 LOC)
# - etc.
```

**Study These Commits**:
- `git show <commit-hash>` to see exactly what changed
- Use as template for your own extractions

---

## Code Review Checklist

### Before Committing Each Extraction

- [ ] **Build**: `npm run build` exits cleanly
- [ ] **Syntax**: No TypeErrors or parse errors in console
- [ ] **Feature**: Specific feature still works (test manually)
- [ ] **Import**: All new imports are correct paths
- [ ] **Cleanup**: Removed old code, no duplicates remain
- [ ] **Tests**: Run basic feature test if applicable
- [ ] **Message**: Commit message follows pattern with LOC count

### Feature Tests by Module
- **ClientBuilder**: Enter builder mode, place object, undo
- **particles.js**: Spawn particle system, verify all shapes work
- **ClientControls**: Test keyboard, XR controls, touch
- **PlayerLocal**: Walk around, avatar loads, chat bubble appears
- **ServerNetwork**: Player connects, file upload works

---

## Tools & Commands Reference

### Build and Check
```bash
npm run build              # Full build
npm run dev                # Development server with hot reload
```

### Git Workflow
```bash
git diff src/core/systems/ClientBuilder.js  # See changes
git add -A                                   # Stage changes
git commit -m "..."                          # Commit
git log --oneline                            # View history
git show HEAD                                 # See last commit details
```

### Search & Analysis
```bash
grep -n "functionName" src/file.js           # Find line numbers
wc -l src/file.js                            # Count LOC
git diff --stat                              # See files changed
```

---

## Parallel Work Strategy (For Team)

If multiple people are working on this:

**Assignments**:
1. **Person A**: ClientBuilder modules (3 files)
2. **Person B**: Particles shapes (7 files)
3. **Person C**: ServerNetwork handlers (4 files)
4. **Person D**: PlayerLocal subsystems (4 files)
5. **Person E**: ClientControls handlers (3 files)

**Sync Strategy**:
- Each person works on their assigned modules
- Merge order: No dependencies between modules
- Review before merge: Follow checklist above
- Test in order: 1,2,3,4,5

**Estimated Team Timeline**: 2-3 hours to complete all Phase 3

---

## Know When to Stop

**Good Stopping Points** (after completing):
- Any Phase (1, 2, 3, 4, 5)
- After extracting one file (ClientBuilder, particles.js, etc.)
- After reaching 5%, 10%, 15% LOC reduction
- When build is stable and tests pass

**Don't Stop Mid-Extraction**: Finish what you start to keep code working

---

## Resources in Repo

| File | Purpose |
|------|---------|
| `PHASE_2_3_IMPLEMENTATION_GUIDE.md` | Detailed next steps with line numbers |
| `REFACTORING_EXECUTIVE_SUMMARY.md` | Strategic options and complete picture |
| `CODEBASE_REDUCTION_PROGRESS.md` | Phase 1 summary and WFGY tracking |
| `CONTINUATION_GUIDE.md` | This file - how to proceed |

---

## Quick Reference: LOC Savings by Module

```
Phase 1 (DONE):              3,893 LOC ✓
- Network abstraction        743
- Integration/Dynamic        688
- CLI infrastructure         254
- Config infrastructure      653
- Player subsystems          55

Phase 2 (READY):            ~1,275 LOC
- Asset handlers            250-300
- Property schema           700-800
- UI handlers               170-220
- System init               50-100

Phase 3 (READY):            ~2,516 LOC
- ClientBuilder             766 (355 remaining)
- Particles                 638
- ClientControls            428
- PlayerLocal               339
- ServerNetwork             345
```

---

## Success Metric: Track Your Progress

After each extraction, update this:

```markdown
## Phase 3 Progress
- [x] ActionConfigs: 45 LOC saved
- [ ] ModeManager: 85 LOC (target)
- [ ] GizmoManager: 180 LOC (target)
- [ ] UndoManager: 90 LOC (target)
- [ ] FileDropHandler: 170 LOC (target)
- [ ] Particle shapes: 305 LOC (target)
...

Total Saved: X LOC (Y% of target)
```

---

## Final Thoughts

This project is **modular and repeatable**:
- Each extraction follows same pattern
- No dependencies between modules
- Can be done in any order
- Easy to revert if needed

**You've got this!** 💪

Start with one extraction, verify it works, commit it, then move to the next. The pattern is proven and documented.

Good luck! 🚀
