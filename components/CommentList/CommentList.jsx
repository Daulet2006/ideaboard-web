'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { useWebSocketEvent } from '../../hooks/useWebSocket'
import { getApiErrorMessage } from '../../lib/api-error'
import { commentService } from '../../services/comment.service'
import CommentItem from '../CommentItem/CommentItem'
import styles from './CommentList.module.css'

function toId(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value._id) return String(value._id)
  return String(value)
}

function buildCommentTree(flatComments) {
  const byId = new Map(
    flatComments.map((comment) => [String(comment._id), { ...comment, replies: [] }])
  )
  const roots = []

  flatComments.forEach((comment) => {
    const commentId = String(comment._id)
    const parentId = toId(comment.parentComment)
    const node = byId.get(commentId)

    if (parentId && byId.has(parentId)) {
      byId.get(parentId).replies.push(node)
      return
    }

    roots.push(node)
  })

  return roots
}

function removeCommentThread(flatComments, rootId) {
  const removeIds = new Set([String(rootId)])
  let changed = true

  while (changed) {
    changed = false
    flatComments.forEach((comment) => {
      const commentId = String(comment._id)
      const parentId = toId(comment.parentComment)
      if (parentId && removeIds.has(parentId) && !removeIds.has(commentId)) {
        removeIds.add(commentId)
        changed = true
      }
    })
  }

  return flatComments.filter((comment) => !removeIds.has(String(comment._id)))
}

export default function CommentList({ ideaId }) {
  const { isAuthenticated } = useAuth()
  const { t } = useLocale()
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  const upsertComment = useCallback((incomingComment) => {
    setComments((prev) => {
      const exists = prev.some((comment) => comment._id === incomingComment._id)
      if (exists) {
        return prev.map((comment) =>
          comment._id === incomingComment._id ? incomingComment : comment
        )
      }
      return [incomingComment, ...prev]
    })
  }, [])

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
    setIsLoading(true)
    setError('')
    fetchComments()
  }, [fetchComments])

  const handleNewComment = useCallback(
    (payload) => {
      if (String(payload.ideaId) === String(ideaId) && payload.comment) {
        upsertComment(payload.comment)
      }
    },
    [ideaId, upsertComment]
  )
  useWebSocketEvent('NEW_COMMENT', handleNewComment)

  const handleCommentUpdated = useCallback(
    (payload) => {
      if (String(payload.ideaId) !== String(ideaId) || !payload.comment) return
      upsertComment(payload.comment)
    },
    [ideaId, upsertComment]
  )
  useWebSocketEvent('COMMENT_UPDATED', handleCommentUpdated)

  const handleCommentVoteUpdated = useCallback(
    (payload) => {
      if (!payload || !payload.commentId) return
      setComments((prev) =>
        prev.map((comment) => {
          if (String(comment._id) !== String(payload.commentId)) return comment
          return {
            ...comment,
            votesCount: payload.votesCount ?? comment.votesCount ?? 0,
            likesCount: payload.likesCount ?? comment.likesCount ?? 0,
            dislikesCount: payload.dislikesCount ?? comment.dislikesCount ?? 0,
          }
        })
      )
    },
    []
  )
  useWebSocketEvent('COMMENT_VOTE_UPDATE', handleCommentVoteUpdated)

  async function createComment(content, parentComment = null) {
    const created = await commentService.addComment(ideaId, content, parentComment)
    upsertComment(created)
    return created
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitError('')
    setIsSubmitting(true)

    try {
      await createComment(newComment.trim())
      setNewComment('')
    } catch (err) {
      const message = getApiErrorMessage(err, t('postFailed'))
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDelete(id) {
    setComments((prev) => removeCommentThread(prev, id))
  }

  function handleUpdate(updatedComment) {
    upsertComment(updatedComment)
  }

  function handleReply(replyComment) {
    upsertComment(replyComment)
  }

  function handleVoteChange(commentId, voteData) {
    setComments((prev) =>
      prev.map((comment) => {
        if (String(comment._id) !== String(commentId)) return comment
        return {
          ...comment,
          votesCount: voteData.votesCount ?? comment.votesCount ?? 0,
          likesCount: voteData.likesCount ?? comment.likesCount ?? 0,
          dislikesCount: voteData.dislikesCount ?? comment.dislikesCount ?? 0,
          myVote: voteData.voteState ?? null,
        }
      })
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
          {commentTree.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              ideaId={ideaId}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onReply={handleReply}
              onVoteChange={handleVoteChange}
            />
          ))}
        </div>
      )}
    </section>
  )
}

