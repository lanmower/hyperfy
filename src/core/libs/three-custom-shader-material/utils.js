export function hashString(M) {
  let n = 0
  for (let m = 0; m < M.length; m++) n = M.charCodeAt(m) + (n << 6) + (n << 16) - n
  const S = n >>> 0
  return String(S)
}

export function isConstructor(M) {
  try {
    new M()
  } catch (n) {
    if (n.message.indexOf('is not a constructor') >= 0) return false
  }
  return true
}

export function removeComments(M) {
  return M.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
}
