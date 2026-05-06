import { api } from './api'

const PAGE_LIMIT = Number(process.env.NEXT_PUBLIC_PAGE_LIMIT) || 10

export const ideaService = {
  async getIdeas({ page = 1, limit = PAGE_LIMIT, sort = '-date', search = '', tags = [] } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    params.set('sort', sort)
    if (search) params.set('search', search)
    if (tags && tags.length > 0) {
      tags.forEach((tag) => params.append('tags', tag))
    }
    const res = await api.get(`/ideas?${params.toString()}`)
    return { ideas: res.data?.ideas || [], meta: res.meta || {} }
  },

  async getIdea(id) {
    const res = await api.get(`/ideas/${id}`)
    return res.data?.idea
  },

  async getMyIdeas({ page = 1, limit = PAGE_LIMIT, sort = '-date' } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    params.set('sort', sort)
    const res = await api.get(`/ideas/me?${params.toString()}`)
    return { ideas: res.data?.ideas || [], meta: res.meta || {} }
  },

  async createIdea({ title, description, tags, files = [] }) {
    const formData = new FormData()
    formData.set('title', title)
    formData.set('description', description)
    formData.set('tags', JSON.stringify(tags || []))
    files.forEach((file) => formData.append('files', file))

    const res = await api.post('/ideas', formData)
    return res.data?.idea
  },

  async updateIdea(id, { title, description, tags, files = [], removeFileUrls = [] }) {
    const formData = new FormData()
    if (typeof title === 'string') formData.set('title', title)
    if (typeof description === 'string') formData.set('description', description)
    if (Array.isArray(tags)) formData.set('tags', JSON.stringify(tags))
    if (removeFileUrls.length > 0) {
      formData.set('removeFileUrls', JSON.stringify(removeFileUrls))
    }
    files.forEach((file) => formData.append('files', file))

    const res = await api.patch(`/ideas/${id}`, formData)
    return res.data?.idea
  },

  async deleteIdea(id) {
    await api.delete(`/ideas/${id}`)
  },
}
