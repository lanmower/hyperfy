import {
  BoxIcon,
  BrickWallIcon,
  FileCode2Icon,
  HardDriveIcon,
  HashIcon,
  TriangleIcon,
} from 'lucide-react'
import { cls } from '../cls.js'

export function TableHeader({ sort, reorder }) {
  return (
    <div className='appslist-head'>
      <div
        className={cls('appslist-headitem name', { active: sort === 'name' })}
        onClick={() => reorder('name')}
        title='Name'
      >
        <span></span>
      </div>
      <div
        className={cls('appslist-headitem count', { active: sort === 'count' })}
        onClick={() => reorder('count')}
        title='Instances'
      >
        <HashIcon size='1.125rem' />
      </div>
      <div
        className={cls('appslist-headitem geometries', { active: sort === 'geometries' })}
        onClick={() => reorder('geometries')}
        title='Geometries'
      >
        <BoxIcon size='1.125rem' />
      </div>
      <div
        className={cls('appslist-headitem triangles', { active: sort === 'triangles' })}
        onClick={() => reorder('triangles')}
        title='Triangles'
      >
        <TriangleIcon size='1.125rem' />
      </div>
      <div
        className={cls('appslist-headitem textureSize', { active: sort === 'textureBytes' })}
        onClick={() => reorder('textureBytes')}
        title='Texture Memory Size'
      >
        <BrickWallIcon size='1.125rem' />
      </div>
      <div
        className={cls('appslist-headitem code', { active: sort === 'code' })}
        onClick={() => reorder('code')}
        title='Code'
      >
        <FileCode2Icon size='1.125rem' />
      </div>
      <div
        className={cls('appslist-headitem fileSize', { active: sort === 'fileBytes' })}
        onClick={() => reorder('fileBytes')}
        title='File Size'
      >
        <HardDriveIcon size={16} />
      </div>
      <div className='appslist-headitem actions' />
    </div>
  )
}
