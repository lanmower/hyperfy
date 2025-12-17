import { buttons, propToLabel } from '../../core/extras/buttons.js'
import { MouseLeftIcon } from '../MouseLeftIcon.js'
import { MouseRightIcon } from '../MouseRightIcon.js'
import { MouseWheelIcon } from '../MouseWheelIcon.js'
import { ActionPill } from './ActionPill.js'
import { ActionIcon } from './ActionIcon.js'

export function getActionIcon(action) {
  if (action.type === 'custom') {
    return <ActionPill label={action.btn} />
  }
  if (action.type === 'controlLeft') {
    return <ActionPill label='Ctrl' />
  }
  if (action.type === 'mouseLeft') {
    return <ActionIcon icon={MouseLeftIcon} />
  }
  if (action.type === 'mouseRight') {
    return <ActionIcon icon={MouseRightIcon} />
  }
  if (action.type === 'mouseWheel') {
    return <ActionIcon icon={MouseWheelIcon} />
  }
  if (buttons.has(action.type)) {
    return <ActionPill label={propToLabel[action.type]} />
  }
  return <ActionPill label='?' />
}
