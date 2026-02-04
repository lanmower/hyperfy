import React from 'react'
import { MessageSquareTextIcon, SendHorizonalIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cls, isTouch } from '../../utils.js'
import { ControlPriorities } from '../../../core/extras/ControlPriorities.js'
import { MiniMessages } from './MiniMessages.js'
import { Messages } from './Messages.js'
import { useWorldEvent } from '../hooks/index.js'
import { chatStyles } from '../styles/ComponentStyles.js'

export function Chat({ world }) {
  const inputRef = useRef()
  const [msg, setMsg] = useState('')
  const [active, setActive] = useState(false)

  useWorldEvent(world, 'sidebar-chat-toggle', () => setActive(v => !v))

  useEffect(() => {
    const control = world.controls.bind({ priority: ControlPriorities.CORE_UI })
    control.slash.onPress = () => {
      if (!active) setActive(true)
    }
    control.enter.onPress = () => {
      if (!active) setActive(true)
    }
    control.mouseLeft.onPress = () => {
      if (control.pointer.locked && active) {
        setActive(false)
      }
    }
    return () => control.release()
  }, [active])

  useEffect(() => {
    if (active) {
      inputRef.current?.focus()
    } else {
      inputRef.current?.blur()
    }
  }, [active])

  const send = async e => {
    if (world.controls.pointer.locked) {
      setTimeout(() => setActive(false), 10)
    }
    if (!msg) {
      e.preventDefault()
      return setActive(false)
    }
    setMsg('')
    if (msg.startsWith('/')) {
      world.chat.command(msg)
      return
    }
    world.chat.send(msg)
    if (isTouch) {
      e.target.blur()
      setTimeout(() => setActive(false), 10)
    }
  }

  return (
    <div className={cls('mainchat', { active })} css={chatStyles}>
      <div className='mainchat-msgs'>
        {isTouch && !active && <MiniMessages world={world} />}
        {(!isTouch || active) && <Messages world={world} active={active} />}
      </div>
      <div className='mainchat-btn' onClick={() => setActive(true)}>
        <MessageSquareTextIcon size='1.125rem' />
      </div>
      <label className='mainchat-entry'>
        <input
          ref={inputRef}
          className='side-chatbox-input'
          type='text'
          placeholder='Say something...'
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Escape') {
              setActive(false)
            }
            if (e.code === 'Enter' || e.key === 'Enter') {
              send(e)
            }
          }}
          onBlur={e => {
            if (!isTouch) {
              setActive(false)
            }
          }}
        />
        {isTouch && (
          <div className='mainchat-send' onClick={e => send(e)}>
            <SendHorizonalIcon size='1.125rem' />
          </div>
        )}
      </label>
    </div>
  )
}
