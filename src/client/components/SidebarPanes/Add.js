import { css } from '@firebolt-dev/css'
import { cloneDeep } from 'lodash-es'
import { uuid } from '../../../core/utils.js'
import { Pane } from './Pane.js'

export function Add({ world, hidden }) {
  const collection = world.collections.get('default')
  const span = 4
  const gap = '0.5rem'

  const add = blueprint => {
    blueprint = cloneDeep(blueprint)
    blueprint.id = uuid()
    blueprint.version = 0
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
      <div
        className='add'
        css={css`
          background: rgba(11, 10, 21, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.375rem;
          display: flex;
          flex-direction: column;
          min-height: 17rem;
          .add-head {
            height: 3.125rem;
            padding: 0 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
          }
          .add-title {
            font-weight: 500;
            font-size: 1rem;
            line-height: 1;
          }
          .add-content {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
          }
          .add-items {
            display: flex;
            align-items: stretch;
            flex-wrap: wrap;
            gap: ${gap};
          }
          .add-item {
            flex-basis: calc((100% / ${span}) - (${gap} * (${span} - 1) / ${span}));
            cursor: pointer;
          }
          .add-item-image {
            width: 100%;
            aspect-ratio: 1;
            background-color: #1c1d22;
            background-size: cover;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 0.7rem;
            margin: 0 0 0.4rem;
          }
          .add-item-name {
            text-align: center;
            font-size: 0.875rem;
          }
        `}
      >
        <div className='add-head'>
          <div className='add-title'>Add</div>
        </div>
        <div className='add-content noscrollbar'>
          <div className='add-items'>
            {collection.blueprints.map(blueprint => (
              <div className='add-item' key={blueprint.id} onClick={() => add(blueprint)}>
                <div
                  className='add-item-image'
                  css={css`
                    background-image: url(${world.resolveURL(blueprint.image?.url)});
                  `}
                ></div>
                <div className='add-item-name'>{blueprint.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Pane>
  )
}
