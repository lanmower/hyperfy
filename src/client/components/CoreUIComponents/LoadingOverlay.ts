import React from 'react'
import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'

export function LoadingOverlay({ world }) {
  const [progress, setProgress] = useState(0)
  const [complete, setComplete] = useState(false)
  const { title, desc, image } = world?.settings || {}

  useEffect(() => {
    if (!world) return

    // Listen for progress updates
    const handleProgress = (p) => {
      setProgress(p)
      if (p >= 100) {
        setComplete(true)
      }
    }

    world.on('progress', handleProgress)

    // Also dismiss after 8 seconds if world is initialized (fallback for no-preload case)
    const timeout = setTimeout(() => {
      if (world && !complete) {
        setComplete(true)
      }
    }, 8000)

    return () => {
      world.off('progress', handleProgress)
      clearTimeout(timeout)
    }
  }, [world, complete])

  // Hide overlay when complete
  if (complete) {
    return null
  }

  return (
    <div
      css={css`
        position: absolute;
        inset: 0;
        background: black;
        display: flex;
        pointer-events: auto;
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        .loading-image {
          position: absolute;
          inset: 0;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          background-image: ${image && world?.resolveURL ? `url(${world.resolveURL(image.url)})` : 'none'};
          animation: pulse 5s ease-in-out infinite;
        }
        .loading-shade {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(15px);
        }
        .loading-info {
          position: absolute;
          bottom: 50px;
          left: 50px;
          right: 50px;
          max-width: 28rem;
        }
        .loading-title {
          font-size: 2.4rem;
          line-height: 1.2;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }
        .loading-desc {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          margin: 0 0 20px;
        }
        .loading-track {
          height: 5px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
        }
        .loading-bar {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: ${progress}%;
          background: white;
          border-radius: 3px;
          transition: width 0.2s ease-out;
        }
      `}
    >
      <div className='loading-image' />
      <div className='loading-shade' />
      <div className='loading-info'>
        {title && <div className='loading-title'>{title}</div>}
        {desc && <div className='loading-desc'>{desc}</div>}
        <div className='loading-track'>
          <div className='loading-bar' />
        </div>
      </div>
    </div>
  )
}
