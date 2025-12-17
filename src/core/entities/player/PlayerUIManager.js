import { createNode } from '../../extras/createNode.js'

export class PlayerUIManager {
  constructor(player, world) {
    this.player = player
    this.world = world
    this.nametag = null
    this.bubble = null
    this.bubbleBox = null
    this.bubbleText = null
    this.initUI()
  }

  initUI() {
    this.nametag = createNode('nametag', { label: '', health: this.player.data.health, active: false })

    this.bubble = createNode('ui', {
      id: 'bubble',
      width: 300,
      height: 512,
      pivot: 'bottom-center',
      billboard: 'full',
      scaler: [3, 30],
      justifyContent: 'flex-end',
      alignItems: 'center',
      active: false,
    })

    this.bubbleBox = createNode('uiview', {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
    })

    this.bubbleText = createNode('uitext', {
      color: 'white',
      fontWeight: 100,
      lineHeight: 1.4,
      fontSize: 16,
    })

    this.bubble.add(this.bubbleBox)
    this.bubbleBox.add(this.bubbleText)
  }

  addToAura(aura) {
    aura.add(this.nametag)
    aura.add(this.bubble)
  }

  setText(text) {
    this.bubbleText.text = text
  }

  setNametagActive(active) {
    this.nametag.active = active
  }

  setBubbleActive(active) {
    this.bubble.active = active
  }

  updateForAvatar(avatar) {
    const headHeight = avatar.getHeadToHeight() + 0.2
    this.nametag.position.y = headHeight
    this.bubble.position.y = headHeight
  }
}
