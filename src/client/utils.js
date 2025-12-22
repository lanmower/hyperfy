export function cls(...args) {
  let str = ''
  for (const arg of args) {
    if (typeof arg === 'string') {
      str += ' ' + arg
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        const value = arg[key]
        if (value) str += ' ' + key
      }
    }
  }
  return str
}

const isClient = typeof window !== 'undefined'
const coarse = isClient ? window.matchMedia('(pointer: coarse)').matches : false
const noHover = isClient ? window.matchMedia('(hover: none)').matches : false
const hasTouch = isClient ? navigator.maxTouchPoints > 0 : false
export const isTouch = (coarse && hasTouch) || (noHover && hasTouch)
