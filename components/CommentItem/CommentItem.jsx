'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { getApiErrorMessage } from '../../lib/api-error'
import { toApiAssetUrl } from '../../services/api'
import { commentService } from '../../services/comment.service'
import VoteButtons from '../VoteButtons/VoteButtons'
import styles from './CommentItem.module.css'

const MAX_REPLY_DEPTH = 8

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

export default function CommentItem({
  comment,
  ideaId,
  onDelete,
  onUpdate,
  onReply,
  onVoteChange,
  depth = 0,
}) {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [isReplySubmitting, setIsReplySubmitting] = useState(false)
  const canManage = isAuthenticated && (
    user?._id === comment.author?._id || user?.role === 'admin' || user?.role === 'moderator'
  )
  const canReply = isAuthenticated && depth < MAX_REPLY_DEPTH

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await commentService.deleteComment(comment._id)
      onDelete?.(comment._id)
      toast.success(t('delete'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
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
      toast.error(getApiErrorMessage(err, t('failedAction')))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReplySubmit() {
    const content = replyDraft.trim()
    if (!content || !ideaId) return

    setIsReplySubmitting(true)
    try {
      const replyComment = await commentService.addComment(ideaId, content, comment._id)
      setReplyDraft('')
      setIsReplying(false)
      onReply?.(replyComment)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('postFailed')))
    } finally {
      setIsReplySubmitting(false)
    }
  }

  return (
    <div className={styles.commentWrap}>
      <div className={styles.comment}>
        <div className={styles.avatar}>
          {comment.author?.avatarUrl ? (
            <img src={toApiAssetUrl(comment.author.avatarUrl)} alt={comment.author.username} />
          ) : (
            <span>{comment.author?.username?.[0]?.toUpperCase()}</span>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.layout}>
            <div className={styles.contentCol}>
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

              <div className={styles.voteRow}>
                <VoteButtons
                  targetId={comment._id}
                  targetType="comment"
                  initialVotesCount={comment.likesCount ?? 0}
                  initialVoteState={comment.myVote ?? null}
                  onVoteChange={(voteData) => onVoteChange?.(comment._id, voteData)}
                />
              </div>

              {isReplying && (
                <div className={styles.replyBox}>
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    className={styles.textarea}
                    placeholder={t('shareThoughts')}
                  />
                  <div className={styles.editActions}>
                    <button
                      onClick={() => {
                        setReplyDraft('')
                        setIsReplying(false)
                      }}
                      className={styles.cancelBtn}
                      disabled={isReplySubmitting}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      className={styles.saveBtn}
                      disabled={isReplySubmitting || !replyDraft.trim()}
                    >
                      {isReplySubmitting ? t('loading') : t('postComment')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sideCol}>
              <div className={styles.metaBox}>
                <span className={styles.username}>{comment.author?.username}</span>
                <span className={styles.time}>{timeAgo(comment.createdAt)}</span>
              </div>

              <div className={styles.actionBox}>
                {canReply && !isEditing && (
                  <button
                    onClick={() => setIsReplying((prev) => !prev)}
                    className={styles.actionBtn}
                    aria-label="Reply to comment"
                  >
                    {t('reply')}
                  </button>
                )}

                {canManage && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={styles.actionBtn}
                    aria-label="Edit comment"
                  >
                    {t('edit')}
                  </button>
                )}

                {canManage && !confirmDelete && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={isDeleting}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    aria-label="Delete comment"
                  >
                    {t('delete')}
                  </button>
                )}

                {canManage && confirmDelete && (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      aria-label="Delete comment"
                    >
                      {isDeleting ? '…' : t('confirmDeleteComment')}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className={styles.actionBtn}
                    >
                      {t('cancel')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              ideaId={ideaId}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onReply={onReply}
              onVoteChange={onVoteChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
