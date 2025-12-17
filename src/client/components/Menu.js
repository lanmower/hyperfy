import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { ChevronRightIcon } from './Icons.js'
import { useUpdate } from './useUpdate.js'
import { hashFile } from '../../core/utils-client.js'
import { LoaderIcon, XIcon } from 'lucide-react'
import { downloadFile } from '../../core/extras/downloadFile.js'
import { CurvePreview } from './CurvePreview.js'
import { Curve } from '../../core/extras/assets/Curve.js'
import { Portal } from './Portal.js'
import { CurvePane } from './CurvePane.js'

export { Menu, MenuContext } from './MenuComponents/Menu.js'
export { MenuItemBack } from './MenuComponents/MenuItemBack.js'
export { MenuLine } from './MenuComponents/MenuLine.js'
export { MenuSection } from './MenuComponents/MenuSection.js'
export { MenuItemBtn } from './MenuComponents/MenuItemBtn.js'

export function MenuItemText({ label, hint, placeholder, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  const [localValue, setLocalValue] = useState(value)
  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])
  return (
    <label
      className='menuitemtext'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemtext-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .menuitemtext-field {
          flex: 1;
        }
        input {
          text-align: right;
          cursor: inherit;
          &::selection {
            background-color: white;
            color: rgba(0, 0, 0, 0.8);
          }
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemtext-label'>{label}</div>
      <div className='menuitemtext-field'>
        <input
          type='text'
          value={localValue || ''}
          placeholder={placeholder}
          onFocus={e => e.target.select()}
          onChange={e => setLocalValue(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Enter') {
              e.preventDefault()
              onChange(localValue)
              e.target.blur()
            }
          }}
          onBlur={e => {
            onChange(localValue)
          }}
        />
      </div>
    </label>
  )
}

