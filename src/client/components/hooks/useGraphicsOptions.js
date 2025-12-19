import { useMemo } from 'react'

export function useGraphicsOptions(world) {
  return useMemo(() => {
    const dpr = window.devicePixelRatio
    const options = []
    const add = (label, val) => {
      options.push({ label, value: val })
    }
    add('0.5x', 0.5)
    add('1x', 1)
    if (dpr >= 2) add('2x', 2)
    if (dpr >= 3) add('3x', dpr)
    return options
  }, [])
}
