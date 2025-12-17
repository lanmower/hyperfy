import { css } from '@firebolt-dev/css'
import { useRef, useState } from 'react'
import { RotateCcwIcon, SearchIcon, XIcon } from 'lucide-react'
import { usePane } from './usePane.js'
import { Content } from './AppsPaneComponents/Content.js'

export function AppsPane({ world, close }) {
  const paneRef = useRef()
  const headRef = useRef()
  usePane('apps', paneRef, headRef)
  const [query, setQuery] = useState('')
  const [refresh, setRefresh] = useState(0)
  return (
    <div
      ref={paneRef}
      className='apane'
      css={css`
        position: absolute;
        top: 20px;
        left: 20px;
        width: 38rem;
        background-color: rgba(15, 16, 24, 0.8);
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        font-size: 1rem;
        .apane-head {
          height: 3.125rem;
          background: black;
          display: flex;
          align-items: center;
          padding: 0 0.8125rem 0 1.25rem;
          &-title {
            font-size: 1.2rem;
            font-weight: 500;
            flex: 1;
          }
          &-search {
            width: 9.375rem;
            display: flex;
            align-items: center;
            svg {
              margin-right: 0.3125rem;
            }
            input {
              flex: 1;
              font-size: 1rem;
            }
          }
          &-btn {
            width: 1.875rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.5);
            &:hover {
              cursor: pointer;
              color: white;
            }
          }
        }
      `}
    >
      <div className='apane-head' ref={headRef}>
        <div className='apane-head-title'>Apps</div>
        <div className='apane-head-search'>
          <SearchIcon size={16} />
          <input type='text' placeholder='Search' value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className='apane-head-btn' onClick={() => setRefresh(n => n + 1)}>
          <RotateCcwIcon size={16} />
        </div>
        <div className='apane-head-btn' onClick={close}>
          <XIcon size={20} />
        </div>
      </div>
      <Content world={world} query={query} refresh={refresh} setRefresh={setRefresh} />
    </div>
  )
}
