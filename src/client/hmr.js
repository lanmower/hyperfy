const HMR_DEBOUNCE_MS = 300

export function initHMR(onReload) {
  if (!window.location.hostname.includes('localhost')) return

  const ws = new WebSocket(`ws://${window.location.host}/hmr`)
  let debounceTimer = null

  ws.onmessage = (e) => {
    const { type, file } = JSON.parse(e.data)
    if (type === 'file_change') {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        window.location.reload()
      }, HMR_DEBOUNCE_MS)
    }
  }

  ws.onerror = () => {}

  ws.onopen = () => {}

  return ws
}
