export const ACTION_CONFIGS = {
  disabled: [],
  noSelection: [
    { type: 'mouseLeft', label: 'Grab' },
    { type: 'mouseRight', label: 'Inspect' },
    { type: 'custom', btn: '1234', label: 'Grab / Translate / Rotate / Scale' },
    { type: 'keyR', label: 'Duplicate' },
    { type: 'keyP', label: 'Pin' },
    { type: 'keyX', label: 'Destroy' },
    { type: 'space', label: 'Jump / Fly (Double-Tap)' },
  ],
  grab: [
    { type: 'mouseLeft', label: 'Place' },
    { type: 'mouseWheel', label: 'Rotate' },
    { type: 'mouseRight', label: 'Inspect' },
    { type: 'custom', btn: '1234', label: 'Grab / Translate / Rotate / Scale' },
    { type: 'keyF', label: 'Push' },
    { type: 'keyC', label: 'Pull' },
    { type: 'keyX', label: 'Destroy' },
    { type: 'controlLeft', label: 'No Snap (Hold)' },
    { type: 'space', label: 'Jump / Fly (Double-Tap)' },
  ],
  transform: [
    { type: 'mouseLeft', label: 'Select / Transform' },
    { type: 'mouseRight', label: 'Inspect' },
    { type: 'custom', btn: '1234', label: 'Grab / Translate / Rotate / Scale' },
    { type: 'keyT', label: 'Toggle Space' },
    { type: 'keyX', label: 'Destroy' },
    { type: 'controlLeft', label: 'No Snap (Hold)' },
    { type: 'space', label: 'Jump / Fly (Double-Tap)' },
  ],
}

export const MODE_CONFIGS = {
  grab: { label: 'Grab', space: null },
  translate: { label: 'Translate', space: 'world' },
  rotate: { label: 'Rotate', space: 'world' },
  scale: { label: 'Scale', space: 'world' },
}

export const MODE_LABELS = Object.fromEntries(
  Object.entries(MODE_CONFIGS).map(([mode, config]) => [mode, config.label])
)
