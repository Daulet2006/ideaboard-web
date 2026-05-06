import { api } from './api'

export const commentService = {
  async getComments(ideaId) {
    const res = await api.get(`/ideas/${ideaId}/comments`)
    return res.data?.comments || []
  },

  async addComment(ideaId, content) {
    const res = await api.post(`/ideas/${ideaId}/comments`, { content })
    return res.data?.comment
  },

  async updateComment(commentId, content) {
    const res = await api.patch(`/comments/${commentId}`, { content })
    return res.data?.comment
  },

  async deleteComment(commentId) {
    await api.delete(`/comments/${commentId}`)
  },
}
