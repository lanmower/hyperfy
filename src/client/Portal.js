import { createPortal } from 'react-dom'

export function Portal({ children, target }) {
  const el = target || document.body
  return createPortal(children, el)
}
