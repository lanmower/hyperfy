export const Ranks = {
  DEFAULT: 0,
  ADMIN: 1,
  MODERATOR: 2,
  VIEWER: 3,
}

export function hasRank(userRank, requiredRank) {
  return userRank >= requiredRank
}
