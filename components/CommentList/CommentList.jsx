'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { useWebSocketEvent } from '../../hooks/useWebSocket'
import { commentService } from '../../services/comment.service'
import CommentItem from '../CommentItem/CommentItem'
import styles from './CommentList.module.css'

export default function CommentList({ ideaId }) {
  const { isAuthenticated } = useAuth()
  const { t } = useLocale()
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchComments = useCallback(async () => {
    if (!ideaId) return
    try {
      const data = await commentService.getComments(ideaId)
      setComments(data)
    } catch {
      setError(t('commentsLoadError'))
    } finally {
      setIsLoading(false)
    }
  }, [ideaId, t])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleNewComment = useCallback(
    (payload) => {
      if (String(payload.ideaId) === String(ideaId)) {
        setComments((prev) => {
          const exists = prev.some((c) => c._id === payload.comment._id)
          if (exists) return prev
          return [payload.comment, ...prev]
        })
      }
    },
    [ideaId]
  )
  useWebSocketEvent('NEW_COMMENT', handleNewComment)

  const handleCommentUpdated = useCallback(
    (payload) => {
      if (String(payload.ideaId) !== String(ideaId)) return
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === payload.comment._id ? payload.comment : comment
        )
      )
    },
    [ideaId]
  )
  useWebSocketEvent('COMMENT_UPDATED', handleCommentUpdated)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const comment = await commentService.addComment(ideaId, newComment.trim())
      setComments((prev) => {
        const exists = prev.some((c) => c._id === comment._id)
        if (exists) return prev
        return [comment, ...prev]
      })
      setNewComment('')
    } catch (err) {
      if (err.status === 422) {
        setSubmitError(err.data?.message || t('failedAction'))
      } else {
        setSubmitError(t('postFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDelete(id) {
    setComments((prev) => prev.filter((c) => c._id !== id))
  }

  function handleUpdate(updatedComment) {
    setComments((prev) =>
      prev.map((comment) =>
        comment._id === updatedComment._id ? updatedComment : comment
      )
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        {t('comments')}
        {comments.length > 0 && (
          <span className={styles.count}>{comments.length}</span>
        )}
      </h2>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value)
              setSubmitError('')
            }}
            placeholder={t('shareThoughts')}
            maxLength={1000}
            rows={3}
            className={styles.textarea}
            aria-label="Add a comment"
          />
          {submitError && <span className={styles.submitError}>{submitError}</span>}
          <div className={styles.formFooter}>
            <span className={styles.charCount}>{newComment.length}/1000</span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className={styles.submitBtn}
            >
              {isSubmitting ? <span className={styles.spinner} /> : t('postComment')}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.loginPrompt}>
          <a href="/login" className={styles.loginLink}>{t('login')}</a> {t('loginToComment')}
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>
          {[...Array(3)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      )}

      {error && !isLoading && (
        <p className={styles.error}>{error}</p>
      )}

      {!isLoading && comments.length === 0 && !error && (
        <p className={styles.empty}>{t('noComments')}</p>
      )}

      {!isLoading && comments.length > 0 && (
        <div className={styles.list}>
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </section>
  )
}
