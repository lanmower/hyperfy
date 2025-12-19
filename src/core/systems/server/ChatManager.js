export class ChatManager {
  constructor(network) {
    this.network = network
  }

  handleChatAdded(socket, msg) {
    this.network.chat.add(msg, false)
    this.network.socketManager.send('chatAdded', msg, socket.id)
  }

  handleCommand(socket, args) {
    this.network.commandHandler.execute(socket, args)
  }
}
