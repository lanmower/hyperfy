export class LayoutCalculator {
  constructor(yoga) {
    this.yoga = yoga
  }

  calculate(width, height, direction = 0) {
    if (!this.yoga) return

    this.yoga.calculateLayout(width, height, direction)
    return this.getLayout()
  }

  getLayout() {
    if (!this.yoga) return null

    return {
      width: this.yoga.getComputedWidth(),
      height: this.yoga.getComputedHeight(),
      top: this.yoga.getComputedTop(),
      left: this.yoga.getComputedLeft(),
    }
  }

  setStyle(prop, value) {
    if (!this.yoga) return

    const styleMethod = `set${prop.charAt(0).toUpperCase() + prop.slice(1)}`
    if (typeof this.yoga[styleMethod] === 'function') {
      this.yoga[styleMethod](value)
    }
  }

  isDirty() {
    return this.yoga?.isDirty?.()
  }
}
