import { api } from './api'

export const voteService = {
  async castVote(ideaId, value) {
    const res = await api.post(`/ideas/${ideaId}/vote`, { value })
    return res.data
  },

  async getUserVote(ideaId) {
    const res = await api.get(`/ideas/${ideaId}/vote`)
    return res.data?.voteState ?? null
  },
}
