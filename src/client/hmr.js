export function initHMR(onReload) {
  if (!window.location.hostname.includes('localhost')) return

  console.log('[HMR] Connecting to HMR endpoint')
  const ws = new WebSocket(`ws://${window.location.host}/hmr`)
  let debounceTimer = null

  ws.onmessage = (e) => {
    const { type, file } = JSON.parse(e.data)
    if (type === 'file_change') {
      console.log(`[HMR] Reload triggered by: ${file}`)

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        window.location.reload()
      }, 300)
    }
  }

  ws.onerror = () => {
    console.log('[HMR] Connection error')
  }

  ws.onopen = () => {
    console.log('[HMR] Connected on ws://' + window.location.host + '/hmr')
  }

  return ws
}
