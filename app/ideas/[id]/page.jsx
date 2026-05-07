'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '../../../hooks/useAuth'
import { useLocale } from '../../../hooks/useLocale'
import { useWebSocketEvent } from '../../../hooks/useWebSocket'
import { getApiErrorMessage } from '../../../lib/api-error'
import { toApiAssetUrl } from '../../../services/api'
import { ideaService } from '../../../services/idea.service'
import FilePreviewCard from '../../../components/FilePreviewCard/FilePreviewCard'
import AppShell from '../../../components/AppShell/AppShell'
import VoteButtons from '../../../components/VoteButtons/VoteButtons'
import CommentList from '../../../components/CommentList/CommentList'
import styles from './page.module.css'

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

export default function IdeaDetailPage() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  const [idea, setIdea] = useState(null)
  const [voteState, setVoteState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await ideaService.getIdea(id)
        setIdea(data)
        if (isAuthenticated) {
          setVoteState(data?.myVote ?? null)
        }
      } catch (err) {
        setError(err.status === 404 ? t('ideaNotFound') : t('ideaLoadFailed'))
      } finally {
        setIsLoading(false)
      }
    }
    if (id) load()
  }, [id, isAuthenticated, t])

  // Real-time vote updates
  const handleVoteUpdate = useCallback(
    (payload) => {
      if (payload.ideaId === id) {
        setIdea((prev) => prev ? { ...prev, votesCount: payload.votesCount } : prev)
      }
    },
    [id]
  )
  useWebSocketEvent('VOTE_UPDATE', handleVoteUpdate)

  function handleVoteChange({ votesCount, voteState: newState }) {
    setIdea((prev) => prev ? { ...prev, votesCount } : prev)
    setVoteState(newState)
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await ideaService.deleteIdea(id)
      toast.success(t('delete'))
      router.push('/')
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('failedAction')))
      setIsDeleting(false)
    }
  }

  const canManage = isAuthenticated && (
    user?._id === idea?.author?._id || user?.role === 'admin' || user?.role === 'moderator'
  )

  if (isLoading) {
    return (
      <AppShell>
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.skeleton} style={{ height: 40, width: '60%' }} />
            <div className={styles.skeleton} style={{ height: 120 }} />
          </div>
        </main>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <main className={styles.main}>
          <div className={styles.errorBox}>
            <p>{error}</p>
            <Link href="/" className={styles.backLink}>← {t('backToBoard')}</Link>
          </div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className={styles.main}>
        <div className={styles.backRow}>
          <Link href="/" className={styles.back}>← {t('backToBoard')}</Link>
        </div>

        <article className={styles.article}>
          <div className={styles.voteCol}>
            <VoteButtons
              ideaId={idea._id}
              initialVotesCount={idea.votesCount ?? 0}
              initialVoteState={voteState}
              onVoteChange={handleVoteChange}
            />
          </div>

          <div className={styles.content}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{idea.title}</h1>
              {canManage && (
                <div className={styles.ownerActions}>
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

            {idea.tags?.length > 0 && (
              <div className={styles.tags}>
                {idea.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}

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

            <div className={styles.divider} />

            <p className={styles.description}>{idea.description}</p>

            {idea.files?.length > 0 && (
              <div className={styles.filesBlock}>
                <h3 className={styles.filesTitle}>{t('files')}</h3>
                <div className={styles.filesList}>
                  {idea.files.map((file) => (
                    <FilePreviewCard key={file.url} file={file} t={t} />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.divider} />

            <CommentList ideaId={idea._id} />
          </div>
        </article>
      </main>
    </AppShell>
  )
}
