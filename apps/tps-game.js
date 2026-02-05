import { getMap, getSpawnPoint } from '../config/maps.js'
import { getGameMode } from '../config/game-modes.js'

export default {
  server: {
    setup(ctx) {
      const mapName = 'schwust'
      const modeName = 'ffa'
      const map = getMap(mapName)
      const mode = getGameMode(modeName)

      ctx.state.map = mapName
      ctx.state.mode = modeName
      ctx.state.players = []
      ctx.state.started = Date.now()
      ctx.state.gameTime = 0

      ctx.debug.section('TPS GAME INITIALIZED')
      ctx.debug.state('game', 'map', mapName)
      ctx.debug.state('game', 'mode', modeName)
      ctx.debug.state('game', 'max_players', mode.maxPlayers)
      ctx.debug.state('game', 'spawn_points', map.spawnPoints.length)

      // Load the map collider
      try {
        ctx.world.spawn('map', {
          app: 'environment',
          model: map.model,
          position: [0, 0, 0]
        })
        ctx.debug.spawn('map', [0, 0, 0])
      } catch (e) {
        ctx.debug.error('map', e.message)
      }

      // Load game pattern apps on demand
      ctx.state.appLoaders = {
        'player-controller': true,
        'weapon-hitscan': true,
        'score-tracker': true,
        'spawn-manager': true
      }
    },

    update(ctx, dt) {
      const state = ctx.state
      state.gameTime = (Date.now() - state.started) / 1000

      if (state.gameTime > 0.1 && state.players.length < 10) {
        const spawn = getSpawnPoint(state.map, state.players.length)
        const playerId = 'player_' + (state.players.length + 1)
        state.players.push(playerId)
      }
    },

    onMessage(ctx, msg) {
      if (msg && msg.type === 'game_start') {
        ctx.debug.log('Game started with players: ' + ctx.state.players.length)
      }
    }
  },

  client: {
    render(ctx) {
      return {
        position: ctx.entity.position,
        custom: {
          game: ctx.state.map,
          mode: ctx.state.mode,
          time: ctx.state.gameTime.toFixed(1)
        }
      }
    }
  }
}
