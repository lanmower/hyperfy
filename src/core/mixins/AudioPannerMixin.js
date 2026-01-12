/* Shared audio panner properties for Audio and Video nodes */

export const AudioPannerMixin = {
  setupAudioPannerProperties() {
    return {
      distanceModel: { type: 'string', default: 'inverse', onSet() { if (this.pannerNode) this.pannerNode.distanceModel = this._distanceModel } },
      refDistance: { type: 'number', default: 1, onSet() { if (this.pannerNode) this.pannerNode.refDistance = this._refDistance } },
      maxDistance: { type: 'number', default: 10000, onSet() { if (this.pannerNode) this.pannerNode.maxDistance = this._maxDistance } },
      rolloffFactor: { type: 'number', default: 1, onSet() { if (this.pannerNode) this.pannerNode.rolloffFactor = this._rolloffFactor } },
      coneInnerAngle: { type: 'number', default: 360, onSet() { if (this.pannerNode) this.pannerNode.coneInnerAngle = this._coneInnerAngle } },
      coneOuterAngle: { type: 'number', default: 360, onSet() { if (this.pannerNode) this.pannerNode.coneOuterAngle = this._coneOuterAngle } },
      coneOuterGain: { type: 'number', default: 0, onSet() { if (this.pannerNode) this.pannerNode.coneOuterGain = this._coneOuterGain } }
    }
  }
}
