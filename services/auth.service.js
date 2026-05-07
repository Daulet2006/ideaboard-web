import { api } from './api'
import { normalizeAuthPayload } from '../lib/api-error'

function normalizeUserShape(user) {
  if (!user) return null
  return {
    ...user,
    _id: user._id || user.id || null,
  }
}

function normalizeNotificationShape(notification) {
  if (!notification) return null
  return {
    ...notification,
    _id: notification._id || notification.id || null,
  }
}

export const authService = {
  async register({ username, email, password }) {
    const payload = normalizeAuthPayload({ username, email, password })
    const res = await api.post('/auth/register', payload)
    return res.data
  },

  async login({ email, password }) {
    const payload = normalizeAuthPayload({ email, password })
    const res = await api.post('/auth/login', payload)
    return res.data
  },

  async getMe() {
    const res = await api.get('/auth/me')
    return res.data?.user
  },

  async updateProfile({ username, email, avatar, removeAvatar = false }) {
    const formData = new FormData()

    if (typeof username === 'string') formData.set('username', username)
    if (typeof email === 'string') formData.set('email', email)
    if (removeAvatar) formData.set('removeAvatar', 'true')
    if (avatar) formData.set('avatar', avatar)

    const res = await api.patch('/auth/me', formData)
    return res.data?.user
  },

  async getUsers(params = {}) {
    const search = new URLSearchParams()
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    if (params.search) search.set('search', params.search)
    if (params.role) search.set('role', params.role)
    if (typeof params.isBanned === 'boolean') search.set('isBanned', String(params.isBanned))

    const query = search.toString()
    const res = await api.get(`/auth/users${query ? `?${query}` : ''}`)
    const users = (res.data?.users || []).map(normalizeUserShape).filter(Boolean)
    return { users, meta: res.meta || {} }
  },

  async updateUserRole(userId, role) {
    const res = await api.patch(`/auth/users/${userId}/role`, { role })
    return normalizeUserShape(res.data?.user)
  },

  async setUserBan(userId, { isBanned, reason = '' }) {
    const res = await api.patch(`/auth/users/${userId}/ban`, { isBanned, reason })
    return normalizeUserShape(res.data?.user)
  },

  async sendNotification({ recipientId, title, message, type = 'direct' }) {
    const res = await api.post('/auth/notifications', { recipientId, title, message, type })
    return normalizeNotificationShape(res.data?.notification)
  },

  async getNotifications({ page = 1, limit = 20 } = {}) {
    const res = await api.get(`/auth/notifications?page=${page}&limit=${limit}`)
    const notifications = (res.data?.notifications || []).map(normalizeNotificationShape).filter(Boolean)
    return { notifications, meta: res.meta || {} }
  },

  async markNotificationRead(notificationId) {
    const res = await api.patch(`/auth/notifications/${notificationId}/read`, {})
    return normalizeNotificationShape(res.data?.notification)
  },
}
