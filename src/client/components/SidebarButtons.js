import { cls } from './cls.js'
import { sectionStyles, btnStyles } from './SidebarButtonStyles.js'
import { UserSection } from './SidebarButtonGroups/UserSection.js'
import { BuilderSection } from './SidebarButtonGroups/BuilderSection.js'
import { AppSection } from './SidebarButtonGroups/AppSection.js'

function Section({ active, top, bottom, children }) {
  return (
    <div className={cls('sidebar-section', { active, top, bottom })} css={sectionStyles}>
      {children}
    </div>
  )
}

export function SidebarButtons({ world, ui, isBuilder, livekit, activePane }) {
  return (
    <div className='sidebar-sections'>
      <Section active={activePane} bottom>
        <UserSection world={world} ui={ui} livekit={livekit} activePane={activePane} />
      </Section>
      {isBuilder && (
        <Section active={activePane} top bottom>
          <BuilderSection world={world} ui={ui} activePane={activePane} />
        </Section>
      )}
      {ui.app && (
        <Section active={activePane} top bottom>
          <AppSection world={world} ui={ui} activePane={activePane} />
        </Section>
      )}
    </div>
  )
}
