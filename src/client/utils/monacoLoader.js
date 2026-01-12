import { loadMonaco, darkPlusTheme as monacoTheme } from './monaco/index.js'

let promise

export const load = () => {
  if (promise) return promise
  promise = loadMonaco()
  return promise
}

export const darkPlusTheme = monacoTheme
