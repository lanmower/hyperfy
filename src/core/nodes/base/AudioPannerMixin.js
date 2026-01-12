export const AudioPannerMixin = {
  pannerProperties: {
    distanceModel: { onSet() { if (this.pannerNode) this.pannerNode.distanceModel = this._distanceModel } },
    refDistance: { onSet() { if (this.pannerNode) this.pannerNode.refDistance = this._refDistance } },
    maxDistance: { onSet() { if (this.pannerNode) this.pannerNode.maxDistance = this._maxDistance } },
    rolloffFactor: { onSet() { if (this.pannerNode) this.pannerNode.rolloffFactor = this._rolloffFactor } },
    coneInnerAngle: { onSet() { if (this.pannerNode) this.pannerNode.coneInnerAngle = this._coneInnerAngle } },
    coneOuterAngle: { onSet() { if (this.pannerNode) this.pannerNode.coneOuterAngle = this._coneOuterAngle } },
    coneOuterGain: { onSet() { if (this.pannerNode) this.pannerNode.coneOuterGain = this._coneOuterGain } },
  }
}
