import React, { createContext, useContext, useMemo, useState } from 'react'

interface HintAPI {
  hint: string | null
  setHint: (hint: string | null) => void
}

interface HintProviderProps {
  children: React.ReactNode
}

export const HintContext = createContext<HintAPI | undefined>(undefined)

export function HintProvider({ children }: HintProviderProps) {
  const [hint, setHint] = useState<string | null>(null)
  const api = useMemo<HintAPI>(() => {
    return { hint, setHint }
  }, [hint])
  return <HintContext.Provider value={api}>{children}</HintContext.Provider>
}

export function useHint(): HintAPI {
  const context = useContext(HintContext)
  if (context === undefined) {
    throw new Error('useHint must be used within a HintProvider')
  }
  return context
}
