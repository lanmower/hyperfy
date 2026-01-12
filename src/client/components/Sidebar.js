import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'
import { HintProvider } from './Hint.js'
import { useRank } from './useRank.js'
import { SidebarButtons } from './SidebarButtons.js'
import { SidebarPanes } from './SidebarPanes.js'



export function Sidebar({ world, ui }) {
  const player = world.entities?.player
  const { isAdmin, isBuilder } = useRank(world, player)
  const [livekit, setLiveKit] = useState(() => world.livekit?.status || { connected: false })

  useEffect(() => {
    const onLiveKitStatus = status => {
      setLiveKit({ ...status })
    }
    world.livekit.on('status', onLiveKitStatus)
    return () => {
      world.livekit.off('status', onLiveKitStatus)
    }
  }, [])

  const activePane = ui.active ? ui.pane : null
  const isVisible = ui.visible !== false

  return (
    <HintProvider>
      <div
        className='sidebar'
        css={css`
          position: absolute;
          font-size: 1rem;
          top: calc(2rem + env(safe-area-inset-top));
          right: calc(2rem + env(safe-area-inset-right));
          bottom: calc(2rem + env(safe-area-inset-bottom));
          left: calc(2rem + env(safe-area-inset-left));
          display: flex;
          gap: 0.625rem;
          z-index: 1;
          transition: opacity 0.2s ease-out;
          opacity: ${isVisible ? 1 : 0};
          pointer-events: ${isVisible ? 'auto' : 'none'};
          @media all and (max-width: 1200px) {
            top: calc(1rem + env(safe-area-inset-top));
            right: calc(1rem + env(safe-area-inset-right));
            bottom: calc(1rem + env(safe-area-inset-bottom));
            left: calc(1rem + env(safe-area-inset-left));
          }
          .sidebar-sections {
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            gap: 0.625rem;
          }
        `}
      >
        <SidebarButtons world={world} ui={ui} isBuilder={isBuilder} livekit={livekit} activePane={activePane} />
        <SidebarPanes world={world} ui={ui} />
      </div>
    </HintProvider>
  )
}
