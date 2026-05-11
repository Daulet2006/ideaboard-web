'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { getApiErrorMessage } from '../../lib/api-error'
import { toApiAssetUrl } from '../../services/api'
import { ideaService } from '../../services/idea.service'
import FilePreviewCard from '../FilePreviewCard/FilePreviewCard'
import VoteButtons from '../VoteButtons/VoteButtons'
import styles from './IdeaCard.module.css'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function IdeaCard({ idea, onDelete, onVoteChange, onTagClick }) {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLocale()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const canManage = isAuthenticated && (
    user?._id === idea.author?._id || user?.role === 'admin' || user?.role === 'moderator'
  )

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await ideaService.deleteIdea(idea._id)
      onDelete?.(idea._id)
      toast.success(t('delete'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const descriptionPreview =
    idea.description?.length > 160
      ? idea.description.slice(0, 160) + '…'
      : idea.description

  return (
    <div className={styles.card}>
      <div className={styles.votes}>
        <VoteButtons
          targetId={idea._id}
          targetType="idea"
          initialVotesCount={idea.votesCount ?? 0}
          initialVoteState={idea.myVote ?? null}
          onVoteChange={onVoteChange}
        />
      </div>

      <div className={styles.body}>
        <Link href={`/ideas/${idea._id}`} className={styles.titleLink}>
          <h2 className={styles.title}>{idea.title}</h2>
        </Link>

        {descriptionPreview && (
          <p className={styles.description}>{descriptionPreview}</p>
        )}

        {idea.tags?.length > 0 && (
          <div className={styles.tags}>
            {idea.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.tag}
                onClick={() => onTagClick?.(tag)}
                aria-label={`Filter by tag ${tag}`}
              >
                {tag}
              </button>
            ))}
            {idea.files?.length > 0 && (
              <span className={styles.fileTag}>{idea.files.length} file(s)</span>
            )}
          </div>
        )}

        {idea.files?.length > 0 && (
          <div className={styles.filePreviews}>
            {idea.files.slice(0, 2).map((file) => (
              <FilePreviewCard key={file.url} file={file} t={t} />
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.meta}>
            <div className={styles.author}>
              <div className={styles.authorAvatar}>
                {idea.author?.avatarUrl ? (
                  <img src={toApiAssetUrl(idea.author.avatarUrl)} alt={idea.author.username} />
                ) : (
                  <span>{idea.author?.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className={styles.authorName}>{idea.author?.username}</span>
            </div>
            <span className={styles.dot}>&middot;</span>
            <span className={styles.time}>{timeAgo(idea.createdAt)}</span>
          </div>

          {canManage && (
            <div className={styles.actions}>
              <Link href={`/ideas/${idea._id}/edit`} className={styles.editBtn}>
                {t('edit')}
              </Link>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                  className={styles.deleteBtn}
                >
                  {t('delete')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={styles.deleteBtn}
                  >
                    {isDeleting ? '…' : t('confirmDeleteIdea')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className={styles.editBtn}
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
