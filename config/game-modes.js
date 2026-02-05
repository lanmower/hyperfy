export const GameModes = {
  ffa: {
    name: 'Free For All',
    type: 'ffa',
    teams: 1,
    respawnTime: 3,
    maxPlayers: 16,
    health: 100,
    damagePerHit: 25,
    friendlyFire: false,
    settings: {
      timeLimit: 600,
      killLimit: 50,
      scorePerKill: 1,
      scorePerDeath: 0
    }
  },

  tdm: {
    name: 'Team Deathmatch',
    type: 'tdm',
    teams: 2,
    respawnTime: 5,
    maxPlayers: 16,
    health: 100,
    damagePerHit: 25,
    friendlyFire: false,
    settings: {
      timeLimit: 600,
      scoreLimit: 100,
      scorePerKill: 1,
      scorePerTeamKill: -1
    }
  },

  hardcore: {
    name: 'Hardcore FFA',
    type: 'ffa',
    teams: 1,
    respawnTime: 1,
    maxPlayers: 16,
    health: 50,
    damagePerHit: 50,
    friendlyFire: true,
    settings: {
      timeLimit: 300,
      killLimit: 25,
      scorePerKill: 2,
      scorePerDeath: 0
    }
  }
}

export function getGameMode(mode) {
  return GameModes[mode]
}

export function validateGameMode(mode) {
  return mode in GameModes
}

export function getGameModesList() {
  return Object.keys(GameModes)
}
