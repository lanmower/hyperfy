import { css } from '@firebolt-dev/css'
import { useMenuHint, useFieldTextarea, menuLabelCss } from '../hooks/index.js'

export function MenuItemTextarea({ label, hint, placeholder, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const textareaProps = useFieldTextarea(value, onChange)
  return (
    <label
      className='menuitemtextarea'
      css={css`
        display: flex;
        align-items: flex-start;
        min-height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemtextarea-label { ${menuLabelCss} padding-top: 0.6rem; }
        .menuitemtextarea-field { flex: 1; padding: 0.6rem 0; }
        textarea {
          width: 100%;
          text-align: right;
          height: auto;
          overflow: hidden;
          resize: none;
          cursor: inherit;
          &::selection { background-color: white; color: rgba(0, 0, 0, 0.8); }
        }
        &:hover { background-color: rgba(255, 255, 255, 0.05); }
      `}
      {...hintProps}
    >
      <div className='menuitemtextarea-label'>{label}</div>
      <div className='menuitemtextarea-field'>
        <textarea placeholder={placeholder} {...textareaProps} />
      </div>
    </label>
  )
}
