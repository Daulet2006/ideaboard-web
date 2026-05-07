'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { getApiErrorMessage } from '../../lib/api-error'
import { voteService } from '../../services/vote.service'
import styles from './VoteButtons.module.css'

export default function VoteButtons({ ideaId, initialVotesCount = 0, initialVoteState = null, onVoteChange }) {
  const { isAuthenticated } = useAuth()
  const { t } = useLocale()
  const [votesCount, setVotesCount] = useState(initialVotesCount)
  const [voteState, setVoteState] = useState(initialVoteState)
  const [isLoading, setIsLoading] = useState(false)
  const loadedVoteStateRef = useRef(false)

  useEffect(() => {
    setVotesCount(initialVotesCount)
  }, [initialVotesCount])

  useEffect(() => {
    setVoteState(initialVoteState)
  }, [initialVoteState])

  useEffect(() => {
    if (!isAuthenticated || !ideaId || initialVoteState !== null || loadedVoteStateRef.current) return

    loadedVoteStateRef.current = true
    voteService
      .getUserVote(ideaId)
      .then((state) => {
        setVoteState(state)
      })
      .catch(() => {
        // ignore vote-state fetch errors
      })
  }, [ideaId, initialVoteState, isAuthenticated])

  const handleVote = useCallback(async (value) => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
    if (isLoading) return

    const prevCount = votesCount
    const prevState = voteState

    let newCount = votesCount
    let newState = voteState

    if (voteState === value) {
      newCount -= value
      newState = null
    } else if (voteState !== null) {
      newCount += value * 2
      newState = value
    } else {
      newCount += value
      newState = value
    }

    setVotesCount(newCount)
    setVoteState(newState)

    setIsLoading(true)
    try {
      const data = await voteService.castVote(ideaId, value)
      setVotesCount(data.idea?.votesCount ?? newCount)
      setVoteState(data.voteState ?? newState)
      onVoteChange?.({ votesCount: data.idea?.votesCount ?? newCount, voteState: data.voteState ?? newState })
    } catch (err) {
      setVotesCount(prevCount)
      setVoteState(prevState)
      if (err.status === 403) {
        toast.error(t('cannotVoteOwnIdea'))
      } else {
        toast.error(getApiErrorMessage(err, t('failedAction')))
      }
    } finally {
      setIsLoading(false)
    }
  }, [ideaId, isAuthenticated, isLoading, voteState, votesCount, onVoteChange, t])

  return (
    <div className={styles.container}>
      <button
        className={`${styles.btn} ${voteState === 1 ? styles.upActive : ''}`}
        onClick={() => handleVote(1)}
        aria-label="Upvote"
        disabled={isLoading}
        title={isAuthenticated ? t('upvote') : t('loginToVote')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <span className={`${styles.count} ${voteState === 1 ? styles.countUp : ''} ${voteState === -1 ? styles.countDown : ''}`}>
        {votesCount}
      </span>

      <button
        className={`${styles.btn} ${voteState === -1 ? styles.downActive : ''}`}
        onClick={() => handleVote(-1)}
        aria-label="Downvote"
        disabled={isLoading}
        title={isAuthenticated ? t('downvote') : t('loginToVote')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  )
}
