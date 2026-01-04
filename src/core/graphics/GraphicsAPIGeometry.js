// PlayCanvas geometry and material creation
import { GraphicsDevice, Mesh, VertexBuffer, VertexFormat, Vec2, Vec3, Color, createSphere, createCylinder, createCone, createTorus, createPlane, StandardMaterial, Entity } from '../extras/playcanvas.js'

export class GraphicsAPIGeometry {
  createBoxGeometry(width, height, depth) {
    const mesh = new Mesh(GraphicsDevice.instance)
    const positions = [
      -width/2, -height/2, depth/2,   width/2, -height/2, depth/2,
      width/2, height/2, depth/2,    -width/2, height/2, depth/2,
      -width/2, -height/2, -depth/2,  -width/2, height/2, -depth/2,
      width/2, height/2, -depth/2,   width/2, -height/2, -depth/2
    ]
    const vertexBuffer = new VertexBuffer(GraphicsDevice.instance, VertexFormat.getDefaultVertexFormat(GraphicsDevice.instance), 8, positions)
    mesh.setVertexBuffer(0, vertexBuffer)
    return mesh
  }

  createSphereGeometry(radius, widthSegments = 32, heightSegments = 16) {
    return createSphere(GraphicsDevice.instance, {
      radius: radius
    })
  }

  createCylinderGeometry(radiusTop, radiusBottom, height, radialSegments = 32) {
    return createCylinder(GraphicsDevice.instance, {
      radius: radiusTop,
      height: height
    })
  }

  createConeGeometry(radius, height, radialSegments = 32) {
    return createCone(GraphicsDevice.instance, {
      baseRadius: radius,
      peakRadius: 0,
      height: height
    })
  }

  createTorusGeometry(radius, tube, radialSegments = 100, tubularSegments = 100) {
    return createTorus(GraphicsDevice.instance, {
      radius: radius,
      tubeRadius: tube
    })
  }

  createPlaneGeometry(width, height) {
    return createPlane(GraphicsDevice.instance, {
      halfExtents: new Vec2(width / 2, height / 2)
    })
  }

  createMaterial(type = 'standard', props = {}) {
    const material = new StandardMaterial()

    if (props.color) {
      const color = typeof props.color === 'number'
        ? new Color((props.color >> 16) & 255 / 255, (props.color >> 8) & 255 / 255, props.color & 255 / 255)
        : new Color(...props.color)
      material.diffuse = color
      material.emissive = color
    }

    if (props.metalness !== undefined) {
      material.metalness = props.metalness
    }

    if (props.roughness !== undefined) {
      material.roughness = props.roughness
    }

    if (props.opacity !== undefined) {
      material.opacity = props.opacity
    }

    if (props.emissive) {
      const emissiveColor = typeof props.emissive === 'number'
        ? new Color((props.emissive >> 16) & 255 / 255, (props.emissive >> 8) & 255 / 255, props.emissive & 255 / 255)
        : new Color(...props.emissive)
      material.emissive = emissiveColor
    }

    material.update()
    return material
  }

  createMesh(geometry, material) {
    const entity = new Entity()
    entity.addComponent('model', {
      type: 'asset'
    })
    return entity
  }
}
