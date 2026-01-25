/* Centralized type validators extracted from 20+ node and handler files */
import { isNumber, isArray, every } from '../utils/helpers/typeChecks.js'

export const isDistanceModel = (v) => ['linear', 'inverse', 'exponential'].includes(v)
export const isFit = (v) => ['fill', 'fit', 'cover', 'stretch'].includes(v)
export const isPivot = (v) => ['tl', 'tm', 'tr', 'ml', 'mm', 'mr', 'bl', 'bm', 'br'].includes(v)
export const isShape = (v) => ['box', 'sphere', 'plane', 'cone', 'cylinder', 'torus'].includes(v)
export const isAlignContent = (v) => ['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'].includes(v)
export const isAlignItems = (v) => ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'].includes(v)
export const isJustifyContent = (v) => ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'].includes(v)
export const isFlexDirection = (v) => ['row', 'column', 'row-reverse', 'column-reverse'].includes(v)
export const isFlexWrap = (v) => ['nowrap', 'wrap', 'wrap-reverse'].includes(v)
export const isPosition = (v) => ['static', 'relative', 'absolute'].includes(v)
export const isOverflow = (v) => ['visible', 'hidden', 'scroll'].includes(v)
export const isTextAlign = (v) => ['auto', 'left', 'center', 'right', 'justify'].includes(v)
export const isVerticalAlign = (v) => ['auto', 'top', 'center', 'bottom'].includes(v)
export const isPhysicsShape = (v) => ['box', 'sphere', 'cylinder', 'capsule', 'trimesh'].includes(v)
export const isPhysicsType = (v) => ['static', 'dynamic', 'kinematic'].includes(v)
export const isBillboard = (v) => ['none', 'full', 'y'].includes(v)
export const isSpace = (v) => ['world', 'screen'].includes(v)
export const isGroup = (v) => v === 'group'
export const isEdge = (v) => {
  if (isNumber(v)) return true
  if (isArray(v)) return v.length === 4 && every(v, n => isNumber(n))
  return false
}
export const isScaler = (v) => isArray(v) && isNumber(v[0]) && isNumber(v[1])
