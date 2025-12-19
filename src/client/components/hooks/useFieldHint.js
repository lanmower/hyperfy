import { useContext } from 'react'
import { HintContext } from '../Hint.js'

export function useFieldHint(hint) {
  const { setHint } = useContext(HintContext)
  return {
    onPointerEnter: () => setHint(hint),
    onPointerLeave: () => setHint(null),
  }
}
