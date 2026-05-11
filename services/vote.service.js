import { api } from './api'

function buildVotePath(targetType, targetId) {
  if (targetType === 'comment') return `/comments/${targetId}/vote`
  return `/ideas/${targetId}/vote`
}

export const voteService = {
  async castVote(targetId, value, targetType = 'idea') {
    const res = await api.post(buildVotePath(targetType, targetId), { value })
    return res.data
  },

  async getUserVote(targetId, targetType = 'idea') {
    const res = await api.get(buildVotePath(targetType, targetId))
    return res.data?.voteState ?? null
  },
}
