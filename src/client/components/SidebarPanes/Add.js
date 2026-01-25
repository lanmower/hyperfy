import { cloneDeep } from '../../../core/utils/helpers/typeChecks.js'
import { uuid } from '../../../core/utils.js'
import { BlueprintFactory } from '../../../core/factories/BlueprintFactory.js'
import { Pane } from './Pane.js'
import { addStyles, addItemImageStyles } from './SidebarStyles.js'

export function Add({ world, hidden }) {
  const collection = world.collections.get('default')
  const span = 4
  const gap = '0.5rem'

  const add = blueprint => {
    blueprint = BlueprintFactory.createBlueprint('app', cloneDeep(blueprint))
    world.blueprints.add(blueprint, true)
    const transform = world.builder.getSpawnTransform(true)
    world.builder.toggle(true)
    world.builder.control.pointer.lock()
    setTimeout(() => {
      const data = {
        id: uuid(),
        type: 'app',
        blueprint: blueprint.id,
        position: transform.position,
        quaternion: transform.quaternion,
        scale: [1, 1, 1],
        mover: world.network.id,
        uploader: null,
        pinned: false,
        state: {},
      }
      const app = world.entities.add(data, true)
      world.builder.select(app)
    }, 100)
  }

  return (
    <Pane hidden={hidden}>
      <div className='add' css={addStyles(span, gap)}>
        <div className='add-head'>
          <div className='add-title'>Add</div>
        </div>
        <div className='add-content noscrollbar'>
          <div className='add-items'>
            {collection.blueprints.map(blueprint => (
              <div className='add-item' key={blueprint.id} onClick={() => add(blueprint)}>
                <div className='add-item-image' css={addItemImageStyles(world.resolveURL(blueprint.image?.url))}></div>
                <div className='add-item-name'>{blueprint.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Pane>
  )
}
