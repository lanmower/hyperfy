export function parseNumberInput(str, current, { min = -Infinity, max = Infinity } = {}) {
  let num
  try {
    num = (0, eval)(str)
    if (typeof num !== 'number') throw new Error('input number parse fail')
  } catch (err) {
    num = current
  }
  if (num < min || num > max) num = current
  return num
}
