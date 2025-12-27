# Docs

## Environment

Apps are individual objects in a 3D virtual world and each app has its own transform (position, rotation and scale) in the world.
All apps have a script attached to them, and the script executes in its own isolated JavaScript compartment.
Scripts are able to instantiate shapes and other things to form specific objects like a couch, building or plant.
Players are free to grab apps, move them around or duplicate them.
The origin of an app should always be treated as the 'ground' position, as players generally move apps across surfaces of other apps.
Players are around 1.7m tall, are able to jump around 1.5m high and around 5m in distance when running and jumping.

## Coordinate System & Units

For all intents and purposes these virtual worlds use the same coordinate system as three.js (X = Right, Y = Up, Z = forward).
The unit of measurement for distance or size is in meters.
Rotations are in radians but you can use degrees by multiplying by the global constant `DEG2RAD`.

## Globals

Scripts all execute in isolated compartments and a very strict set of globals are available:

- Math: all Math.* globals are available
- prng: a function that creates a pseudo-random number generator (see docs later on)
- Vector3: the same api as three.js
- Euler: the same api as three.js
- Quaternion: the same api as three.js
- DEG2RAD: multiply by this constant to convert degrees into radians
- RAD2DEG: multiply by this constant to convert radians into degrees
- uuid: a function that generates uuid's
- app: the app the current script is attached to

Only use globals listed above (eg "Date" does not exist and will crash)

## Shapes

Shapes are the primary way to create visuals, we call these prims. Each `type` of prim has its own `size` format. This is how you create them:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 2, 3], // width, height, depth
  color: '#ff0000' // red
})

const sphere = app.create('prim', {
  type: 'sphere',
  size: [0.5], // radius
  color: '#00ff00' // green
})

const cylinder = app.create('prim', {
  type: 'cylinder',
  size: [0.5, 0.5, 1], // topRadius, bottomRadius, height
  color: '#0000ff' // blue
})
```

Once created you can also edit their properties if needed:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 2, 3],
  color: '#ff0000'
})

// change the box color
box.color = 'green'
```

## Opacity

Some shapes might need to be semi-transparent, and the `opacity` property controls this:

```jsx
const window = app.create('prim', {
  type: 'box',
  size: [2, 2, 0.1],
  color: 'blue',
  opacity: 0.5,
})
```

## Rendering

Creating a node (eg a prim) does not be make it visible. Only nodes added to the `app` global become visible in the world.

```jsx
app.add(boxA)
```

## Nested Hierarchy

It is beneficial to group different prims together to form each part of an overall object.
For example when making a wheel for a car, you can construct one wheel and then easily clone it and move it around.

To do this, there is also a special `group` node that doesn't have a visual and is purely for

```jsx
const wheel = app.create('group')
const tire = app.create('prim', {
  type: 'cylinder',
  size: [0.5, 0.5, 0.2],
  color: 'black',
  physics: 'static',
})
const hub = app.create('prim', {
  type: 'cylinder',
  size: [0.3, 0.3, 0.25],
  color: 'grey',
  physics: 'static',
})
wheel.add(tire)
wheel.add(hub)
const wheelFL = wheel.clone(true) // clone all children
const wheelFR = wheel.clone(true)
const wheelBL = wheel.clone(true)
const wheelBR = wheel.clone(true)
// ...position the wheels (not shown)
app.add(wheelFL)
app.add(wheelFR)
app.add(wheelBL)
app.add(wheelBR)
```

It is also very useful to 'change' the pivot point of something and make it easier to work with:

```jsx
const bar = app.create('group')
const beam = app.create('prim', {
  type: 'box',
  size: [1, 0.2, 10],
  position: [0, 0, -5], // shift back
})
bar.add(beam)
// bar.rotation.y now spins the beam at one end of it instead of the center
bar.rotation.y += 45 * DEG2RAD
```

## App Origin

Most of the time, players will place apps on top of other surfaces, so app origins should be treated as the 'ground'.
This means that most of the time you will need to lift things up:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  position: [0, 0.5, 0] // lift up so it sits on the ground surface
})
```

## Modelling with Transforms

With the combination of positions, rotations and scales you can build up more complex geometry:

```jsx
const base = app.create('group')

const leg = app.create('prim', {
  type: 'box',
  size: [0.2, 1, 0.2],
  color: 'brown',
  position: [0, 0.5, 0],
})

base.add(leg)

const leg1 = base.clone()
const leg2 = base.clone()
const leg3 = base.clone()
const leg4 = base.clone()

leg1.position.x = -0.5
leg1.position.z = -0.5

leg2.position.x = 0.5
leg2.position.z = -0.5

leg3.position.x = -0.5
leg3.position.z = 0.5

