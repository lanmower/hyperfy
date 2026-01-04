export class Node {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  setWidth(w) { this.width = w; return this; }
  setHeight(h) { this.height = h; return this; }
  setFlex() { return this; }
  setPadding() { return this; }
  setMargin() { return this; }
  getComputedWidth() { return this.width; }
  getComputedHeight() { return this.height; }
  calculateLayout() { return this; }
}

export async function init() {
  return { Node };
}

export default { Node, init };
