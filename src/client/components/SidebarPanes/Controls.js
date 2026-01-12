import { css } from '@firebolt-dev/css'
import { Pane } from './Pane.js'

export function Controls({ hidden }) {
  return (
    <Pane hidden={hidden}>
      <div
        css={css`
          padding: 1rem;
          background: rgba(11, 10, 21, 0.85);
          border: 0.0625rem solid #2a2b39;
          border-radius: 1rem;
          backdrop-filter: blur(5px);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9375rem;
          line-height: 1.6;
          overflow-y: auto;
          max-height: 100%;
        `}
      >
        <h3 css={css`margin: 0 0 1rem; font-size: 1.125rem; color: white;`}>Controls</h3>

        <h4 css={css`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);`}>Movement</h4>
        <div css={css`margin-bottom: 1rem;`}>
          <div><strong>W/A/S/D</strong> - Move forward/left/back/right</div>
          <div><strong>Space</strong> - Jump</div>
          <div><strong>Mouse</strong> - Look around</div>
          <div><strong>Click</strong> - Lock/unlock mouse</div>
        </div>

        <h4 css={css`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);`}>Camera</h4>
        <div css={css`margin-bottom: 1rem;`}>
          <div><strong>Ctrl + Scroll</strong> - Zoom camera</div>
          <div><strong>Shift + Scroll</strong> - Scale grab objects</div>
        </div>

        <h4 css={css`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);`}>Interaction</h4>
        <div css={css`margin-bottom: 1rem;`}>
          <div><strong>F</strong> - Grab/interact</div>
          <div><strong>C</strong> - Rotate grab objects</div>
          <div><strong>Right Click</strong> - Secondary action</div>
        </div>

        <h4 css={css`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);`}>UI</h4>
        <div css={css`margin-bottom: 1rem;`}>
          <div><strong>Z</strong> - Toggle UI</div>
          <div><strong>Esc</strong> - Close panels</div>
          <div><strong>Enter</strong> - Chat</div>
          <div><strong>/</strong> - Chat commands</div>
        </div>
      </div>
    </Pane>
  )
}