leg4.position.x = 0.5
leg4.position.z = 0.5

app.add(leg1)
app.add(leg2)
app.add(leg3)
app.add(leg4)

const tabletop = app.create('prim', {
  type: 'box',
  size: [1.2, 0.05, 1.2],
  color: 'maple',
  position: [0, 1.05, 0],
})

app.add(tabletop)
```

## Physics

Shapes can have physics behavior, allowing collisions and forces. The physics property can be:
- `"static"` - does not move, doesn't respond to forces
- `"dynamic"` - moves and responds to forces
- `"kinematic"` - moves but doesn't respond to forces

```jsx
const block = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: 'grey',
  physics: 'dynamic'
})

app.add(block)
```

## Cloning

Any node can be cloned with the `clone()` method:

```jsx
const original = app.create('prim', {
  type: 'box',
  size: [1, 2, 3],
  color: '#ff0000'
})

const copy1 = original.clone()
const copy2 = original.clone()

copy1.color = 'green'
copy2.color = 'blue'

app.add(copy1)
app.add(copy2)
```

When cloning groups with children you can clone all children too:

```jsx
const group = app.create('group')
// ... add children to group ...
const groupClone = group.clone(true) // deep clone with all children
```

## Removing

Nodes can be removed from the world:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: 'red'
})

app.add(box)

// later...
app.remove(box)
```

## Events

Nodes can emit and listen to events. This is useful for building interactive objects:

```jsx
const button = app.create('prim', {
  type: 'box',
  size: [1, 0.2, 1],
  color: 'blue'
})

button.on('grabStart', () => {
  console.log('Button grabbed')
  button.color = 'yellow'
})

button.on('grabEnd', () => {
  console.log('Button released')
  button.color = 'blue'
})

app.add(button)
```

## Text

You can create text nodes to render text in the world:

```jsx
const label = app.create('text', {
  text: 'Hello World',
  fontSize: 0.5,
  color: '#ffffff'
})

label.position.y = 2

app.add(label)
```

## Concepts

### Position

Position is a vector with x, y, z coordinates:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: 'red'
})

box.position.x = 1
box.position.y = 2
box.position.z = 3

// or set all at once
box.position.set(1, 2, 3)
```

### Rotation

Rotation is expressed as Euler angles in radians:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: 'red'
})

// Rotate 90 degrees around Y axis (convert degrees to radians with DEG2RAD)
box.rotation.y = 90 * DEG2RAD
```

### Scale

Scale lets you make objects bigger or smaller:

```jsx
const box = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: 'red'
})

box.scale.set(2, 2, 2) // make it twice as big
```

### Color

Colors can be hex strings or color names:

```jsx
const box1 = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: '#ff0000'  // hex
})

const box2 = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  color: 'red'  // named color
})

box1.color = 'blue'  // change after creation
```

## Performance Tips

- Reuse geometry where possible (clone instead of creating new)
- Use static physics for objects that don't need to move
- Limit the number of dynamic physics bodies
- Use position/rotation instead of constantly recreating objects

## Common Patterns

### A Simple Chair

```jsx
const seat = app.create('prim', {
  type: 'box',
  size: [0.5, 0.05, 0.5],
  color: '#8B4513'
})

seat.position.y = 0.4

app.add(seat)

for (let i = 0; i < 4; i++) {
  const leg = app.create('prim', {
    type: 'cylinder',
    size: [0.05, 0.05, 0.4],
    color: '#8B4513'
  })

  leg.position.y = 0.2

  if (i === 0 || i === 2) {
    leg.position.x = -0.15
  } else {
    leg.position.x = 0.15
  }

  if (i === 0 || i === 1) {
    leg.position.z = -0.15
  } else {
    leg.position.z = 0.15
  }

  app.add(leg)
}

const backrest = app.create('prim', {
  type: 'box',
  size: [0.5, 0.5, 0.05],
  color: '#8B4513'
})

backrest.position.y = 0.65
backrest.position.z = -0.225

app.add(backrest)
```

### A Simple Desk

```jsx
const top = app.create('prim', {
  type: 'box',
  size: [2, 0.05, 1],
  color: '#654321',
  physics: 'static'
})

top.position.y = 0.75

app.add(top)

for (let i = 0; i < 4; i++) {
  const leg = app.create('prim', {
    type: 'box',
    size: [0.1, 0.75, 0.1],
    color: '#8B4513'
  })

  leg.position.y = 0.375

  if (i === 0 || i === 2) {
    leg.position.x = -0.9
  } else {
    leg.position.x = 0.9
  }

  if (i === 0 || i === 1) {
    leg.position.z = -0.4
  } else {
    leg.position.z = 0.4
  }

  app.add(leg)
}
```
