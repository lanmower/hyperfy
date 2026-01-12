import {
  BoxIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  OctagonXIcon,
  PinIcon,
  LoaderPinwheelIcon,
  SparkleIcon,
  Trash2Icon,
} from 'lucide-react'
import { cls } from '../cls.js'
import { useContext, useEffect, useState } from 'react'
import { HintContext } from '../Hint.js'
import { Pane } from './Pane.js'
import { AppFields } from '../../AppFields.js'
import { AppTransformFields } from './AppTransformFields.js'
import { AppModelBtn } from './AppModelBtn.js'
import { useAppLogic } from '../hooks/useAppLogic.js'
import { appStyles } from './SidebarStyles.js'

let showTransforms = false

export function App({ world, hidden }) {
  const { setHint } = useContext(HintContext)
  const app = world.ui.state.app
  const [pinned, setPinned] = useState(app.data.pinned)
  const [transforms, setTransforms] = useState(showTransforms)
  const [blueprint, setBlueprint] = useState(app.blueprint)
  const { download, changeModel, toggleBlueprintKey, toggleEntityPinned } = useAppLogic(world)

  useEffect(() => {
    showTransforms = transforms
  }, [transforms])

  useEffect(() => {
    window.app = app
    const onModify = bp => {
      if (bp.id === blueprint.id) setBlueprint(bp)
    }
    world.blueprints.on('modify', onModify)
    return () => {
      world.blueprints.off('modify', onModify)
    }
  }, [])

  const frozen = blueprint.frozen

  const handleDownload = () => download(blueprint)
  const handleChangeModel = file => changeModel(blueprint, file)
  const toggleKey = (key, value) => toggleBlueprintKey(blueprint, key, value)
  const togglePinned = () => {
    const newPinned = toggleEntityPinned(app)
    setPinned(newPinned)
  }

  return (
    <Pane hidden={hidden}>
      <div className='app' css={appStyles}>
        <div className='app-head'>
          <div className='app-title'>{app.blueprint.name}</div>
          <div
            className='app-btn'
            onClick={handleDownload}
            onPointerEnter={() => setHint('Download this app')}
            onPointerLeave={() => setHint(null)}
          >
            <DownloadIcon size='1.125rem' />
          </div>
          {!frozen && (
            <AppModelBtn value={blueprint.model} onChange={handleChangeModel} world={world}>
              <div
                className='app-btn'
                onPointerEnter={() => setHint('Change this apps base model')}
                onPointerLeave={() => setHint(null)}
              >
                <BoxIcon size='1.125rem' />
              </div>
            </AppModelBtn>
          )}
          {!blueprint.scene && (
            <div
              className='app-btn'
              onClick={() => {
                world.ui.setApp(null)
                app.destroy(true)
              }}
              onPointerEnter={() => setHint('Delete this app')}
              onPointerLeave={() => setHint(null)}
            >
              <Trash2Icon size='1.125rem' />
            </div>
          )}
        </div>
        {!blueprint.scene && (
          <div className='app-toggles'>
            <div
              className={cls('app-toggle', { active: blueprint.disabled })}
              onClick={() => toggleKey('disabled')}
              onPointerEnter={() => setHint('Disable this app so that it is no longer active in the world.')}
              onPointerLeave={() => setHint(null)}
            >
              <OctagonXIcon size='1.125rem' />
            </div>
            <div
              className={cls('app-toggle', { active: pinned })}
              onClick={() => togglePinned()}
              onPointerEnter={() => setHint("Pin this app so it can't accidentally be moved.")}
              onPointerLeave={() => setHint(null)}
            >
              <PinIcon size='1.125rem' />
            </div>
            <div
              className={cls('app-toggle', { active: blueprint.preload })}
              onClick={() => toggleKey('preload')}
              onPointerEnter={() => setHint('Preload this app before entering the world.')}
              onPointerLeave={() => setHint(null)}
            >
              <LoaderPinwheelIcon size='1.125rem' />
            </div>
            <div
              className={cls('app-toggle', { active: blueprint.unique })}
              onClick={() => toggleKey('unique')}
              onPointerEnter={() => setHint('Make this app unique so that new duplicates are not linked to this one.')}
              onPointerLeave={() => setHint(null)}
            >
              <SparkleIcon size='1.125rem' />
            </div>
          </div>
        )}
        <div className='app-content noscrollbar'>
          {!blueprint.scene && (
            <div className='app-transforms'>
              <div className='app-transforms-btn' onClick={() => setTransforms(!transforms)}>
                <ChevronsUpDownIcon size='1rem' />
              </div>
              {transforms && <AppTransformFields app={app} />}
            </div>
          )}
          <AppFields world={world} app={app} blueprint={blueprint} />
        </div>
      </div>
    </Pane>
  )
}
