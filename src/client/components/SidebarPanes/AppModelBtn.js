import { css } from '@firebolt-dev/css'
import { useState } from 'react'
import { downloadFile } from '../../../core/extras/downloadFile.js'

export function AppModelBtn({ value, onChange, children, world }) {
  const [key, setKey] = useState(0)

  const handleDownload = e => {
    if (e.shiftKey) {
      e.preventDefault()
      const file = world.loader.getFile(value)
      if (!file) return
      downloadFile(file)
    }
  }

  const handleChange = e => {
    setKey(n => n + 1)
    onChange(e.target.files[0])
  }

  return (
    <label
      className='appmodelbtn'
      css={css`
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
        }
      `}
      onClick={handleDownload}
    >
      <input key={key} type='file' accept='.glb,.vrm' onChange={handleChange} />
      {children}
    </label>
  )
}
