import { useContext } from 'react'
import { MenuContext } from '../MenuComponents/Menu.js'

export function useMenuHint(hint) {
  const setHint = useContext(MenuContext)
  return {
    onPointerEnter: () => setHint(hint),
    onPointerLeave: () => setHint(null),
  }
}