export function MenuItemTextarea({ label, hint, placeholder, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  const textareaRef = useRef()
  const [localValue, setLocalValue] = useState(value)
  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])
  useEffect(() => {
    const textarea = textareaRef.current
    function update() {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
    update()
    textarea.addEventListener('input', update)
    return () => {
      textarea.removeEventListener('input', update)
    }
  }, [])
  return (
    <label
      className='menuitemtextarea'
      css={css`
        display: flex;
        align-items: flex-start;
        min-height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemtextarea-label {
          padding-top: 0.6rem;
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .menuitemtextarea-field {
          flex: 1;
          padding: 0.6rem 0 0.6rem 0;
        }
        textarea {
          width: 100%;
          height: 1rem;
          text-align: right;
          height: auto;
          overflow: hidden;
          resize: none;
          cursor: inherit;
          &::selection {
            background-color: white;
            color: rgba(0, 0, 0, 0.8);
          }
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemtextarea-label'>{label}</div>
      <div className='menuitemtextarea-field'>
        <textarea
          ref={textareaRef}
          value={localValue || ''}
          placeholder={placeholder}
          onFocus={e => e.target.select()}
          onChange={e => setLocalValue(e.target.value)}
          onKeyDown={e => {
            if (e.metaKey && e.code === 'Enter') {
              e.preventDefault()
              onChange(localValue)
              e.target.blur()
            }
          }}
          onBlur={e => {
            onChange(localValue)
          }}
        />
      </div>
    </label>
  )
}

export function MenuItemNumber({
  label,
  hint,
  dp = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  value,
  onChange,
}) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  if (value === undefined || value === null) {
    value = 0
  }
  const [local, setLocal] = useState(value.toFixed(dp))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused && local !== value.toFixed(dp)) setLocal(value.toFixed(dp))
  }, [focused, value])
  const setTo = str => {
    let num
    try {
      num = (0, eval)(str)
      if (typeof num !== 'number') {
        throw new Error('input number parse fail')
      }
    } catch (err) {
      console.error(err)
      num = value
    }
    if (num < min || num > max) {
      num = value
    }
    setLocal(num.toFixed(dp))
    onChange(+num.toFixed(dp))
  }
  return (
    <label
      className='menuitemnumber'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemnumber-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .menuitemnumber-field {
          flex: 1;
        }
        input {
          text-align: right;
          cursor: inherit;
          &::selection {
            background-color: white;
            color: rgba(0, 0, 0, 0.8);
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemnumber-label'>{label}</div>
      <div className='menuitemnumber-field'>
        <input
          type='text'
          value={local}
          onChange={e => setLocal(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Enter') {
              e.preventDefault()
              e.target.blur()
            }
            if (e.code === 'ArrowUp') {
              setTo(value + step)
            }
            if (e.code === 'ArrowDown') {
              setTo(value - step)
            }
          }}
          onFocus={e => {
            setFocused(true)
            e.target.select()
          }}
          onBlur={e => {
            setFocused(false)
            if (local === '') {
              setLocal(value.toFixed(dp))
              return
            }
            setTo(local)
          }}
        />
      </div>
    </label>
  )
}

export function MenuItemRange({ label, hint, min = 0, max = 1, step = 0.05, instant, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  const trackRef = useRef()
  if (value === undefined || value === null) {
    value = 0
  }
  const [local, setLocal] = useState(value)
  const [sliding, setSliding] = useState(false)
  useEffect(() => {
    if (!sliding && local !== value) setLocal(value)
  }, [sliding, value])
  useEffect(() => {
    const track = trackRef.current
    function calculateValueFromPointer(e, trackElement) {
      const rect = trackElement.getBoundingClientRect()
      const position = (e.clientX - rect.left) / rect.width
      const rawValue = min + position * (max - min)
      const steppedValue = Math.round(rawValue / step) * step
      return Math.max(min, Math.min(max, steppedValue))
    }
    let sliding
    function onPointerDown(e) {
      sliding = true
      setSliding(true)
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    function onPointerMove(e) {
      if (!sliding) return
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
    }
    function onPointerUp(e) {
      if (!sliding) return
      sliding = false
      setSliding(false)
      const finalValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(finalValue)
      onChange(finalValue)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    track.addEventListener('pointerdown', onPointerDown)
    track.addEventListener('pointermove', onPointerMove)
    track.addEventListener('pointerup', onPointerUp)
    return () => {
      track.removeEventListener('pointerdown', onPointerDown)
      track.removeEventListener('pointermove', onPointerMove)
      track.removeEventListener('pointerup', onPointerUp)
    }
  }, [])
  const barWidthPercentage = ((local - min) / (max - min)) * 100 + ''
  const text = useMemo(() => {
    const num = local
    const decimalDigits = (num.toString().split('.')[1] || '').length
    if (decimalDigits <= 2) {
      return num.toString()
    }
    return num.toFixed(2)
  }, [local])
  return (
    <div
      className='menuitemrange'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemrange-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemrange-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-right: 0.5rem;
          opacity: 0;
        }
        .menuitemrange-track {
          width: 7rem;
          flex-shrink: 0;
          height: 0.5rem;
          border-radius: 0.1rem;
          display: flex;
          align-items: stretch;
          background-color: rgba(255, 255, 255, 0.1);
          &:hover {
            cursor: pointer;
          }
        }
        .menuitemrange-bar {
          background-color: white;
          border-radius: 0.1rem;
          width: ${barWidthPercentage}%;
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          .menuitemrange-text {
            opacity: 1;
          }
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemrange-label'>{label}</div>
      <div className='menuitemrange-text'>{text}</div>
      <div className='menuitemrange-track' ref={trackRef}>
        <div className='menuitemrange-bar' />
      </div>
    </div>
  )
}

export function MenuItemSwitch({ label, hint, options, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  options = options || []
  const idx = options.findIndex(o => o.value === value)
  const selected = options[idx]
  const prev = () => {
    let nextIdx = idx - 1
    if (nextIdx < 0) nextIdx = options.length - 1
    onChange(options[nextIdx].value)
  }
  const next = () => {
    let nextIdx = idx + 1
    if (nextIdx > options.length - 1) nextIdx = 0
    onChange(options[nextIdx].value)
  }
  return (
    <div
      className='menuitemswitch'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemswitch-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemswitch-btn {
          width: 2.125rem;
          height: 2.125rem;
          display: none;
          align-items: center;
          justify-content: center;
          opacity: 0.2;
          &:hover {
            cursor: pointer;
            opacity: 1;
          }
        }
        .menuitemswitch-text {
          line-height: 1;
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          .menuitemswitch-btn {
            display: flex;
          }
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemswitch-label'>{label}</div>
      <div className='menuitemswitch-btn left' onClick={prev}>
        <ChevronRightIcon size='1.5rem' style={{ transform: 'rotate(180deg)' }} />
      </div>
      <div className='menuitemswitch-text'>{selected?.label || '???'}</div>
      <div className='menuitemswitch-btn right' onClick={next}>
        <ChevronRightIcon size='1.5rem' />
      </div>
    </div>
  )
}

export function MenuItemToggle({ label, hint, trueLabel = 'Yes', falseLabel = 'No', value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  return (
    <div
      className='menuitemtoggle'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemtoggle-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemtoggle-text {
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
      onClick={() => onChange(!value)}
    >
      <div className='menuitemtoggle-label'>{label}</div>
      <div className='menuitemtoggle-text'>{value ? trueLabel : falseLabel}</div>
    </div>
  )
}

export function MenuItemCurve({ label, hint, x, xRange, y, yMin, yMax, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  const curve = useMemo(() => new Curve().deserialize(value || '0,0.5,0,0|1,0.5,0,0'), [value])
  const [edit, setEdit] = useState(false)
  return (
    <div
      className='menuitemcurve'
      css={css`
        .menuitemcurve-control {
          display: flex;
          align-items: center;
          height: 2.5rem;
          padding: 0 0.875rem;
        }
        .menuitemcurve-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemcurve-curve {
          width: 6rem;
          height: 1.2rem;
          position: relative;
        }
        &:hover {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}
    >
      <div
        className='menuitemcurve-control'
        onClick={() => {
          if (edit) {
            setEdit(null)
          } else {
            setEdit(curve.clone())
          }
        }}
        onPointerEnter={() => setHint(hint)}
        onPointerLeave={() => setHint(null)}
      >
        <div className='menuitemcurve-label'>{label}</div>
        <div className='menuitemcurve-curve'>
          <CurvePreview curve={curve} yMin={yMin} yMax={yMax} />
        </div>
      </div>
      {edit && (
        <Portal>
          <CurvePane
            curve={edit}
            title={label}
            xLabel={x}
            xRange={xRange}
            yLabel={y}
            yMin={yMin}
            yMax={yMax}
            onCommit={() => {
              onChange(edit.serialize())
              setEdit(null)
            }}
            onCancel={() => {
              setEdit(null)
            }}
          />
        </Portal>
      )}
    </div>
  )
}

export function MenuItemFileBtn({ label, hint, accept, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  const nRef = useRef(0)
  const update = useUpdate()
  const [loading, setLoading] = useState(null)
  const set = async e => {
    const n = ++nRef.current
    update()
    const file = e.target.files[0]
    if (!file) return
    const hash = await hashFile(file)
    const filename = `${hash}.${file.name.split('.').pop()}`
    const url = `asset://${filename}`
    const newValue = {
      name: file.name,
      url,
    }
    setLoading(newValue)
    setLoading(null)
    onChange(newValue)
  }
  const remove = e => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }
  const n = nRef.current
  const name = loading?.name || value?.name
  return (
    <label
      className='menuitemfilebtn'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg {
          line-height: 0;
        }
        .menuitemfilebtn-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemfilebtn-name {
          text-align: right;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 9rem;
        }
        .menuitemfilebtn-x {
          line-height: 0;
          margin: 0 -0.2rem 0 0.3rem;
          color: rgba(255, 255, 255, 0.3);
          &:hover {
            color: white;
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemfilebtn-label'>{label}</div>
      {name && <div className='menuitemfilebtn-name'>{name}</div>}
      {value && !loading && (
        <div className='menuitemfilebtn-x'>
          <XIcon size='1rem' onClick={remove} />
        </div>
      )}
      {loading && (
        <div>
          <LoaderIcon size='1rem' />
        </div>
      )}
      <input key={n} type='file' onChange={set} accept={accept} />
    </label>
  )
}

export const fileKinds = {
  avatar: {
    type: 'avatar',
    accept: '.vrm',
    exts: ['vrm'],
    placeholder: 'vrm',
  },
  emote: {
    type: 'emote',
    accept: '.glb',
    exts: ['glb'],
    placeholder: 'glb',
  },
  model: {
    type: 'model',
    accept: '.glb',
    exts: ['glb'],
    placeholder: 'glb',
  },
  texture: {
    type: 'texture',
    accept: '.jpg,.jpeg,.png,.webp',
    exts: ['jpg', 'jpeg', 'png', 'webp'],
    placeholder: 'jpg,png,webp',
  },
  image: {
    type: 'image',
    accept: '.jpg,.jpeg,.png,.webp',
    exts: ['jpg', 'jpeg', 'png', 'webp'],
    placeholder: 'jpg,png,webp',
  },
  video: {
    type: 'video',
    accept: '.mp4',
    exts: ['mp4'],
    placeholder: 'mp4',
  },
  hdr: {
    type: 'hdr',
    accept: '.hdr',
    exts: ['hdr'],
    placeholder: 'hdr',
  },
  audio: {
    type: 'audio',
    accept: '.mp3',
    exts: ['mp3'],
    placeholder: 'mp3',
  },
}

export function MenuItemFile({ world, label, hint, kind: kindName, value, onChange }) {
  const MenuContext = require('./MenuComponents/Menu.js').MenuContext
  const setHint = useContext(MenuContext)
  const nRef = useRef(0)
  const update = useUpdate()
  const [loading, setLoading] = useState(null)
  const kind = fileKinds[kindName]
  if (!kind) return null
  const set = async e => {
    const n = ++nRef.current
    update()
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!kind.exts.includes(ext)) {
      return console.error(`attempted invalid file extension for ${kindName}: ${ext}`)
    }
    const hash = await hashFile(file)
    const filename = `${hash}.${ext}`
    const url = `asset://${filename}`
    const newValue = {
      type: kind.type,
      name: file.name,
      url,
    }
    setLoading(newValue)
    await world.network.upload(file)
    if (nRef.current !== n) return
    world.loader.insert(kind.type, url, file)
    setLoading(null)
    onChange(newValue)
  }
  const remove = e => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }
  const handleDownload = async e => {
    if (e.shiftKey && value?.url) {
      e.preventDefault()
      if (!world.loader.hasFile(value.url)) {
        await world.loader.loadFile(value.url)
      }
      const file = world.loader.getFile(value.url, value.name)
      if (!file) return console.error('could not load file')
      downloadFile(file)
    }
  }
  const n = nRef.current
  const name = loading?.name || value?.name
  return (
    <label
      className='menuitemfile'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg {
          line-height: 0;
        }
        .menuitemfile-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemfile-placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .menuitemfile-name {
          text-align: right;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 9rem;
        }
        .menuitemfile-x {
          line-height: 0;
          margin: 0 -0.2rem 0 0.3rem;
          color: rgba(255, 255, 255, 0.3);
          &:hover {
            color: white;
          }
        }
        .menuitemfile-loading {
          margin: 0 -0.1rem 0 0.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          svg {
            animation: spin 1s linear infinite;
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
      onClick={handleDownload}
    >
      <div className='menuitemfile-label'>{label}</div>
      {!value && !loading && <div className='menuitemfile-placeholder'>{kind.placeholder}</div>}
      {name && <div className='menuitemfile-name'>{name}</div>}
      {value && !loading && (
        <div className='menuitemfile-x'>
          <XIcon size='1rem' onClick={remove} />
        </div>
      )}
      {loading && (
        <div className='menuitemfile-loading'>
          <LoaderIcon size='1rem' />
        </div>
      )}
      <input key={n} type='file' onChange={set} accept={kind.accept} />
    </label>
  )
}
