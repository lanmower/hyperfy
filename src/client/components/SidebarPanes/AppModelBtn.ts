import React, { useState } from 'react'
import { css } from '@firebolt-dev/css'
import { downloadFile } from '../../../core/extras/downloadFile.js'

interface AppModelBtnProps {
  value: string
  onChange: (file: File) => void
  children: React.ReactNode
  world: any
}

export function AppModelBtn({ value, onChange, children, world }: AppModelBtnProps) {
  const [key, setKey] = useState(0)

  const handleDownload = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (e.shiftKey) {
      e.preventDefault()
      const file = world.loader.getFile(value)
      if (!file) return
      downloadFile(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(n => n + 1)
    const file = e.target.files?.[0]
    if (file) onChange(file)
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
