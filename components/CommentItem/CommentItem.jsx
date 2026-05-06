'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { toApiAssetUrl } from '../../services/api'
import { commentService } from '../../services/comment.service'
import styles from './CommentItem.module.css'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function CommentItem({ comment, onDelete, onUpdate }) {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const canManage = isAuthenticated && (
    user?._id === comment.author?._id || user?.role === 'admin' || user?.role === 'moderator'
  )

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await commentService.deleteComment(comment._id)
      onDelete?.(comment._id)
      toast.success(t('delete'))
    } catch (err) {
      toast.error(err?.message || t('failedAction'))
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleSaveEdit() {
    const content = draft.trim()
    if (!content) return

    setIsSaving(true)
    try {
      const updatedComment = await commentService.updateComment(comment._id, content)
      setDraft(updatedComment.content)
      setIsEditing(false)
      onUpdate?.(updatedComment)
      toast.success(t('save'))
    } catch (err) {
      toast.error(err?.message || t('failedAction'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.comment}>
      <div className={styles.avatar}>
        {comment.author?.avatarUrl ? (
          <img src={toApiAssetUrl(comment.author.avatarUrl)} alt={comment.author.username} />
        ) : (
          <span>{comment.author?.username?.[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.username}>{comment.author?.username}</span>
          <span className={styles.dot}>&middot;</span>
          <span className={styles.time}>{timeAgo(comment.createdAt)}</span>
          {canManage && (
            <>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.editBtn}
                  aria-label="Edit comment"
                >
                  {t('edit')}
                </button>
              )}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                  className={styles.deleteBtn}
                  aria-label="Delete comment"
                >
                  {t('delete')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={styles.deleteBtn}
                    aria-label="Delete comment"
                  >
                    {isDeleting ? '…' : t('confirmDeleteComment')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className={styles.cancelBtn}
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
        {isEditing ? (
          <div className={styles.editBox}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={1000}
              rows={3}
              className={styles.textarea}
            />
            <div className={styles.editActions}>
              <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className={styles.saveBtn}
                disabled={isSaving || !draft.trim()}
              >
                {isSaving ? t('loading') : t('save')}
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.content}>{comment.content}</p>
        )}
      </div>
    </div>
  )
}
