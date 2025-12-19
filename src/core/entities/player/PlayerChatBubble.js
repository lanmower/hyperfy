export class PlayerChatBubble {
  constructor(playerLocal) {
    this.playerLocal = playerLocal
    this.chatTimer = null
  }

  setSpeaking(speaking) {
    if (this.playerLocal.speaking === speaking) return
    if (speaking && this.playerLocal.isMuted()) return
    this.playerLocal.speaking = speaking
  }

  chat(msg) {
    this.playerLocal.nametag.active = false
    this.playerLocal.bubbleText.value = msg
    this.playerLocal.bubble.active = true
    clearTimeout(this.chatTimer)
    this.chatTimer = setTimeout(() => {
      this.playerLocal.bubble.active = false
      this.playerLocal.nametag.active = true
    }, 5000)
  }
}
