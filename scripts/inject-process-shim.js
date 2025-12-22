// Injected at top of every module to prevent process.cwd mutations
if (typeof process !== 'undefined' && process) {
  try {
    let cwdValue = '/'
    if (!Object.getOwnPropertyDescriptor(process, 'cwd')?.set) {
      Object.defineProperty(process, 'cwd', {
        get: () => cwdValue,
        set: (value) => { cwdValue = value },
        configurable: true
      })
    }
  } catch (e) {
    // Silently ignore
  }
}
