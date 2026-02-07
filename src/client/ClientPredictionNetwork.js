import { PredictionEngine } from './PredictionEngine.js'

export class ClientPredictionNetwork {
  constructor(config = {}) {
    this.config = config
    this.predictionEngine = null
  }

  initPrediction(playerId, tickRate) {
    this.predictionEngine = new PredictionEngine(tickRate)
    this.predictionEngine.init(playerId)
  }

  addInput(input) {
    if (this.predictionEngine) {
      this.predictionEngine.addInput(input)
    }
  }

  onServerSnapshot(snapshotData, tick) {
    if (this.predictionEngine) {
      this.predictionEngine.onServerSnapshot(snapshotData, tick)
    }
  }

  setMovement(movement) {
    if (this.predictionEngine) {
      this.predictionEngine.setMovement(movement)
    }
  }

  setGravity(gravity) {
    if (this.predictionEngine) {
      this.predictionEngine.setGravity(gravity)
    }
  }

  getDisplayState(tick, offset = 0) {
    if (this.predictionEngine) {
      return this.predictionEngine.getDisplayState(tick, offset)
    }
    return null
  }

  getLocalState() {
    if (this.predictionEngine) {
      return this.predictionEngine.localState
    }
    return null
  }

  isPredictionEnabled() {
    return this.predictionEngine !== null
  }

  getEngine() {
    return this.predictionEngine
  }
}
