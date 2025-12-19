import { RocketIcon, SearchIcon } from 'lucide-react'
import { cls } from '../cls.js'
import { useEffect, useRef, useState } from 'react'
import { AppsList } from '../AppsList.js'
import { Pane } from './Pane.js'
import { appsStyles } from './SidebarStyles.js'

const appsState = {
  query: '',
  perf: false,
  scrollTop: 0,
}

export function Apps({ world, hidden }) {
  const contentRef = useRef()
  const [query, setQuery] = useState(appsState.query)
  const [perf, setPerf] = useState(appsState.perf)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    contentRef.current.scrollTop = appsState.scrollTop
  }, [])

  useEffect(() => {
    appsState.query = query
    appsState.perf = perf
  }, [query, perf])

  return (
    <Pane width={perf ? '40rem' : '20rem'} hidden={hidden}>
      <div className='apps' css={appsStyles}>
        <div className='apps-head'>
          <div className='apps-title'>Apps</div>
          <label className='apps-search'>
            <SearchIcon size='1.125rem' />
            <input type='text' placeholder='Search' value={query} onChange={e => setQuery(e.target.value)} />
          </label>
          <div className={cls('apps-toggle', { active: perf })} onClick={() => setPerf(!perf)}>
            <RocketIcon size='1.125rem' />
          </div>
        </div>
        <div
          ref={contentRef}
          className='apps-content noscrollbar'
          onScroll={e => {
            appsState.scrollTop = contentRef.current.scrollTop
          }}
        >
          <AppsList world={world} query={query} perf={perf} refresh={refresh} setRefresh={setRefresh} />
        </div>
      </div>
    </Pane>
  )
}
