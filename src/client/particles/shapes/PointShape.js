export function createPointShape() {
  return (pos, dir) => {
    pos.set(0, 0, 0)
    dir.set(0, 1, 0)
  }
}
