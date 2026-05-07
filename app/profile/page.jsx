'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { getApiErrorMessage } from '../../lib/api-error'
import { toApiAssetUrl } from '../../services/api'
import { authService } from '../../services/auth.service'
import { ideaService } from '../../services/idea.service'
import AppShell from '../../components/AppShell/AppShell'
import styles from './page.module.css'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', avatar: null })
  const [isSaving, setIsSaving] = useState(false)
  const [myIdeas, setMyIdeas] = useState([])
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [messageDraft, setMessageDraft] = useState({ recipientId: '', title: '', message: '' })

  const isModeratorPanelVisible = user?.role === 'admin' || user?.role === 'moderator'
  const isAdmin = user?.role === 'admin'
  const isModerator = user?.role === 'moderator'

  const getEntityId = (entity) => entity?._id || entity?.id || ''

  const avatarPreview = useMemo(() => {
    if (!form.avatar) return ''
    return URL.createObjectURL(form.avatar)
  }, [form.avatar])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      username: user.username || '',
      email: user.email || '',
    }))
  }, [user])

  useEffect(() => {
    async function loadMyIdeas() {
      if (!isAuthenticated) return
      try {
        const { ideas } = await ideaService.getMyIdeas({ page: 1, limit: 10, sort: '-date' })
        setMyIdeas(ideas)
      } catch {
        setMyIdeas([])
      } finally {
        setIdeasLoading(false)
      }
    }

    if (!isLoading && isAuthenticated) {
      loadMyIdeas()
    }
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    async function loadUsers() {
      if (!isModeratorPanelVisible) return
      setUsersLoading(true)
      try {
        const { users: userList } = await authService.getUsers({ page: 1, limit: 30, search: userSearch })
        const seen = new Set()
        const uniqueUsers = (userList || []).filter((entry) => {
          const id = entry?._id || entry?.id || ''
          if (!id || seen.has(id)) return false
          seen.add(id)
          return true
        })
        setUsers(uniqueUsers)
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('failedAction')))
      } finally {
        setUsersLoading(false)
      }
    }

    const timer = setTimeout(loadUsers, 300)
    return () => clearTimeout(timer)
  }, [isModeratorPanelVisible, userSearch, t])

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const updatedUser = await authService.updateProfile({
        username: form.username.trim(),
        email: form.email.trim(),
        avatar: form.avatar,
      })
      updateUser(updatedUser)
      setForm((prev) => ({ ...prev, avatar: null }))
      toast.success(t('profileUpdated'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveAvatar() {
    setIsSaving(true)
    try {
      const updatedUser = await authService.updateProfile({
        username: form.username.trim(),
        email: form.email.trim(),
        removeAvatar: true,
      })
      updateUser(updatedUser)
      setForm((prev) => ({ ...prev, avatar: null }))
      toast.success(t('removedAvatar'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRoleChange(targetUserId, role) {
    try {
      const updated = await authService.updateUserRole(targetUserId, role)
      const updatedId = getEntityId(updated)
      setUsers((prev) => prev.map((item) => (getEntityId(item) === updatedId ? updated : item)))
      toast.success(t('save'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    }
  }

  async function handleBanToggle(targetUser) {
    try {
      const updated = await authService.setUserBan(getEntityId(targetUser), {
        isBanned: !targetUser.isBanned,
        reason: !targetUser.isBanned ? 'Moderation action' : '',
      })
      const updatedId = getEntityId(updated)
      setUsers((prev) => prev.map((item) => (getEntityId(item) === updatedId ? updated : item)))
      toast.success(t('save'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    }
  }

  async function handleSendNotification(event) {
    event.preventDefault()
    try {
      await authService.sendNotification(messageDraft)
      setMessageDraft({ recipientId: '', title: '', message: '' })
      toast.success(t('messageSent'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    }
  }

  if (isLoading || !user) {
    return (
      <AppShell>
        <main className={styles.main}>
          <div className={styles.skeleton} />
        </main>
      </AppShell>
    )
  }

  const joined = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <AppShell>
      <main className={styles.main}>
        <div className={`${styles.card} ${isAdmin ? styles.adminCard : ''} ${isModerator ? styles.moderatorCard : ''}`}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.username} />
              ) : user.avatarUrl ? (
                <img
                  src={toApiAssetUrl(user.avatarUrl)}
                  alt={user.username}
                />
              ) : (
                <span className={styles.avatarInitial}>
                  {user.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className={styles.identity}>
              <h1 className={styles.username}>{user.username}</h1>
              <p className={styles.email}>{user.email}</p>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('role')}</span>
              <span className={`${styles.badge} ${isAdmin ? styles.adminBadge : ''} ${isModerator ? styles.moderatorBadge : ''}`}>
                {user.role || 'user'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('memberSince')}</span>
              <span className={styles.detailValue}>{joined}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('userId')}</span>
              <span className={styles.detailMono}>{user._id || user.id}</span>
            </div>
          </div>

          <div className={styles.divider} />

          <form onSubmit={handleProfileSubmit} className={styles.form}>
            <h2 className={styles.sectionTitle}>{t('updateProfile')}</h2>

            <label className={styles.field}>
              <span className={styles.detailLabel}>{t('username')}</span>
              <input
                className={styles.input}
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                maxLength={30}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.detailLabel}>{t('email')}</span>
              <input
                className={styles.input}
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.detailLabel}>Avatar</span>
              <input
                className={styles.input}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, avatar: e.target.files?.[0] || null }))
                }
              />
            </label>

            <div className={styles.inlineActions}>
              <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                {isSaving ? t('loading') : t('saveProfile')}
              </button>
              {user.avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar} className={styles.removeAvatarBtn} disabled={isSaving}>
                  {t('removeAvatar')}
                </button>
              )}
            </div>
          </form>

          <div className={styles.divider} />

          <section className={styles.ideasSection}>
            <h2 className={styles.sectionTitle}>{t('myIdeas')}</h2>
            {ideasLoading ? (
              <p className={styles.detailValue}>{t('loading')}</p>
            ) : myIdeas.length === 0 ? (
              <p className={styles.detailValue}>{t('noIdeasYet')}</p>
            ) : (
              <ul className={styles.ideaList}>
                {myIdeas.map((idea) => (
                  <li key={idea._id}>
                    <a href={`/ideas/${idea._id}`} className={styles.ideaLink}>
                      {idea.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isModeratorPanelVisible && (
            <>
              <div className={styles.divider} />
              <section className={styles.ideasSection}>
                <h2 className={`${styles.sectionTitle} ${styles.modTitle}`}>
                  {isAdmin ? t('adminControlCenter') : t('moderatorConsole')}
                </h2>
                <input
                  className={styles.input}
                  placeholder={t('searchUsers')}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {usersLoading ? (
                  <p className={styles.detailValue}>{t('loading')}</p>
                ) : (
                    <div className={styles.userTable}>
                      {users.map((target) => (
                      <div key={getEntityId(target)} className={`${styles.userRow} ${target.isBanned ? styles.userRowBanned : ''}`}>
                        <div className={styles.userMeta}>
                          <strong>{target.username}</strong>
                          <span>{target.email}</span>
                        </div>
                        <div className={styles.userActions}>
                          {isAdmin && (
                            <select
                              className={styles.input}
                              value={target.role}
                              disabled={getEntityId(target) === getEntityId(user)}
                              onChange={(e) => handleRoleChange(getEntityId(target), e.target.value)}
                            >
                              <option key={`role-user-${getEntityId(target)}`} value="user">user</option>
                              <option key={`role-mod-${getEntityId(target)}`} value="moderator">moderator</option>
                              <option key={`role-admin-${getEntityId(target)}`} value="admin">admin</option>
                            </select>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              className={styles.removeAvatarBtn}
                              onClick={() => handleBanToggle(target)}
                              disabled={getEntityId(target) === getEntityId(user) || target.role === 'admin'}
                            >
                              {target.isBanned ? t('unban') : t('ban')}
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.saveBtn}
                            onClick={() => setMessageDraft((prev) => ({ ...prev, recipientId: getEntityId(target) }))}
                          >
                            {t('message')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendNotification} className={styles.form}>
                  <h3 className={styles.sectionTitle}>{t('sendNotification')}</h3>
                  <select
                    className={styles.input}
                    value={messageDraft.recipientId}
                    onChange={(e) => setMessageDraft((prev) => ({ ...prev, recipientId: e.target.value }))}
                    required
                  >
                    <option value="">{t('selectUser')}</option>
                    {users.map((target) => (
                      <option key={getEntityId(target)} value={getEntityId(target)}>{target.username}</option>
                    ))}
                  </select>
                  <input
                    className={styles.input}
                    value={messageDraft.title}
                    placeholder={t('title')}
                    onChange={(e) => setMessageDraft((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <textarea
                    className={styles.input}
                    value={messageDraft.message}
                    placeholder={t('message')}
                    rows={3}
                    onChange={(e) => setMessageDraft((prev) => ({ ...prev, message: e.target.value }))}
                    required
                  />
                  <button type="submit" className={styles.saveBtn}>{t('send')}</button>
                </form>
              </section>
            </>
          )}

        </div>
      </main>
    </AppShell>
  )
}
