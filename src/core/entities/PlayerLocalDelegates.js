export class PlayerLocalDelegates {
  static getCam(player) {
    return player.controller.camera
  }

  static getCamHeight(player) {
    return player.controller.camera.camHeight
  }

  static setCamHeight(player, value) {
    player.controller.camera.camHeight = value
  }

  static getStick(player) {
    return player.controlBinder.stick
  }

  static setStick(player, value) {
    player.controlBinder.stick = value
  }

  static getPan(player) {
    return player.controlBinder.pan
  }

  static setPan(player, value) {
    player.controlBinder.pan = value
  }

  static delegateStateManager(player, method, args) {
    return player.stateManager[method](...args)
  }

  static delegateAvatarManager(player, method, args) {
    return player.avatarManager[method](...args)
  }
}
