import { css } from '@firebolt-dev/css'
import { CircleIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { renderHierarchy } from './NodeHierarchyComponents/Tree.js'
import { DetailsPanel } from './NodeHierarchyComponents/Details.js'

export function NodeHierarchy({ app }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const rootNode = useMemo(() => app.getNodes(), [app])

  useEffect(() => {
    if (rootNode && !selectedNode) {
      setSelectedNode(rootNode)
    }
  }, [rootNode])

  const getVectorString = vec => {
    if (!vec || typeof vec.x !== 'number') return null
    return `${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)}`
  }

  const hasProperty = (obj, prop) => {
    try {
      return obj && typeof obj[prop] !== 'undefined'
    } catch (err) {
      return false
    }
  }

  return (
    <div
      className='nodehierarchy noscrollbar'
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding-top: 0.5rem;
        .nodehierarchy-tree {
          flex: 1;
          padding: 0 1rem;
          overflow-y: auto;
          margin-bottom: 1.25rem;
        }
        .nodehierarchy-item {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.375rem;
          border-radius: 0.325rem;
          font-size: 0.9375rem;
          cursor: pointer;
          &:hover {
            color: #00a7ff;
          }
          &.selected {
            color: #00a7ff;
            background: rgba(0, 167, 255, 0.1);
          }
          svg {
            margin-right: 0.5rem;
            opacity: 0.5;
            flex-shrink: 0;
          }
          span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          &-indent {
            margin-left: 1.25rem;
          }
        }
        .nodehierarchy-empty {
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          padding: 1rem;
        }
        .nodehierarchy-details {
          flex-shrink: 0;
          border-top: 0.0625rem solid rgba(255, 255, 255, 0.05);
          padding: 1rem;
          max-height: 40vh;
          overflow-y: auto;
        }
        .nodehierarchy-detail {
          display: flex;
          margin-bottom: 0.5rem;
          font-size: 0.9375rem;
          &-label {
            width: 6.25rem;
            color: rgba(255, 255, 255, 0.5);
            flex-shrink: 0;
          }
          &-value {
            flex: 1;
            word-break: break-word;
            &.copy {
              cursor: pointer;
            }
          }
        }
      `}
    >
      <div className='nodehierarchy-tree'>
        {rootNode ? (
          renderHierarchy([rootNode], 0, selectedNode, setSelectedNode)
        ) : (
          <div className='nodehierarchy-empty'>
            <CircleIcon size={24} />
            <div>No nodes found</div>
          </div>
        )}
      </div>
      <DetailsPanel selectedNode={selectedNode} getVectorString={getVectorString} hasProperty={hasProperty} />
    </div>
  )
}
