import { createPortal } from 'react-dom'
import React from 'react'

interface PortalProps {
  children: React.ReactNode
}

export function Portal({ children }: PortalProps) {
  const element = document.getElementById('core-ui-portal')
  if (!element) {
    console.warn('Portal: core-ui-portal element not found')
    return null
  }
  return createPortal(children, element)
}
