'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { Bell, Globe, Monitor, Moon, Sun, Users, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useWebSocketEvent } from '../../hooks/useWebSocket'
import { getApiErrorMessage } from '../../lib/api-error'
import { toApiAssetUrl } from '../../services/api'
import { authService } from '../../services/auth.service'
import styles from './AppSidebar.module.css'

export default function AppSidebar() {
  const { user, isAuthenticated } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { onlineUsers, isConnected } = useWebSocket()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const role = user?.role || 'user'
  const roleClass = role === 'admin' ? styles.admin : role === 'moderator' ? styles.moderator : styles.user

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { notifications: items, meta } = await authService.getNotifications({ page: 1, limit: 20 })
        setNotifications(items)
        setUnreadCount(meta.unreadCount || 0)
      } catch {
        // ignore
      }
    }

    loadNotifications()
  }, [])

  useWebSocketEvent('NOTIFICATION', (payload) => {
    if (!payload?.notification) return
    const item = payload.notification
    const itemId = item._id || item.id
    if (!itemId) return

    setNotifications((prev) => {
      const deduped = prev.filter((entry) => (entry._id || entry.id) !== itemId)
      return [item, ...deduped].slice(0, 20)
    })
    setUnreadCount((prev) => prev + 1)
    toast.info(item.title, { description: item.message })
  })

  async function markNotificationRead(notificationId) {
    try {
      const updated = await authService.markNotificationRead(notificationId)
      setNotifications((prev) => prev.map((item) => ((item._id || item.id) === (updated._id || updated.id) ? updated : item)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    }
  }

  const localeOptions = useMemo(
    () => [
      { value: 'ru', label: 'RU' },
      { value: 'kk', label: 'KZ' },
      { value: 'en', label: 'EN' },
    ],
    []
  )

  if (!isAuthenticated || !user) return null

  return (
    <aside className={`${styles.sidebar} ${roleClass}`}>
      <section className={`${styles.card} ${styles.heroCard}`}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            {user?.avatarUrl ? (
              <img src={toApiAssetUrl(user.avatarUrl)} alt={user.username} />
            ) : (
              <span>{user?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className={styles.username}>{user?.username}</p>
                <p className={styles.role}>{role}</p>
              </div>
            </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>
          <Wrench size={14} />
          {t('settings')}
        </h3>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            <Globe size={13} />
            {t('language')}
          </span>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className={styles.select}>
            {localeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            {theme === 'light' ? <Sun size={13} /> : theme === 'dark' ? <Moon size={13} /> : <Monitor size={13} />}
            {t('theme')}
          </span>
          <select value={theme || 'system'} onChange={(e) => setTheme(e.target.value)} className={styles.select}>
            <option value="system">{t('system')}</option>
            <option value="light">{t('light')}</option>
            <option value="dark">{t('dark')}</option>
          </select>
        </label>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>
          <Users size={14} />
          {t('online')}
        </h3>
        <p className={styles.onlineText}>
          {isConnected ? `${onlineUsers.count} ${t('usersOnline')}` : t('offline')}
        </p>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>
          <Bell size={14} />
          {t('notifications')}
          {unreadCount > 0 && <span className={styles.unread}>{unreadCount}</span>}
        </h3>
        {notifications.length === 0 ? (
          <p className={styles.empty}>{t('noNotifications')}</p>
        ) : (
          <div className={styles.notificationList}>
            {notifications.map((item) => (
              <article key={item._id || item.id} className={styles.notificationItem}>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                {!item.readAt && (
                  <button
                    type="button"
                    className={styles.readBtn}
                    onClick={() => markNotificationRead(item._id || item.id)}
                  >
                    {t('markRead')}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </aside>
  )
}
