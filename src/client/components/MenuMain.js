import { useState } from 'react'
import { MenuMainIndex, MenuMainUI, MenuMainGraphics, MenuMainAudio, MenuMainWorld } from './MenuMainComponents/Pages.js'

export function MenuMain({ world }) {
  const [pages, setPages] = useState(() => ['index'])
  const pop = () => {
    const next = pages.slice()
    next.pop()
    setPages(next)
  }
  const push = page => {
    const next = pages.slice()
    next.push(page)
    setPages(next)
  }
  const page = pages[pages.length - 1]
  let Page
  if (page === 'index') Page = MenuMainIndex
  if (page === 'ui') Page = MenuMainUI
  if (page === 'graphics') Page = MenuMainGraphics
  if (page === 'audio') Page = MenuMainAudio
  if (page === 'world') Page = MenuMainWorld
  return <Page world={world} pop={pop} push={push} />
}
